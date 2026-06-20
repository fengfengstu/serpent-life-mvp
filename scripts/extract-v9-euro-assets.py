from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/Users/chris/.codex/generated_images/019ee15a-85f0-74f1-9668-30dc3a6c02e3/ig_07174638522d6fef016a367404895c8191b5c79fe159b87d69.png")
OUT = ROOT / "public" / "assets" / "generated" / "v9-euro"


CROPS = {
    "serpent/head.png": (84, 48, 225, 158),
    "serpent/body.png": (268, 35, 390, 220),
    "serpent/memory.png": (520, 30, 620, 220),
    "serpent/tail.png": (400, 35, 505, 220),
    "enemies/drifter.png": (1110, 80, 1215, 190),
    "enemies/hunter.png": (720, 36, 900, 220),
    "enemies/bloomer.png": (1360, 40, 1488, 180),
    "enemies/sentinel.png": (905, 36, 1080, 215),
    "bosses/warden.png": (35, 310, 355, 590),
    "bosses/crimson.png": (365, 300, 660, 590),
    "bosses/archivist.png": (680, 300, 980, 590),
    "pickups/memory.png": (340, 220, 395, 275),
    "pickups/skill-core.png": (440, 220, 500, 280),
    "pickups/potion.png": (505, 218, 560, 282),
    "skills/fire.png": (805, 635, 895, 735),
    "skills/frost.png": (685, 635, 755, 735),
    "skills/turret.png": (555, 635, 625, 735),
    "skills/shield.png": (960, 635, 1030, 735),
    "skills/lightning.png": (1094, 635, 1164, 735),
    "ui/hud.png": (30, 610, 520, 805),
    "ui/card-fire.png": (780, 615, 920, 790),
    "arena/tile-square.png": (1010, 300, 1155, 445),
    "arena/tile-circle.png": (1160, 300, 1320, 455),
    "arena/floor-source.png": (1010, 300, 1488, 585),
}


def parchment_alpha(r, g, b):
    light = r > 145 and g > 115 and b > 75
    warm = r >= g >= b - 12
    low_chroma = max(r, g, b) - min(r, g, b) < 82
    if light and warm and low_chroma:
        return 0
    if r > 205 and g > 178 and b > 130:
        return 25
    return 255


def trim_alpha(img):
    bbox = img.getbbox()
    if not bbox:
        return img
    img = img.crop(bbox)
    pad = 18
    out = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    out.alpha_composite(img, (pad, pad))
    return out


def clean_sprite(img, size):
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            alpha = parchment_alpha(r, g, b)
            if alpha == 0:
                px[x, y] = (r, g, b, 0)
            elif alpha < 255:
                px[x, y] = (r, g, b, min(a, alpha))
    img = trim_alpha(img)
    img = ImageEnhance.Contrast(img).enhance(1.08)
    img = ImageEnhance.Color(img).enhance(1.05)
    img.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(img, ((size - img.width) // 2, (size - img.height) // 2))
    return canvas


def make_arena(src):
    tile = Image.new("RGBA", (2048, 2048), (139, 124, 91, 255))
    d = ImageDraw.Draw(tile)
    random_seed = 19
    import random
    random.seed(random_seed)
    cell = 128
    for y in range(-cell, 2048 + cell, cell):
        for x in range(-cell, 2048 + cell, cell):
            ox = random.randint(-10, 10)
            oy = random.randint(-10, 10)
            shade = random.randint(-12, 14)
            fill = (139 + shade, 124 + shade, 91 + shade, 255)
            d.rounded_rectangle((x + ox, y + oy, x + cell + ox - 8, y + cell + oy - 8), radius=18, fill=fill, outline=(63, 55, 43, 115), width=4)
            if random.random() < 0.34:
                d.line((x + 22, y + random.randint(30, 96), x + cell - 28, y + random.randint(34, 100)), fill=(60, 51, 40, 90), width=3)
    for r, alpha in [(780, 42), (520, 30), (260, 22)]:
        d.ellipse((1024 - r, 1024 - r, 1024 + r, 1024 + r), outline=(176, 134, 60, alpha), width=10)
    veil = Image.new("RGBA", tile.size, (22, 31, 32, 26))
    tile.alpha_composite(veil)
    return tile.filter(ImageFilter.GaussianBlur(0.35))


def main():
    src = Image.open(SRC).convert("RGB")
    for rel, box in CROPS.items():
        path = OUT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        if rel == "arena/floor-source.png":
            continue
        if rel.startswith("arena/"):
            crop = src.crop(box).resize((512, 512), Image.Resampling.LANCZOS).convert("RGBA")
            crop.save(path)
            continue
        size = 512 if rel.startswith(("serpent", "enemies", "pickups", "skills")) else 768
        if rel.startswith("ui/"):
            size = 768
        clean_sprite(src.crop(box), size).save(path)
    make_arena(src).save(OUT / "arena" / "floor.png")
    hud_panel = (OUT / "ui" / "hud.png")
    if hud_panel.exists():
        Image.open(hud_panel).save(OUT / "ui" / "panel-9slice.png")


if __name__ == "__main__":
    main()
