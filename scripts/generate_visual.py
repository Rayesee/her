from pathlib import Path
import math
import random
import struct
import zlib


WIDTH = 1600
HEIGHT = 1000
OUT = Path("assets/hero-visual.png")


def clamp(value):
    return max(0, min(255, int(value)))


def write_png(path, width, height, pixels):
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        start = y * width * 3
        raw.extend(pixels[start:start + width * 3])

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


random.seed(18)
pixels = bytearray(WIDTH * HEIGHT * 3)

palette = {
    "plum": (67, 38, 112),
    "violet": (123, 67, 181),
    "magenta": (184, 78, 171),
    "cyan": (57, 203, 196),
    "amber": (241, 176, 72),
    "ink": (22, 19, 35),
}

for y in range(HEIGHT):
    ny = y / (HEIGHT - 1)
    for x in range(WIDTH):
        nx = x / (WIDTH - 1)
        wave = math.sin(nx * 9.0 + ny * 5.2) * 0.5 + 0.5
        diagonal = (nx * 0.65 + ny * 0.35)

        r = palette["ink"][0] * (1 - diagonal) + palette["plum"][0] * diagonal
        g = palette["ink"][1] * (1 - diagonal) + palette["plum"][1] * diagonal
        b = palette["ink"][2] * (1 - diagonal) + palette["violet"][2] * diagonal

        glow = max(0, 1 - math.hypot(nx - 0.73, ny - 0.36) * 2.15)
        edge = max(0, 1 - math.hypot(nx - 0.28, ny - 0.62) * 2.45)
        ribbon = max(0, 1 - abs((ny - 0.72) - math.sin(nx * 4.2) * 0.10) * 7)

        r += palette["magenta"][0] * glow * 0.42 + palette["cyan"][0] * edge * 0.30
        g += palette["magenta"][1] * glow * 0.34 + palette["cyan"][1] * edge * 0.42
        b += palette["magenta"][2] * glow * 0.45 + palette["cyan"][2] * edge * 0.26

        r += palette["amber"][0] * ribbon * 0.10
        g += palette["amber"][1] * ribbon * 0.08
        b += palette["amber"][2] * ribbon * 0.03

        grain = (random.random() - 0.5) * 12 + wave * 8
        vignette = 1 - max(0, math.hypot(nx - 0.50, ny - 0.48) - 0.25) * 0.62

        i = (y * WIDTH + x) * 3
        pixels[i] = clamp((r + grain) * vignette)
        pixels[i + 1] = clamp((g + grain) * vignette)
        pixels[i + 2] = clamp((b + grain) * vignette)

write_png(OUT, WIDTH, HEIGHT, pixels)
