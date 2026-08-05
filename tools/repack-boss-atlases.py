#!/usr/bin/env python3
"""Repack AI-generated boss sheets into strict 4x3 transparent sprite atlases.

AI image models often draw the requested 4x3 contact sheet without respecting the
mathematical cell boundaries. This tool finds the real gaps between rows/poses,
chroma-keys the green background and lays every pose into a safe UV cell.
"""
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image

COLS, ROWS = 4, 3


CUSTOM_BOUNDS = {
    # MiniMax occasionally produced five columns for Lü Bu. Drop near-duplicate
    # poses and preserve the four clearest silhouettes in each logical row.
    '03-lvbu': [
        (0, 0, 190, 385), (190, 0, 390, 385), (540, 0, 790, 385), (790, 0, 1024, 385),
        (0, 385, 210, 760), (360, 385, 570, 760), (555, 385, 790, 760), (790, 385, 1024, 760),
        (0, 760, 235, 1024), (200, 760, 450, 1024), (420, 760, 700, 1024), (700, 760, 1024, 1024),
    ],
    # Xu Chu arrived as a 4-row concept sheet. Curate twelve readable poses:
    # movement, hammer attacks, impact/hurt, kneel and prone death.
    '06-xuchu': [
        (0, 0, 210, 320), (200, 0, 340, 320), (320, 0, 560, 320), (740, 0, 1024, 320),
        (0, 320, 200, 545), (190, 320, 390, 545), (330, 320, 540, 545), (720, 320, 1024, 760),
        (0, 560, 210, 760), (210, 560, 470, 760), (180, 760, 370, 960), (690, 760, 1024, 960),
    ],
    # Xiahou Yuan was also a four-row sheet. The last logical row is curated
    # as ultimate, projectile, stagger and prone death.
    '08-xiahouyuan': [
        (0, 0, 245, 270), (245, 0, 480, 270), (480, 0, 740, 270), (740, 0, 960, 270),
        (0, 270, 235, 520), (235, 270, 490, 520), (490, 270, 740, 520), (740, 270, 1024, 520),
        (720, 520, 1024, 780), (190, 780, 560, 1024), (0, 780, 230, 1024), (560, 780, 1024, 1024),
    ],
}


@dataclass
class Component:
    runs: list[tuple[int, int, int]] = field(default_factory=list)
    area: int = 0
    min_x: int = 1 << 30
    max_x: int = -1
    min_y: int = 1 << 30
    max_y: int = -1
    sum_x: float = 0.0
    sum_y: float = 0.0

    def add(self, y: int, x0: int, x1: int) -> None:
        width = x1 - x0
        self.runs.append((y, x0, x1))
        self.area += width
        self.min_x, self.max_x = min(self.min_x, x0), max(self.max_x, x1 - 1)
        self.min_y, self.max_y = min(self.min_y, y), max(self.max_y, y)
        self.sum_x += (x0 + x1 - 1) * width * 0.5
        self.sum_y += y * width

    @property
    def cx(self) -> float: return self.sum_x / max(1, self.area)

    @property
    def cy(self) -> float: return self.sum_y / max(1, self.area)


def chroma_alpha(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    h, w, _ = rgb.shape
    sw = max(12, min(w, h) // 32)
    samples = np.concatenate([
        rgb[:sw, :sw].reshape(-1, 3), rgb[:sw, -sw:].reshape(-1, 3),
        rgb[-sw:, :sw].reshape(-1, 3), rgb[-sw:, -sw:].reshape(-1, 3),
    ]).astype(np.float32)
    greenish = samples[(samples[:, 1] > samples[:, 0] + 28) & (samples[:, 1] > samples[:, 2] + 18)]
    bg = np.median(greenish if len(greenish) else samples, axis=0)
    distance = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    alpha = (np.clip((distance - 18.0) / 68.0, 0.0, 1.0) * 255).astype(np.uint8)
    return alpha, bg.astype(np.uint8)


def components(mask: np.ndarray) -> list[Component]:
    """Fast run-length 8-neighbour component labelling."""
    parent: list[int] = []
    all_runs: list[tuple[int, int, int, int]] = []
    previous: list[tuple[int, int, int]] = []

    def new_label() -> int:
        i = len(parent); parent.append(i); return i

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i

    def union(a: int, b: int) -> int:
        a, b = find(a), find(b)
        if a != b: parent[b] = a
        return a

    for y, row in enumerate(mask):
        diff = np.diff(np.pad(row.astype(np.int8), (1, 1)))
        starts, ends = np.flatnonzero(diff == 1), np.flatnonzero(diff == -1)
        current: list[tuple[int, int, int]] = []
        cursor = 0
        for x0, x1 in zip(starts.tolist(), ends.tolist()):
            while cursor < len(previous) and previous[cursor][1] < x0 - 1: cursor += 1
            overlaps: list[int] = []
            j = cursor
            while j < len(previous) and previous[j][0] <= x1:
                if previous[j][1] >= x0 - 1: overlaps.append(previous[j][2])
                j += 1
            label = new_label() if not overlaps else overlaps[0]
            for other in overlaps[1:]: label = union(label, other)
            current.append((x0, x1, label)); all_runs.append((y, x0, x1, label))
        previous = current

    found: dict[int, Component] = {}
    for y, x0, x1, label in all_runs:
        found.setdefault(find(label), Component()).add(y, x0, x1)
    return list(found.values())


def smooth(values: np.ndarray, radius: int) -> np.ndarray:
    kernel = np.ones(radius * 2 + 1, dtype=np.float32) / (radius * 2 + 1)
    return np.convolve(values.astype(np.float32), kernel, mode='same')


def valley(projection: np.ndarray, lo: int, hi: int, preferred: int) -> int:
    lo, hi = max(1, lo), min(len(projection) - 1, hi)
    scores = smooth(projection, 5)[lo:hi]
    # Prefer a clean valley, with a light distance penalty to avoid choosing a remote page edge.
    positions = np.arange(lo, hi)
    normalized = scores / max(1.0, float(scores.max()))
    penalty = np.abs(positions - preferred) / max(1, hi - lo) * 0.12
    return int(positions[np.argmin(normalized + penalty)])


def extract_pose(rgb: np.ndarray, alpha: np.ndarray, bg: np.ndarray, main_only: bool = False) -> np.ndarray | None:
    mask = alpha >= 78
    found = [c for c in components(mask) if c.area >= 28]
    if not found: return None
    main = max(found, key=lambda c: c.area)
    threshold = max(38, int(main.area * 0.0025))
    kept = [main] if main_only else [c for c in found if c is main or c.area >= threshold]
    # Eliminate far-away caption fragments while retaining weapon sparks and detached shadows.
    diagonal = (rgb.shape[0] ** 2 + rgb.shape[1] ** 2) ** 0.5
    kept = [c for c in kept if c is main or (c.area >= main.area * .018 and
            ((c.cx - main.cx) ** 2 + (c.cy - main.cy) ** 2) ** .5 <= diagonal * .46)]
    x0, y0 = min(c.min_x for c in kept), min(c.min_y for c in kept)
    x1, y1 = max(c.max_x for c in kept) + 1, max(c.max_y for c in kept) + 1
    local_alpha = np.zeros((y1 - y0, x1 - x0), dtype=np.uint8)
    for c in kept:
        for y, rx0, rx1 in c.runs:
            local_alpha[y - y0, rx0 - x0:rx1 - x0] = alpha[y, rx0:rx1]
    # Preserve the original green-screen pixels around the actor. Replacing rejected
    # components with the sampled key color avoids captions without introducing
    # transparent WebP colour-block fringes.
    expanded = np.zeros_like(local_alpha, dtype=bool)
    core = local_alpha >= 1
    for dy in range(-2, 3):
        sy0, sy1 = max(0, -dy), min(core.shape[0], core.shape[0] - dy)
        dy0, dy1 = max(0, dy), min(core.shape[0], core.shape[0] + dy)
        for dx in range(-2, 3):
            sx0, sx1 = max(0, -dx), min(core.shape[1], core.shape[1] - dx)
            dx0, dx1 = max(0, dx), min(core.shape[1], core.shape[1] + dx)
            expanded[dy0:dy1, dx0:dx1] |= core[sy0:sy1, sx0:sx1]
    crop = rgb[y0:y1, x0:x1].copy()
    crop[~expanded] = bg
    return crop


def source_cells(mask: np.ndarray) -> list[tuple[int, int, int, int]]:
    h, w = mask.shape
    yproj = mask.sum(axis=1)
    y1 = valley(yproj, int(h * .27), int(h * .44), round(h / 3))
    y2 = valley(yproj, int(h * .57), int(h * .76), round(h * 2 / 3))
    y_edges = [0, y1, y2, h]
    cells: list[tuple[int, int, int, int]] = []
    for row in range(ROWS):
        top, bottom = y_edges[row], y_edges[row + 1]
        xproj = mask[top:bottom].sum(axis=0)
        x1 = valley(xproj, int(w * .16), int(w * .34), round(w / 4))
        x2 = valley(xproj, int(w * .40), int(w * .60), round(w / 2))
        x3 = valley(xproj, int(w * .66), int(w * .84), round(w * 3 / 4))
        x_edges = [0, x1, x2, x3, w]
        cells.extend((x_edges[col], top, x_edges[col + 1], bottom) for col in range(COLS))
    return cells


def repack(path: Path, backup_root: Path, force: bool) -> dict:
    manifest_path = path.parent / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    backup = backup_root / path.parent.name / path.name
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists(): shutil.copy2(path, backup)
    if manifest.get('repacked') and not force:
        return {'path': str(path), 'status': 'already-repacked'}

    source_path = backup if force and backup.exists() else path
    source = Image.open(source_path).convert('RGB')
    rgb = np.asarray(source); alpha, bg = chroma_alpha(rgb)
    h, w = alpha.shape
    bounds = CUSTOM_BOUNDS.get(path.parent.name, source_cells(alpha >= 78))
    poses: list[np.ndarray | None] = []
    curated = path.parent.name in CUSTOM_BOUNDS
    for x0, y0, x1, y1 in bounds:
        poses.append(extract_pose(rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1], bg, main_only=curated))

    atlas = Image.new('RGB', (w, h), tuple(int(v) for v in bg))
    cell_w = w // COLS
    y_edges = [round(r * h / ROWS) for r in range(ROWS + 1)]
    empty: list[int] = []
    scales: list[float] = []
    for index, pose in enumerate(poses):
        if pose is None:
            empty.append(index); continue
        image = Image.fromarray(pose, 'RGB')
        row, col = divmod(index, COLS)
        cell_h = y_edges[row + 1] - y_edges[row]
        scale = min((cell_w - 18) / image.width, (cell_h - 16) / image.height, 1.18)
        scales.append(scale)
        image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.LANCZOS)
        x = col * cell_w + (cell_w - image.width) // 2
        y = y_edges[row + 1] - image.height - 6
        atlas.paste(image, (x, y))

    atlas.save(path, 'WEBP', lossless=True, quality=100, method=6)
    manifest.update({'cols': COLS, 'rows': ROWS, 'repacked': True, 'transparent': False})
    manifest.pop('repackScale', None)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    return {'path': str(path), 'status': 'repacked', 'emptyFrames': empty,
            'scaleRange': [round(min(scales), 3), round(max(scales), 3)] if scales else []}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path('public/assets/bosses/animated'))
    parser.add_argument('--backup-root', type=Path, default=Path('.gen/raw-boss-atlases'))
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--ids', nargs='*', default=[])
    args = parser.parse_args()
    selected = set(args.ids)
    paths = sorted(args.root.glob('*/atlas.webp'))
    if selected: paths = [p for p in paths if p.parent.name in selected or p.parent.name.split('-', 1)[-1] in selected]
    results = [repack(path, args.backup_root, args.force) for path in paths]
    print(json.dumps(results, ensure_ascii=False, indent=2))
    if any(item.get('emptyFrames') for item in results):
        raise SystemExit('One or more generated atlases contain empty frames; inspect source sheets.')


if __name__ == '__main__': main()
