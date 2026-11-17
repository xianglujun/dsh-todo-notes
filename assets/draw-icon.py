"""
Draw the market tile for dsh-todo-notes.

The market's `icon:` field accepts only a GitHub-hosted raster image, while the
DSH plugin row uses `icon.svg`. Both show the same mark -- a checklist row -- but
a storefront tile needs its own background, so this one is a rounded accent
square with the mark in white.

Drawn at 4x and downsampled, which antialiases the strokes without any extra
dependency. Usage: python draw-icon.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 180
SCALE = 4
OUT = Path(__file__).resolve().parent / "icon-180.png"

ACCENT = (59, 130, 246, 255)
WHITE = (255, 255, 255, 255)


def scale(*values):
    return tuple(round(value * SCALE) for value in values)


image = Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# The tile: a rounded square, inset a little so the corner curve is not clipped.
draw.rounded_rectangle(scale(0, 0, SIZE, SIZE), radius=40 * SCALE, fill=ACCENT)

# The checkbox outline and its tick. The mark spans y 61..119, so it sits on the
# vertical centre of the 180px tile.
draw.rounded_rectangle(scale(34, 61, 92, 119), radius=16 * SCALE, outline=WHITE, width=9 * SCALE)
draw.line(scale(48, 91, 62, 105, 80, 75), fill=WHITE, width=9 * SCALE, joint="curve")

# The two text rows beside it.
draw.line(scale(112, 79, 148, 79), fill=WHITE, width=9 * SCALE)
draw.line(scale(112, 101, 136, 101), fill=WHITE, width=9 * SCALE)

image.resize((SIZE, SIZE), Image.LANCZOS).save(OUT)
print("wrote", OUT, OUT.stat().st_size, "bytes")
