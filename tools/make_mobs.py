# PROTOTYPE - NOT FOR PRODUCTION
"""Builds the map figures of the first mobs (the goblin, the brute, the shaman) in assets/sprites/iso/
from the raw PixelLab characters in tools/mobs/raw/.

  tools/mobs/raw/<mob>/unit/rotations/<direction>.png    the figure standing, in each of the eight directions
  tools/mobs/raw/<mob>/unit/walk/<direction>/frame_NNN.png   its six steps, per direction
  -> assets/sprites/iso/unit_<mob>.png    'iso.unit.<mob>' in assets/manifest.js: a row per direction (the
                                          order js/world.js reads), the figure standing in the first
                                          column and the six steps after it, every cell cropped to the same
                                          box so that the feet stay where they are

It is the same assembly as the heroes' figures (tools/make_heroes.py unit_sheet), which also says what it
refuses. Nothing is resampled. tools/mobs/ids.tsv says where each raw character comes from.

Run from the root of the repository:
  python tools/make_mobs.py           builds everything found
  python tools/make_mobs.py --check   checks the sheets already built (exit 1 if one is wrong, or if a raw
                                      character is there and its sheet is not built)
"""
import os
import sys
from PIL import Image

import make_heroes as H

RAW = 'tools/mobs/raw'
OUT = 'assets/sprites/iso'


def mobs(raw=RAW):
    """The names of the raw characters found, in order."""
    return sorted(d for d in os.listdir(raw) if os.path.isdir(os.path.join(raw, d, 'unit'))) if os.path.isdir(raw) else []


def build(raw=RAW, out=OUT):
    """Builds every raw character found; returns one line per sheet. A character that is refused raises H.Refused and leaves no sheet."""
    lines = []
    for mob in mobs(raw):
        dest = os.path.join(out, 'unit_%s.png' % mob)
        cw, ch = H.unit_sheet(os.path.join(raw, mob, 'unit'), dest)
        lines.append('%s -> %s cols %d rows %d cell %dx%d' % (mob, dest, H.COLS, len(H.ROWS), cw, ch))
    return lines


def check(raw=RAW, out=OUT):
    """The sheets of the raw characters found are built and cut in COLS columns and one row per direction. Returns how many are wrong or missing."""
    bad = 0
    for mob in mobs(raw):
        path = os.path.join(out, 'unit_%s.png' % mob)
        if not os.path.exists(path):
            bad += 1
            print('%-8s NOT BUILT (%s is there)' % (mob, os.path.join(raw, mob)))
            continue
        im = Image.open(path)
        good = im.width % H.COLS == 0 and im.height % len(H.ROWS) == 0
        bad += 0 if good else 1
        print('%-8s %dx%d, a cell of %dx%d %s' % (mob, im.width, im.height, im.width // H.COLS, im.height // len(H.ROWS), 'ok' if good else 'WRONG: not %d columns by %d rows' % (H.COLS, len(H.ROWS))))
    return bad


def main():
    if '--check' in sys.argv[1:]:
        return 1 if check() else 0
    try:
        for line in build():
            print(line)
    except H.Refused as e:
        print('REFUSED', e)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
