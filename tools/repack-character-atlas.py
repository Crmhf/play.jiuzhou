#!/usr/bin/env python3
"""Normalize an AI-generated 节气行者 atlas into a clean 4x3 sprite sheet.

MiniMax and gpt-image-2 both occasionally add padding or extra rows to
generated sprite sheets. This tool crops every frame by its content bounding
box, rescales it to a uniform cell, and repacks the 12 frames into an exact
4x3 grid that the runtime shader expects.

Usage:
    python3 tools/repack-character-atlas.py [source.webp] [outputId]

The source defaults to .gen/raw-character-atlas/<outputId>/atlas.webp (or the
legacy .gen/raw-heling-atlas/atlas.webp for heling) and the result is written
to public/assets/characters/<outputId>/atlas.webp.
"""

import json
import pathlib
import subprocess
import sys

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow is required: pip install Pillow")


ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT_ID = sys.argv[2] if len(sys.argv) > 2 else "heling"
if len(sys.argv) > 1:
    SOURCE = pathlib.Path(sys.argv[1]).resolve()
elif OUTPUT_ID == "heling":
    SOURCE = ROOT / ".gen" / "raw-heling-atlas" / "atlas.webp"
else:
    SOURCE = ROOT / ".gen" / "raw-character-atlas" / OUTPUT_ID / "atlas.webp"
OUT_DIR = ROOT / "public" / "assets" / "characters" / OUTPUT_ID
COLS, ROWS = 4, 3
CELL = 256
GREEN = (0, 255, 0)


def sample_background(im):
    """Average the four corner patches; generated sheets use one chroma color."""
    w, h = im.size
    patch = 12
    points = [(2, 2), (w - 2 - patch, 2), (2, h - 2 - patch), (w - 2 - patch, h - 2 - patch)]
    pixels = []
    for x, y in points:
        for yy in range(y, min(y + patch, h)):
            for xx in range(x, min(x + patch, w)):
                pixels.append(im.getpixel((xx, yy)))
    if not pixels:
        raise SystemExit("empty image")
    return tuple(round(sum(channel[i] for channel in pixels) / len(pixels)) for i in range(3))


def content_box(cell_im, bg):
    w, h = cell_im.size
    min_x, min_y, max_x, max_y = None, None, None, None
    step = 2
    for y in range(0, h, step):
        for x in range(0, w, step):
            px = cell_im.getpixel((x, y))
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
    if not SOURCE.exists():
        raise SystemExit(f"missing source atlas: {SOURCE}")
    im = Image.open(SOURCE).convert("RGB")
    w, h = im.size
    bg = sample_background(im)
    print(f"source {SOURCE} {w}x{h}, background {bg}")

    cell_w, cell_h = w / COLS, h / ROWS
    frames = []
    for row in range(ROWS):
        for col in range(COLS):
            box = (
                int(col * cell_w),
                int(row * cell_h),
                int((col + 1) * cell_w),
                int((row + 1) * cell_h),
            )
            cell = im.crop(box)
            crop = content_box(cell, bg)
            if crop is None:
                raise SystemExit(f"cell {row},{col} is empty; cannot repack a 4x3 atlas")
            frame = cell.crop(crop)
            scale = (CELL - 16) / max(frame.size)
            frame = frame.resize(
                (max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
                Image.Resampling.LANCZOS,
            )
            print(f"  cell {row},{col}: crop={crop} -> {frame.size}")
            frames.append(frame)

    sheet = Image.new("RGB", (CELL * COLS, CELL * ROWS), GREEN)
    for index, frame in enumerate(frames):
        x = (index % COLS) * CELL + (CELL - frame.width) // 2
        y = (index // COLS) * CELL + (CELL - frame.height) // 2
        sheet.paste(frame, (x, y))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_png = OUT_DIR / "atlas.png"
    final_webp = OUT_DIR / "atlas.webp"
    sheet.save(raw_png, "PNG")
    result = subprocess.run(
        ["cwebp", "-quiet", "-q", "88", str(raw_png), "-o", str(final_webp)],
        capture_output=True,
        text=True,
    )
    raw_png.unlink(missing_ok=True)
    if result.returncode != 0:
        raise SystemExit(f"cwebp failed: {result.stderr}")

    manifest = {"version": 1, "id": OUTPUT_ID, "cols": COLS, "rows": ROWS, "artFacing": 1, "fps": 10}
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary_dir = ROOT / ".gen"
    summary_dir.mkdir(exist_ok=True)
    (summary_dir / f"atlas-{OUTPUT_ID}-repacked.json").write_text(
        json.dumps(
            {"generatedAt": "", "source": str(SOURCE.relative_to(ROOT)), "output": f"assets/characters/{OUTPUT_ID}/atlas.webp", "cols": COLS, "rows": ROWS},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"repacked {len(frames)} frames -> {final_webp}")


if __name__ == "__main__":
    main()
