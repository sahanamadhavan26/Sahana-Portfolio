"""Remove only the phone illustration from the LinkedIn preview image.

The left-side portfolio text, badges, and overall image dimensions are preserved.
"""
from pathlib import Path
from PIL import Image, ImageDraw

path = Path("assets/img/og-image.png")
image = Image.open(path).convert("RGB")
width, height = image.size

# Locate the cream-to-dark panel boundary in the middle of the image.
y = height // 2
start = next(
    (x for x in range(width // 2, width - 1)
     if max(image.getpixel((x, y))) < 85
     and min(image.getpixel((x, y))) < 75),
    round(width * 0.69),
)
# Fill the entire dark panel with its existing top-right background tone.
# This removes the phone only, without changing the typography or badges.
background = image.getpixel((width - 8, 8))
draw = ImageDraw.Draw(image)
draw.rectangle((start, 0, width, height), fill=background)
image.save(path, optimize=True)
print(f"Updated {path}: {width}x{height}; right panel starts at x={start}")
