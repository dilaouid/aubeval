# PROTOTYPE - NOT FOR PRODUCTION
"""Builds the tier looks of the buildings in assets/sprites/iso/ from the raw PixelLab images in tools/buildings/raw/.

  tools/buildings/raw/<kind>_l5.png, _l10.png, _l15.png
      the looks a building takes at levels 5, 10 and 15 (js/world.js World.tier), each made in
      PixelLab as a state of the one before it, starting from the building's level-1 object.
      tools/buildings/ids.tsv says which object each one is and what was asked.
  tools/buildings/raw/<kind>_l1.png (only for a building made after these tools)
      its level-1 look, the object the others are states of. Installed like them; the older
      buildings have none here, their level 1 is drawn straight into assets/sprites/iso/.
  -> assets/sprites/iso/<kind>_l<N>.png
      the same image cropped to its opaque pixels, so that its bottom is the bottom corner of the
      building's ground (js/world.js stands it there). Nothing is resampled.

A tier must be exactly as wide as its building's level 1 (the raw <kind>_l1.png cropped, when there
is one, or else assets/sprites/iso/<kind>_l1.png): the
game centres a building on its ground, so a wider tier would step sideways as the building levels
up. It may be taller. A tier that is wider is refused.

Run from the root of the repository:
  python tools/make_buildings.py           builds everything found
  python tools/make_buildings.py --check   checks the widths of the tiers already built (exit 1 if one is wrong)
"""
import glob
import os
import re
import sys
from PIL import Image

RAW = 'tools/buildings/raw'
OUT = 'assets/sprites/iso'
NAME = re.compile(r'^(?P<kind>.+)_l(?P<lvl>1|5|10|15)\.png$')


def tiers(raw=RAW):
    """[(kind, level, raw path)] for every raw tier, by building then level."""
    out = []
    for p in glob.glob(os.path.join(raw, '*.png')):
        m = NAME.match(os.path.basename(p))
        if m:
            out.append((m.group('kind'), int(m.group('lvl')), p))
    return sorted(out)


def opaque(path):
    """The image at path cropped to its opaque pixels."""
    im = Image.open(path).convert('RGBA')
    return im.crop(im.getbbox())


def base_width(kind, raw=RAW, out=OUT):
    """The width every look of kind must have: its raw level 1's when there is one, else its installed level 1's."""
    src = os.path.join(raw, '%s_l1.png' % kind)
    return opaque(src).width if os.path.exists(src) else Image.open(os.path.join(out, '%s_l1.png' % kind)).width


def build(raw=RAW, out_dir=OUT):
    failed = 0
    for kind, lvl, src in tiers(raw):
        im = opaque(src)

        want = base_width(kind, raw, out_dir)
        if im.width != want:
            failed += 1
            print('REFUSED %s_l%d: %d wide, its level 1 is %d' % (kind, lvl, im.width, want))
            continue
        out = os.path.join(out_dir, '%s_l%d.png' % (kind, lvl))
        im.save(out)
        print('%s_l%d -> %s %dx%d' % (kind, lvl, out, im.width, im.height))
    return failed


def check(raw=RAW, out=OUT):
    """Every tier built from a raw image has its level 1's width. Returns how many are wrong or missing."""
    bad = 0
    for kind, lvl, _ in tiers(raw):
        path = os.path.join(out, '%s_l%d.png' % (kind, lvl))
        if not os.path.exists(path):
            bad += 1
            print('%-18s not built' % ('%s_l%d' % (kind, lvl)))
            continue
        im, want = Image.open(path), base_width(kind, raw, out)
        good = im.width == want
        bad += 0 if good else 1
        print('%-18s %dx%d %s' % ('%s_l%d' % (kind, lvl), im.width, im.height, 'ok' if good else 'WRONG WIDTH (level 1: %d)' % want))
    return bad


if __name__ == '__main__':
    sys.exit(1 if (check() if '--check' in sys.argv[1:] else build()) else 0)
