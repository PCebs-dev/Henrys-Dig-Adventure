"""Remove cyan/black background from fish sprite PNG."""
from collections import deque
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets" / "boat"


def is_background(r, g, b):
    if b > 170 and g > 130 and r < 130:
        return True
    if r < 30 and g < 30 and b < 30:
        return True
    return False


def flood_transparent(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()
    remove = set()
    q = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if (x, y) in remove:
            continue
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        r, g, b, _ = px[x, y]
        if not is_background(r, g, b):
            continue
        remove.add((x, y))
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    for x, y in remove:
        px[x, y] = (0, 0, 0, 0)

    img.save(path)


if __name__ == "__main__":
    src = ASSETS / "shark-and-fish.png"
    fish_out = ASSETS / "fish.png"

    if src.exists() and not fish_out.exists():
        sheet = Image.open(src)
        fish_out.parent.mkdir(parents=True, exist_ok=True)
        sheet.crop((4, 104, 188, 202)).save(fish_out)

    if fish_out.exists():
        flood_transparent(fish_out)
        print(f"Processed {fish_out}")
