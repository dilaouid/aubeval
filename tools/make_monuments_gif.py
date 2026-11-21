"""Builds docs/monuments.gif: python tools/make_monuments_gif.py
The three great works (cathedral, castle, lighthouse) rising together, stage 1 to 4, then a pause on the finished
monuments and a loop. Straight from assets/sprites/iso/*_s1..s4.png, scaled x2 (nearest), on a transparent
background (the sprites' alpha is 0/255, so the edges stay clean on GitHub's light and dark themes)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WORKS = ['cathedral', 'castle', 'lighthouse']
SCALE, GAP, PAD = 2, 36, 12
HOLD = [1000, 1000, 1000, 2600]  # ms per stage; the last one lingers on the finished buildings
KEY = 255                        # palette index of the transparent colour


def load(name, stage):
    im = Image.open(ROOT / f'assets/sprites/iso/{name}_s{stage}.png').convert('RGBA')
    return im.resize((im.width * SCALE, im.height * SCALE), Image.NEAREST)


sprites = {n: [load(n, s) for s in range(1, 5)] for n in WORKS}
widths = [sprites[n][0].width for n in WORKS]
H = max(im.height for n in WORKS for im in sprites[n])
W = sum(widths) + GAP * (len(WORKS) - 1) + PAD * 2

frames = []
for stage in range(4):
    f = Image.new('RGBA', (W, H + PAD * 2), (0, 0, 0, 0))
    x = PAD
    for n in WORKS:
        im = sprites[n][stage]
        f.alpha_composite(im, (x, PAD + H - im.height))  # buildings share the ground line
        x += im.width + GAP
    frames.append(f)

# One shared palette for every frame (no flicker between stages).
sheet = Image.new('RGB', (W, (H + PAD * 2) * 4))
for i, f in enumerate(frames):
    sheet.paste(f.convert('RGB'), (0, i * (H + PAD * 2)))
pal = sheet.quantize(255, method=Image.MEDIANCUT, dither=Image.NONE)

out = []
for f in frames:
    p = f.convert('RGB').quantize(palette=pal, dither=Image.NONE)
    mask = f.getchannel('A').point(lambda a: 255 if a < 128 else 0)
    p.paste(KEY, mask=mask)
    out.append(p)

dest = ROOT / 'docs/monuments.gif'
out[0].save(dest, save_all=True, append_images=out[1:], duration=HOLD, loop=0,
            transparency=KEY, disposal=2, optimize=False)
print(dest, f'{W}x{H + PAD * 2}', f'{dest.stat().st_size // 1024} KB')
