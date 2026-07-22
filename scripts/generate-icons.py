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

def generate_icon(size):
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
        tmp_path = tmp.name
    try:
        subprocess.run([
            'rsvg-convert',
            '-w', str(RENDER_SIZE),
            '-h', str(RENDER_SIZE),
            SVG_PATH,
            '-o', tmp_path,
        ], check=True)
        img = Image.open(tmp_path).convert('RGBA')
        result = Image.new('RGBA', (size, size), NAVY + (255,))
        cross = img.resize((size, size), Image.LANCZOS)
        gold_layer = Image.new('RGBA', (size, size), GOLD + (255,))
        result.paste(gold_layer, mask=cross.split()[3])
        return result
    finally:
        os.unlink(tmp_path)

for size in [192, 512]:
    icon = generate_icon(size)
    out = os.path.join(ICONS_DIR, f'icon-{size}.png')
    icon.save(out, 'PNG')
    print(f'Saved {out} ({size}x{size})')

print('Icons generated.')
