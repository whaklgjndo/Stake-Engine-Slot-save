from __future__ import annotations

import math
from pathlib import Path
from random import Random
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "src" / "stories" / "assets"
SOURCE_ROOT = Path(r"C:\Users\Tyler\OneDrive\Desktop\Symbols-and-Frame-Art\brand_new_symbol_set_pngs")

BACKGROUND_DIR = ASSET_ROOT / "background"
MIDGROUND_DIR = ASSET_ROOT / "midground"
BOARD_DIR = ASSET_ROOT / "board"
CELLS_DIR = ASSET_ROOT / "cells"
FX_DIR = ASSET_ROOT / "fx"
POST_DIR = ASSET_ROOT / "post"

BOARD_W = 568
BOARD_H = 568
FRAME_W = BOARD_W + 80
FRAME_H = BOARD_H + 80
CELL_SIZE = 104
CELL_GAP = 12


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def blend(c1: tuple[int, int, int, int], c2: tuple[int, int, int, int], t: float) -> tuple[int, int, int, int]:
    return tuple(lerp(c1[i], c2[i], t) for i in range(4))


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int, int], bottom: tuple[int, int, int, int]) -> Image.Image:
    width, height = size
    img = Image.new("RGBA", size)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(1, height - 1)
        draw.line((0, y, width, y), fill=blend(top, bottom, t))
    return img


def radial_glow(size: tuple[int, int], center: tuple[float, float], radius: float, color: tuple[int, int, int, int]) -> Image.Image:
    width, height = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = center
    steps = 18
    for step in range(steps, 0, -1):
        t = step / steps
        alpha = int(color[3] * (t ** 2))
        rx = radius * t
        ry = radius * t
        draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(color[0], color[1], color[2], alpha))
    return img.filter(ImageFilter.GaussianBlur(radius * 0.08))


def paste_center(base: Image.Image, overlay: Image.Image, center: tuple[int, int], scale: float = 1.0, alpha: float = 1.0) -> None:
    source = overlay.convert("RGBA")
    if scale != 1.0:
        source = source.resize(
            (max(1, int(source.width * scale)), max(1, int(source.height * scale))),
            Image.Resampling.LANCZOS,
        )
    if alpha != 1.0:
        source.putalpha(source.getchannel("A").point(lambda value: int(value * alpha)))
    x = int(center[0] - source.width / 2)
    y = int(center[1] - source.height / 2)
    base.alpha_composite(source, (x, y))


def load_source(name: str) -> Image.Image:
    return Image.open(SOURCE_ROOT / name).convert("RGBA")


def add_speckle(img: Image.Image, rng: Random, count: int, bounds: tuple[int, int, int, int], color_choices: Iterable[tuple[int, int, int, int]]) -> None:
    draw = ImageDraw.Draw(img)
    x1, y1, x2, y2 = bounds
    palette = list(color_choices)
    for _ in range(count):
        x = rng.randint(x1, x2)
        y = rng.randint(y1, y2)
        size = rng.randint(1, 3)
        color = palette[rng.randrange(len(palette))]
        draw.ellipse((x, y, x + size, y + size), fill=color)


def make_far_background() -> None:
    size = (2048, 1536)
    rng = Random(11)
    img = vertical_gradient(size, (7, 18, 26, 255), (4, 9, 16, 255))
    draw = ImageDraw.Draw(img)

    sky_glow = radial_glow(size, (1024, 260), 540, (64, 154, 216, 110))
    sunrise = radial_glow(size, (1024, 380), 320, (241, 171, 94, 60))
    img = Image.alpha_composite(img, sky_glow)
    img = Image.alpha_composite(img, sunrise)

    cliff_left = [(0, 840), (220, 620), (360, 480), (520, 520), (540, 1536), (0, 1536)]
    cliff_right = [(2048, 840), (1828, 620), (1688, 480), (1528, 520), (1508, 1536), (2048, 1536)]
    draw.polygon(cliff_left, fill=(14, 23, 24, 230))
    draw.polygon(cliff_right, fill=(15, 24, 27, 230))

    for base_y in (980, 1080, 1180):
        silhouette = Image.new("RGBA", size, (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(silhouette)
        x = -120
        while x < size[0] + 120:
            width = rng.randint(90, 180)
            height = rng.randint(140, 260)
            sdraw.ellipse((x, base_y - height, x + width, base_y), fill=(10, 20, 17, 210))
            sdraw.rectangle((x + width * 0.4, base_y - height * 0.6, x + width * 0.6, base_y + 10), fill=(10, 20, 17, 210))
            x += rng.randint(60, 120)
        img = Image.alpha_composite(img, silhouette.filter(ImageFilter.GaussianBlur(2.6)))

    vine_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vine_layer)
    for side in (0, size[0]):
        for idx in range(8):
            length = 260 + idx * 36
            x = 40 + idx * 38 if side == 0 else size[0] - 40 - idx * 38
            y = 120 + idx * 34
            vdraw.line((x, y, x + (-38 if side else 38), y + length), fill=(19, 35, 27, 180), width=4)
    img = Image.alpha_composite(img, vine_layer.filter(ImageFilter.GaussianBlur(1.4)))

    mist = radial_glow(size, (1024, 930), 620, (140, 214, 255, 30))
    img = Image.alpha_composite(img, mist)
    img.save(BACKGROUND_DIR / "bg_far.png")


def make_waterfalls() -> None:
    size = (2048, 1536)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    ribbons = [
        (720, 430, 130),
        (820, 390, 120),
        (1200, 390, 120),
        (1320, 420, 140),
    ]
    for x, top, width in ribbons:
        draw.rounded_rectangle((x, top, x + width, 1240), radius=42, fill=(164, 226, 255, 78))
        draw.rounded_rectangle((x + width * 0.2, top + 10, x + width * 0.8, 1240), radius=32, fill=(231, 247, 255, 52))
    spray = radial_glow(size, (1024, 1220), 420, (190, 238, 255, 64))
    img = Image.alpha_composite(img.filter(ImageFilter.GaussianBlur(10)), spray)
    img.save(BACKGROUND_DIR / "bg_waterfalls.png")


def make_haze() -> None:
    size = (2048, 1536)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((180, 300, 1860, 1220), fill=(125, 184, 224, 36))
    draw.ellipse((420, 180, 1620, 920), fill=(255, 207, 141, 22))
    draw.rounded_rectangle((160, 860, 1888, 1280), radius=160, fill=(199, 236, 255, 24))
    img = img.filter(ImageFilter.GaussianBlur(36))
    img.save(BACKGROUND_DIR / "bg_haze.png")


def make_bg_foliage_silhouette() -> None:
    size = (2048, 1536)
    rng = Random(17)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    x = -100
    while x < size[0] + 100:
        width = rng.randint(100, 200)
        height = rng.randint(180, 320)
        draw.ellipse((x, 1180 - height, x + width, 1180), fill=(8, 17, 18, 220))
        draw.rectangle((x + width * 0.42, 1180 - height * 0.62, x + width * 0.58, 1204), fill=(8, 17, 18, 220))
        x += rng.randint(50, 110)
    img = img.filter(ImageFilter.GaussianBlur(2))
    img.save(BACKGROUND_DIR / "bg_foliage_silhouette.png")


def make_portal_core() -> None:
    size = (1200, 1200)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    center = (600, 600)
    img = Image.alpha_composite(img, radial_glow(size, center, 360, (71, 194, 255, 140)))
    img = Image.alpha_composite(img, radial_glow(size, center, 220, (167, 240, 255, 110)))
    img = Image.alpha_composite(img, radial_glow(size, center, 110, (255, 255, 255, 140)))

    ring = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(ring)
    for width, color in (
        (18, (123, 224, 255, 160)),
        (6, (239, 253, 255, 190)),
    ):
        draw.ellipse((224, 224, 976, 976), outline=color, width=width)
    for angle in range(0, 360, 30):
        dx = 360 * __import__("math").cos(__import__("math").radians(angle))
        dy = 360 * __import__("math").sin(__import__("math").radians(angle))
        draw.line((600, 600, 600 + dx, 600 + dy), fill=(179, 231, 255, 60), width=4)
    ring = ring.filter(ImageFilter.GaussianBlur(1.4))
    img = Image.alpha_composite(img, ring)
    img.save(MIDGROUND_DIR / "portal_core.png")


def make_portal_glow() -> None:
    size = (1400, 1400)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    center = (700, 700)
    img = Image.alpha_composite(img, radial_glow(size, center, 520, (55, 160, 255, 110)))
    img = Image.alpha_composite(img, radial_glow(size, center, 640, (255, 194, 134, 54)))
    img = Image.alpha_composite(img, radial_glow(size, center, 760, (77, 184, 255, 34)))
    img.save(MIDGROUND_DIR / "portal_glow.png")


def make_portal_distortion_mask() -> None:
    size = (1200, 1200)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for idx in range(22):
        offset = idx * 18
        alpha = max(0, 42 - idx)
        draw.arc(
            (180 + offset, 210 + offset, 1020 - offset, 990 - offset),
            start=18,
            end=342,
            fill=(255, 255, 255, alpha),
            width=3,
        )
    for angle in range(0, 360, 45):
        dx = 278 * math.cos(math.radians(angle))
        dy = 278 * math.sin(math.radians(angle))
        draw.line((600, 600, 600 + dx, 600 + dy), fill=(255, 255, 255, 18), width=2)
    img = img.filter(ImageFilter.GaussianBlur(8))
    img.save(MIDGROUND_DIR / "portal_distortion_mask.png")


def make_arch_frame() -> None:
    size = (1800, 1400)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    outer = (230, 120, 1570, 1260)
    inner = (420, 280, 1380, 1180)
    draw.rounded_rectangle(outer, radius=300, fill=(44, 30, 18, 220), outline=(165, 126, 68, 220), width=18)
    draw.rounded_rectangle(inner, radius=220, fill=(0, 0, 0, 0), outline=(58, 46, 33, 160), width=64)
    draw.rounded_rectangle((290, 190, 1510, 1190), radius=260, outline=(217, 176, 96, 178), width=18)

    for x in (360, 1440):
        draw.rounded_rectangle((x - 76, 310, x + 76, 1170), radius=40, fill=(61, 46, 32, 210), outline=(182, 138, 78, 200), width=10)
    draw.polygon([(760, 220), (900, 112), (1040, 220), (1040, 340), (760, 340)], fill=(72, 55, 39, 220), outline=(220, 175, 104, 200))

    for pos in ((360, 280), (1440, 280), (360, 1180), (1440, 1180), (900, 180)):
        draw.ellipse((pos[0] - 28, pos[1] - 28, pos[0] + 28, pos[1] + 28), fill=(172, 52, 36, 220), outline=(255, 219, 162, 200), width=4)

    blue_wheel = load_source("14_blue_resonance_wheel.png")
    red_wheel = load_source("15_red_overdrive_wheel.png")
    paste_center(img, blue_wheel, (520, 520), scale=0.34, alpha=0.18)
    paste_center(img, red_wheel, (1280, 520), scale=0.34, alpha=0.18)

    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(MIDGROUND_DIR / "arch_frame.png")


def make_mid_rocks_foliage() -> None:
    size = (2048, 1536)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.polygon([(0, 1260), (240, 1120), (520, 1090), (760, 1190), (920, 1300), (0, 1536)], fill=(16, 22, 21, 230))
    draw.polygon([(2048, 1260), (1808, 1120), (1528, 1090), (1288, 1190), (1128, 1300), (2048, 1536)], fill=(16, 22, 21, 230))
    draw.polygon([(480, 1320), (720, 1170), (1024, 1120), (1328, 1170), (1568, 1320), (1568, 1536), (480, 1536)], fill=(18, 25, 24, 240))
    img = img.filter(ImageFilter.GaussianBlur(1.4))
    img.save(MIDGROUND_DIR / "mid_rocks_foliage.png")


def make_lantern(left: bool) -> Image.Image:
    size = (360, 640)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    x = 150 if left else 210
    draw.line((x, 20, x, 180), fill=(106, 82, 40, 220), width=8)
    draw.ellipse((x - 22, 8, x + 22, 48), outline=(225, 188, 108, 220), width=5)
    draw.rounded_rectangle((x - 82, 146, x + 82, 332), radius=42, fill=(64, 44, 24, 220), outline=(224, 181, 96, 220), width=8)
    draw.rounded_rectangle((x - 56, 176, x + 56, 302), radius=28, fill=(242, 179, 88, 78), outline=(255, 230, 184, 170), width=4)
    glow = radial_glow(size, (x, 238), 136, (255, 194, 112, 130))
    img = Image.alpha_composite(glow, img)
    return img


def make_lanterns() -> None:
    make_lantern(True).save(MIDGROUND_DIR / "lantern_left.png")
    make_lantern(False).save(MIDGROUND_DIR / "lantern_right.png")


def make_board_base() -> None:
    rng = Random(27)
    img = vertical_gradient((FRAME_W, FRAME_H), (49, 45, 39, 255), (19, 22, 27, 255))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((8, 8, FRAME_W - 8, FRAME_H - 8), radius=54, outline=(132, 112, 82, 120), width=4)
    draw.rounded_rectangle((28, 28, FRAME_W - 28, FRAME_H - 28), radius=42, fill=(34, 39, 44, 210))
    draw.rounded_rectangle((46, 46, FRAME_W - 46, FRAME_H - 46), radius=34, fill=(23, 27, 32, 235), outline=(102, 88, 62, 110), width=3)
    add_speckle(
        img,
        rng,
        850,
        (34, 34, FRAME_W - 34, FRAME_H - 34),
        [
            (255, 255, 255, 10),
            (158, 143, 120, 12),
            (60, 66, 74, 16),
        ],
    )
    img = Image.alpha_composite(img, radial_glow((FRAME_W, FRAME_H), (FRAME_W * 0.5, 120), 220, (118, 170, 229, 42)))
    img.save(BOARD_DIR / "board_base.png")


def make_board_trim() -> None:
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((18, 18, FRAME_W - 18, FRAME_H - 18), radius=48, outline=(236, 199, 114, 210), width=12)
    draw.rounded_rectangle((30, 30, FRAME_W - 30, FRAME_H - 30), radius=42, outline=(120, 82, 31, 220), width=3)
    draw.rounded_rectangle((44, 44, FRAME_W - 44, FRAME_H - 44), radius=34, outline=(255, 226, 165, 112), width=2)
    for pos in ((36, 36), (FRAME_W - 36, 36), (36, FRAME_H - 36), (FRAME_W - 36, FRAME_H - 36)):
        draw.ellipse((pos[0] - 10, pos[1] - 10, pos[0] + 10, pos[1] + 10), fill=(235, 200, 124, 220), outline=(255, 248, 213, 180), width=2)
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    img.save(BOARD_DIR / "board_trim_gold.png")


def make_board_ao() -> None:
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, FRAME_W, FRAME_H), radius=56, fill=(0, 0, 0, 0), outline=(0, 0, 0, 180), width=44)
    draw.rounded_rectangle((18, 18, FRAME_W - 18, FRAME_H - 18), radius=48, outline=(0, 0, 0, 82), width=20)
    img = img.filter(ImageFilter.GaussianBlur(18))
    img.save(BOARD_DIR / "board_ao.png")


def make_board_contact_shadow() -> None:
    size = (980, 280)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((90, 70, 890, 220), fill=(0, 0, 0, 190))
    img = img.filter(ImageFilter.GaussianBlur(28))
    img.save(BOARD_DIR / "board_contact_shadow.png")


def make_board_runes() -> None:
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rune_color = (100, 179, 255, 34)
    warm_color = (255, 196, 132, 22)
    coords = [
        (92, 84), (182, 84), (272, 84), (362, 84), (452, 84), (542, 84),
        (92, FRAME_H - 84), (182, FRAME_H - 84), (272, FRAME_H - 84), (362, FRAME_H - 84), (452, FRAME_H - 84), (542, FRAME_H - 84),
    ]
    for idx, (x, y) in enumerate(coords):
        color = rune_color if idx % 2 == 0 else warm_color
        draw.polygon((x, y - 10, x + 14, y, x, y + 10, x - 14, y), outline=color, width=3)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(BOARD_DIR / "board_runes.png")


def make_board_damage_detail() -> None:
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cracks = [
        ((112, 86), (92, 118), (104, 156), (82, 184)),
        ((FRAME_W - 110, 96), (FRAME_W - 132, 132), (FRAME_W - 120, 172)),
        ((158, FRAME_H - 94), (182, FRAME_H - 126), (170, FRAME_H - 164)),
        ((FRAME_W - 154, FRAME_H - 104), (FRAME_W - 182, FRAME_H - 136), (FRAME_W - 170, FRAME_H - 174)),
    ]
    for points in cracks:
        draw.line(points, fill=(22, 15, 12, 140), width=3)
        draw.line(points, fill=(115, 97, 70, 80), width=1)
    draw.arc((24, 24, 118, 118), start=180, end=276, fill=(255, 228, 166, 60), width=5)
    draw.arc((FRAME_W - 118, FRAME_H - 118, FRAME_W - 24, FRAME_H - 24), start=0, end=96, fill=(255, 228, 166, 54), width=5)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(BOARD_DIR / "board_damage_detail.png")


def make_board_moss_overlay() -> None:
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    moss_points = [
        (70, 110), (110, 88), (162, 96), (192, 122), (174, 154), (126, 148), (92, 140),
        (FRAME_W - 210, 118), (FRAME_W - 150, 92), (FRAME_W - 100, 106), (FRAME_W - 92, 148), (FRAME_W - 138, 164),
        (106, FRAME_H - 164), (148, FRAME_H - 184), (198, FRAME_H - 178), (210, FRAME_H - 138), (154, FRAME_H - 122),
    ]
    for idx in range(0, len(moss_points), 5):
        cluster = moss_points[idx:idx + 7]
        if len(cluster) >= 5:
            draw.polygon(cluster, fill=(72, 98, 54, 84))
    img = img.filter(ImageFilter.GaussianBlur(2.4))
    img.save(BOARD_DIR / "board_moss_overlay.png")


def make_board_cell_recess() -> None:
    img = Image.new("RGBA", (BOARD_W, BOARD_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for row in range(5):
        for col in range(5):
            x = col * (CELL_SIZE + CELL_GAP)
            y = row * (CELL_SIZE + CELL_GAP)
            draw.rounded_rectangle((x, y, x + CELL_SIZE, y + CELL_SIZE), radius=22, fill=(8, 12, 16, 112), outline=(255, 255, 255, 18), width=1)
            draw.rounded_rectangle((x + 5, y + 5, x + CELL_SIZE - 5, y + CELL_SIZE - 5), radius=18, outline=(0, 0, 0, 70), width=5)
            draw.arc((x + 6, y + 6, x + CELL_SIZE - 6, y + CELL_SIZE - 6), start=190, end=350, fill=(169, 205, 235, 26), width=3)
    img = img.filter(ImageFilter.GaussianBlur(0.2))
    img.save(BOARD_DIR / "board_cell_recess.png")


def make_cell_assets() -> None:
    base = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle((0, 0, CELL_SIZE, CELL_SIZE), radius=22, fill=(16, 23, 30, 206), outline=(255, 255, 255, 20), width=1)
    draw.rounded_rectangle((5, 5, CELL_SIZE - 5, CELL_SIZE - 5), radius=18, outline=(0, 0, 0, 60), width=5)
    base.save(CELLS_DIR / "cell_base.png")

    inner_shadow = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(inner_shadow)
    sdraw.rounded_rectangle((0, 0, CELL_SIZE, CELL_SIZE), radius=22, fill=(0, 0, 0, 0), outline=(0, 0, 0, 140), width=10)
    inner_shadow = inner_shadow.filter(ImageFilter.GaussianBlur(6))
    inner_shadow.save(CELLS_DIR / "cell_inner_shadow.png")

    win = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    win = Image.alpha_composite(win, radial_glow((CELL_SIZE, CELL_SIZE), (CELL_SIZE / 2, CELL_SIZE / 2), 44, (112, 193, 255, 110)))
    win = Image.alpha_composite(win, radial_glow((CELL_SIZE, CELL_SIZE), (CELL_SIZE / 2, CELL_SIZE / 2), 28, (255, 214, 136, 76)))
    win.save(CELLS_DIR / "cell_win_glow.png")


def make_post_vignette() -> None:
    size = (1600, 1200)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, *size), fill=(0, 0, 0, 120))
    center_clear = Image.new("RGBA", size, (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(center_clear)
    cdraw.ellipse((220, 80, 1380, 1020), fill=(255, 255, 255, 255))
    alpha = ImageChops.invert(center_clear.getchannel("A")).filter(ImageFilter.GaussianBlur(90))
    img.putalpha(alpha)
    img.save(POST_DIR / "post_vignette.png")


def make_fx_assets() -> None:
    soft = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    soft = Image.alpha_composite(soft, radial_glow((120, 120), (60, 60), 36, (255, 236, 208, 120)))
    soft.save(FX_DIR / "fx_particle_soft.png")

    magic = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    magic = Image.alpha_composite(magic, radial_glow((120, 120), (60, 60), 28, (114, 196, 255, 150)))
    draw = ImageDraw.Draw(magic)
    draw.line((60, 20, 60, 100), fill=(255, 255, 255, 120), width=3)
    draw.line((20, 60, 100, 60), fill=(255, 255, 255, 120), width=3)
    magic = magic.filter(ImageFilter.GaussianBlur(1.1))
    magic.save(FX_DIR / "fx_particle_magic.png")

    fog = Image.new("RGBA", (1024, 220), (0, 0, 0, 0))
    draw = ImageDraw.Draw(fog)
    for idx in range(8):
        x = 50 + idx * 118
        draw.ellipse((x, 46 + (idx % 2) * 16, x + 260, 188), fill=(209, 236, 255, 26))
    fog = fog.filter(ImageFilter.GaussianBlur(18))
    fog.save(FX_DIR / "fx_fog_strip.png")

    ray = Image.new("RGBA", (420, 980), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ray)
    draw.polygon(((210, 0), (280, 0), (420, 980), (0, 980)), fill=(180, 228, 255, 50))
    ray = ray.filter(ImageFilter.GaussianBlur(12))
    ray.save(FX_DIR / "fx_light_ray.png")


def main() -> None:
    for path in (BACKGROUND_DIR, MIDGROUND_DIR, BOARD_DIR, CELLS_DIR, FX_DIR, POST_DIR):
        path.mkdir(parents=True, exist_ok=True)

    make_far_background()
    make_waterfalls()
    make_haze()
    make_bg_foliage_silhouette()
    make_portal_core()
    make_portal_glow()
    make_portal_distortion_mask()
    make_arch_frame()
    make_mid_rocks_foliage()
    make_lanterns()
    make_board_base()
    make_board_trim()
    make_board_ao()
    make_board_contact_shadow()
    make_board_cell_recess()
    make_board_runes()
    make_board_damage_detail()
    make_board_moss_overlay()
    make_cell_assets()
    make_fx_assets()
    make_post_vignette()
    print("environment-art-generated")


if __name__ == "__main__":
    main()
