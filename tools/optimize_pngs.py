#!/usr/bin/env python3
"""Makes the game's PNG files smaller without changing a pixel: python tools/optimize_pngs.py [--write]

Without --write it only says what it would save. With it, each file is rewritten when the new one is
smaller, and only after the new one is read back and found identical to the old one, pixel for pixel
(alpha included).

  - an image of 256 colours or fewer (nearly all of them: pixel art) becomes an indexed PNG, with the
    transparency kept in its palette;
  - any other is re-compressed as it is.

And one image is made smaller in size, not only in weight (DOWNSCALE): the game resamples an image to
its sprite's size when it loads it (js/art.js loadOverrides), so pixels beyond that size are never seen.
"""
import glob, os, sys, io
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNSCALE = {
    # drawn at 640x360 by Art ('bg.battle'); the file was 2560x1440 (2.5 MB), of which 15/16 of the pixels were thrown away at load
    'assets/sprites/bg_battle.png': (640, 360),
}


def indexed(im):
    """The image as an indexed PNG with the very same colours, or None when it has more than 256."""
    rgba = im.convert('RGBA')
    colors = rgba.getcolors(256)
    if colors is None:
        return None
    colors = [c for _, c in sorted(colors, key=lambda t: -t[0])]  # the commonest first: they get the shortest codes
    index = {c: i for i, c in enumerate(colors)}
    out = Image.new('P', rgba.size)
    out.putdata([index[p] for p in rgba.getdata()])
    flat = []
    for r, g, b, a in colors:
        flat += [r, g, b]
    out.putpalette(flat)
    alphas = bytes(c[3] for c in colors)
    return out, (alphas if any(a < 255 for a in alphas) else None)


def encode(im):
    """The smallest PNG bytes found for this image."""
    best = None
    def keep(data):
        nonlocal best
        if best is None or len(data) < len(best):
            best = data
    idx = indexed(im)
    if idx:
        buf = io.BytesIO()
        pim, alpha = idx
        pim.save(buf, 'PNG', optimize=True, **({'transparency': alpha} if alpha else {}))
        keep(buf.getvalue())
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    keep(buf.getvalue())
    return best


def same(a, b):
    a, b = a.convert('RGBA'), b.convert('RGBA')
    return a.size == b.size and ImageChops.difference(a, b).getbbox() is None


def main():
    write = '--write' in sys.argv
    before = after = 0
    for path in sorted(glob.glob(os.path.join(ROOT, 'assets', '**', '*.png'), recursive=True)):
        rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
        old = open(path, 'rb').read()
        im = Image.open(io.BytesIO(old)); im.load()
        target = im
        if rel in DOWNSCALE:
            rgb = im.convert('RGBA').resize(DOWNSCALE[rel], Image.LANCZOS)
            target = rgb.convert('RGB') if im.getchannel('A').getextrema() == (255, 255) else rgb
        new = encode(target)
        before += len(old)
        if len(new) >= len(old) * 0.99:
            after += len(old)
            continue
        if rel not in DOWNSCALE and not same(im, Image.open(io.BytesIO(new))):
            print('NOT IDENTICAL, left alone:', rel)
            after += len(old)
            continue
        after += len(new)
        if len(old) - len(new) > 20000 or rel in DOWNSCALE:
            print(f'{rel}: {len(old) // 1024} KB -> {len(new) // 1024} KB')
        if write:
            open(path, 'wb').write(new)
    print(f'{"written" if write else "dry run"}: {before / 1024 / 1024:.2f} MB -> {after / 1024 / 1024:.2f} MB')


if __name__ == '__main__':
    main()
