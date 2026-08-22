#!/usr/bin/env python3
"""Generate PWA icons from OrthodoxCross.svg using rsvg-convert + Pillow."""

import os
import subprocess
import tempfile
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(SCRIPT_DIR, '..')
SVG_PATH = os.path.join(PROJECT_DIR, 'static', 'OrthodoxCross.svg')
ICONS_DIR = os.path.join(PROJECT_DIR, 'static', 'icons')
os.makedirs(ICONS_DIR, exist_ok=True)

GOLD = (0xC5, 0xA5, 0x5A)
NAVY = (0x1A, 0x1A, 0x2E)
RENDER_SIZE = 2048
ART_SCALE = 0.8  # art occupies this fraction of the canvas (maskable safe zone)


def render_svg():
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run([
            'rsvg-convert',
            '-h', str(RENDER_SIZE),
            '--keep-aspect-ratio',
            SVG_PATH,
            '-o', tmp_path,
        ], check=True)
        return Image.open(tmp_path).convert('RGBA')
    finally:
        os.unlink(tmp_path)


def gold_silhouette():
    img = render_svg()
    gold = Image.new('RGBA', img.size, GOLD + (255,))
    gold.putalpha(img.split()[3])
    return gold


def gold_art(long_side):
    img = gold_silhouette()
    scale = long_side / max(img.size)
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)


def compose_app_icon(size):
    canvas = Image.new('RGBA', (size, size), NAVY + (255,))
    art = gold_art(round(size * ART_SCALE))
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return canvas


def compose_transparent_art(size):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    art = gold_art(size)
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return canvas


for size in [192, 512]:
    out = os.path.join(ICONS_DIR, f'icon-{size}.png')
    compose_app_icon(size).save(out, 'PNG')
    print(f'Saved {out} ({size}x{size})')

transparent_out = os.path.join(ICONS_DIR, 'cross-gold.png')
compose_transparent_art(512).save(transparent_out, 'PNG')
print(f'Saved {transparent_out} (512x512)')
