#!/usr/bin/env python3
"""把 10 张 Q版2.5D 小怪单图合成到一张 4x3 图集。

每个小怪按内容边界裁切、等比缩放到统一单元格并居中，背景使用纯绿
色键，运行时由 chroma shader 抠除。输出到
public/assets/monsters/stereo/atlas.webp。

Usage:
    python3 tools/compose-monster-atlas.py
"""

import json
import pathlib
import subprocess

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow is required: pip install Pillow")


ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = [ROOT / ".gen" / "stereo-monster" / f"{i}.webp" for i in range(10)]
OUT_DIR = ROOT / "public" / "assets" / "monsters" / "stereo"
COLS, ROWS = 4, 3
CELL = 256
GREEN = (0, 255, 0)


def sample_background(im):
    w, h = im.size
    patch = 10
    points = [(2, 2), (w - 2 - patch, 2), (2, h - 2 - patch), (w - 2 - patch, h - 2 - patch)]
    pixels = []
    for x, y in points:
        for yy in range(y, min(y + patch, h)):
            for xx in range(x, min(x + patch, w)):
                pixels.append(im.getpixel((xx, yy)))
    return tuple(round(sum(c[i] for c in pixels) / len(pixels)) for i in range(3))


def content_box(im, bg):
    w, h = im.size
    min_x, min_y, max_x, max_y = None, None, None, None
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            px = im.getpixel((x, y))
            if sum((a - b) ** 2 for a, b in zip(px, bg)) > 900:
                if min_x is None or x < min_x:
                    min_x = x
                if max_x is None or x > max_x:
                    max_x = x
                if min_y is None or y < min_y:
                    min_y = y
                if max_y is None or y > max_y:
                    max_y = y
    if min_x is None:
        return None
    return (min_x, min_y, max_x - min_x + 1, max_y - min_y + 1)


def main():
    sheet = Image.new("RGB", (CELL * COLS, CELL * ROWS), GREEN)
    for index, source in enumerate(SOURCES):
        if not source.exists():
            raise SystemExit(f"missing monster source: {source}")
        im = Image.open(source).convert("RGB")
        bg = sample_background(im)
        box = content_box(im, bg)
        if box is None:
            raise SystemExit(f"monster {index} is empty")
        frame = im.crop(box)
        scale = (CELL - 14) / max(frame.size)
        frame = frame.resize(
            (max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
            Image.Resampling.LANCZOS,
        )
        col, row = index % COLS, index // COLS
        x = col * CELL + (CELL - frame.width) // 2
        y = row * CELL + (CELL - frame.height) // 2
        sheet.paste(frame, (x, y))
        print(f"monster {index}: crop={box} -> {frame.size} at {col},{row}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_png = OUT_DIR / "atlas.png"
    final_webp = OUT_DIR / "atlas.webp"
    sheet.save(raw_png, "PNG")
    result = subprocess.run(
        ["cwebp", "-quiet", "-q", "86", str(raw_png), "-o", str(final_webp)],
        capture_output=True,
        text=True,
    )
    raw_png.unlink(missing_ok=True)
    if result.returncode != 0:
        raise SystemExit(f"cwebp failed: {result.stderr}")
    manifest = {"version": 1, "id": "stereo-monsters", "cols": COLS, "rows": ROWS, "cellOrder": [f"monster-{i}" for i in range(10)]}
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"composed {len(SOURCES)} monsters -> {final_webp}")


if __name__ == "__main__":
    main()
