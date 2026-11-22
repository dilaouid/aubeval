# PROTOTYPE - NOT FOR PRODUCTION
"""Builds the images of the heroes in assets/sprites/ from the raw PixelLab frames in tools/heroes/raw/.

One folder per hero (data/world.js DATA.heroes), with what it has so far:

  <id>/portrait/   frame_001.png .. frame_007.png, 64x64: the idle loop of the half-body portrait
                   (bust.png beside them is the bust it was animated from, kept for reference and
                   not installed). -> assets/sprites/portraits/hero_<id>.png, a strip of 7 cells.
  <id>/battle.png  the battle sprite, 44x50, feet on the last row.
                   -> assets/sprites/hero_battle_<id>.png, as it is.
  <id>/unit/       the map figure as the character ZIP of PixelLab lays it out:
                   rotations/<direction>.png and walk/<direction>/frame_NNN.png (6 frames).
                   -> assets/sprites/iso/unit_hero_<id>.png: a row per direction (ROWS, the order
                   js/world.js reads), the first column standing and the others the walk, every
                   cell cropped to the same box so the feet stay where they are.

Nothing is resampled. A frame of another size (the frames of a map figure must all match), or a
figure that does not reach the bottom of its cell, is refused. tools/heroes/ids.tsv says where each
raw image comes from. Aldric's map sheet is not built here, on purpose (assets/sprites/iso/unit_hero.png, from the first
set of figures): --check says "not built" for it.

Run from the root of the repository:
  python tools/make_heroes.py           builds everything found
  python tools/make_heroes.py --check   checks the sizes of the files already built (exit 1 if one is wrong)
"""
import glob
import os
import sys
from PIL import Image

RAW = 'tools/heroes/raw'
PORTRAITS = 'assets/sprites/portraits/hero_%s.png'
BATTLE = 'assets/sprites/hero_battle_%s.png'
UNIT = 'assets/sprites/iso/unit_hero_%s.png'
CELL, FRAMES = 64, 7          # the cell of a portrait, and the frames of its loop
BW, BH = 44, 50               # the battle sprite (js/art.js 'hero.battle')
COLS = 7                      # the sheet of a map figure: standing + 6 steps
ROWS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']


class Refused(Exception):
    pass


def opaque(im, y):
    a = im.getchannel('A')
    return sum(1 for x in range(im.width) if a.getpixel((x, y)) > 0)


def load(path, size=None):
    im = Image.open(path).convert('RGBA')
    if size and im.size != size:
        raise Refused('%s is %dx%d, not %dx%d' % (path, im.width, im.height, size[0], size[1]))
    return im


def portrait(hero):
    src = os.path.join(RAW, hero, 'portrait')
    if not os.path.isdir(src):
        return None
    files = [os.path.join(src, 'frame_%03d.png' % i) for i in range(1, FRAMES + 1)]
    missing = [f for f in files if not os.path.exists(f)]
    if missing:
        raise Refused('%s: %d of its %d frames are missing (%s...)' % (src, len(missing), FRAMES, missing[0]))
    strip = Image.new('RGBA', (CELL * FRAMES, CELL), (0, 0, 0, 0))
    for i, f in enumerate(files):
        im = load(f, (CELL, CELL))
        if not opaque(im, CELL - 1):
            raise Refused('%s: the figure does not reach the bottom of its cell' % f)
        strip.alpha_composite(im, (i * CELL, 0))
    out = PORTRAITS % hero
    strip.save(out)
    return 'portrait %s -> %s %dx%d' % (hero, out, strip.width, strip.height)


def battle(hero):
    src = os.path.join(RAW, hero, 'battle.png')
    if not os.path.exists(src):
        return None
    im = load(src, (BW, BH))
    if not opaque(im, BH - 1):
        raise Refused('%s: the feet are not on the last row' % src)
    out = BATTLE % hero
    im.save(out)
    return 'battle %s -> %s %dx%d' % (hero, out, BW, BH)


def unit(hero):
    src = os.path.join(RAW, hero, 'unit')
    if not os.path.isdir(src):
        return None
    cells = []
    for d in ROWS:
        stand = os.path.join(src, 'rotations', d + '.png')
        walk = sorted(glob.glob(os.path.join(src, 'walk', d, 'frame_*.png')))
        if not os.path.exists(stand):
            raise Refused('%s is missing' % stand)
        if len(walk) != COLS - 1:
            raise Refused('%s: %d walk frames, not %d' % (os.path.join(src, 'walk', d), len(walk), COLS - 1))
        cells.append([load(p) for p in [stand] + walk])
    sizes = {im.size for row in cells for im in row}
    if len(sizes) != 1:
        raise Refused('%s: the frames are not all the same size (%s)' % (src, ', '.join('%dx%d' % z for z in sorted(sizes))))
    box = None  # the one box every frame is cropped to
    for row in cells:
        for im in row:
            b = im.getbbox()
            if b:
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    if box is None:
        raise Refused('%s: every frame is empty' % src)
    cw, ch = box[2] - box[0], box[3] - box[1]
    sheet = Image.new('RGBA', (cw * COLS, ch * len(ROWS)), (0, 0, 0, 0))
    for y, row in enumerate(cells):
        for x, im in enumerate(row):
            sheet.alpha_composite(im.crop(box), (x * cw, y * ch))
    out = UNIT % hero
    sheet.save(out)
    return 'unit %s -> %s cols %d rows %d cell %dx%d' % (hero, out, COLS, len(ROWS), cw, ch)


def heroes():
    return sorted(d for d in os.listdir(RAW) if os.path.isdir(os.path.join(RAW, d)))


def check():
    """The sizes of what is built. Returns how many files are wrong."""
    bad = 0
    for hero in heroes():
        for kind, path, ok in [
            ('portrait', PORTRAITS % hero, lambda im: im.size == (CELL * FRAMES, CELL)),
            ('battle', BATTLE % hero, lambda im: im.size == (BW, BH)),
            ('unit', UNIT % hero, lambda im: im.width % COLS == 0 and im.height % len(ROWS) == 0),
        ]:
            if not os.path.exists(path):
                print('%-8s %-9s not built' % (kind, hero))
                continue
            im = Image.open(path)
            good = ok(im)
            bad += 0 if good else 1
            print('%-8s %-9s %dx%d %s' % (kind, hero, im.width, im.height, 'ok' if good else 'WRONG SIZE'))
    return bad


def main():
    if '--check' in sys.argv[1:]:
        return 1 if check() else 0
    failed = 0
    for hero in heroes():
        for make in (portrait, battle, unit):
            try:
                line = make(hero)
                if line:
                    print(line)
            except Refused as e:
                failed += 1
                print('REFUSED', e)
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
