# PROTOTYPE - NOT FOR PRODUCTION
"""Builds the pictures of the places entered full screen (js/venue.js) from the raw PixelLab images in tools/venues/raw/.

  bg_<place>.png          the room behind the keeper, 640x360 as PixelLab drew it.
                          -> assets/sprites/venue/bg_<place>.png ('venue.bg.<place>'), as it is.
  char_<keeper>/frame_001.png .. frame_008.png
                          the keeper from the waist up, 160x160: the eight frames of her loop.
                          -> assets/sprites/venue/char_<keeper>.png ('venue.char.<keeper>'), a
                          strip of 8 cells. Two things are done to the frames first:
                          the light rule PixelLab sometimes leaves under a figure cut at the
                          waist is dropped (unruled), and the eight go down together until the
                          lowest stands on the bottom edge (grounded): the game stands a keeper
                          on the floor of her room by the bottom of her image.

Nothing is resampled. An image of another size is refused. The café's, the market's and the
forge's pictures were made before this script and have no raw image here: it leaves them alone.
tools/venues/ids.tsv says where each raw image comes from.

Run from the root of the repository:
  python tools/make_venues.py           builds everything found
  python tools/make_venues.py --check   checks the sizes of what is built (exit 1 if one is wrong,
                                        or if a raw image is there and its picture is not built)
"""
import glob
import os
import sys
from PIL import Image

RAW = 'tools/venues/raw'
OUT = 'assets/sprites/venue'
ROOM = (640, 360)             # a room, the size the game draws it at
CELL, FRAMES = 160, 8         # a keeper's frame, and the frames of her loop
RULE_ROWS = 3                 # the rule is thin: at most this many rows
LIGHT = 200                   # ... and light: every channel of every pixel of it at least this (the rule seen so far is a 219 grey)


class Refused(Exception):
    pass


def load(path, size):
    im = Image.open(path)
    if im.size != size:
        raise Refused('%s is %dx%d, not %dx%d' % (path, im.width, im.height, size[0], size[1]))
    return im


def unruled(im):
    """The frame without the light rule under its figure: the last opaque rows, RULE_ROWS at most, when all their pixels are near white and the row above them is not."""
    im = im.convert('RGBA')
    box = im.getbbox()
    if not box:
        return im
    px = im.load()

    def light(y):
        row = [px[x, y] for x in range(box[0], box[2]) if px[x, y][3] > 0]
        return bool(row) and all(min(p[:3]) >= LIGHT for p in row)

    y, rows = box[3] - 1, 0
    while y >= box[1] and light(y):
        y, rows = y - 1, rows + 1
    if not 0 < rows <= RULE_ROWS:
        return im
    out = im.copy()
    out.paste((0, 0, 0, 0), (0, y + 1, im.width, box[3]))
    return out


def grounded(frames):
    """The frames moved down together, by what the lowest of them lacks to stand on the bottom edge."""
    low = max(f.getbbox()[3] for f in frames if f.getbbox())
    drop = frames[0].height - low
    if not drop:
        return frames
    out = []
    for f in frames:
        g = Image.new('RGBA', f.size, (0, 0, 0, 0))
        g.paste(f, (0, drop))
        out.append(g)
    return out


def strip(frames):
    """The frames side by side, in order."""
    out = Image.new('RGBA', (CELL * len(frames), CELL), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        out.paste(f, (i * CELL, 0))
    return out


def rooms():
    return sorted(glob.glob(os.path.join(RAW, 'bg_*.png')))


def keepers():
    return sorted(d for d in glob.glob(os.path.join(RAW, 'char_*')) if os.path.isdir(d))


def build():
    failed = 0
    for src in rooms():
        try:
            out = os.path.join(OUT, os.path.basename(src))
            load(src, ROOM).convert('RGB').save(out)
            print('%s -> %s %dx%d' % (src, out, ROOM[0], ROOM[1]))
        except Refused as e:
            failed += 1
            print('REFUSED', e)
    for src in keepers():
        try:
            files = [os.path.join(src, 'frame_%03d.png' % i) for i in range(1, FRAMES + 1)]
            missing = [f for f in files if not os.path.exists(f)]
            if missing:
                raise Refused('%s: %d of its %d frames are missing (%s...)' % (src, len(missing), FRAMES, missing[0]))
            frames = grounded([unruled(load(f, (CELL, CELL))) for f in files])
            out = os.path.join(OUT, os.path.basename(src) + '.png')
            strip(frames).save(out)
            print('%s -> %s %d frames' % (src, out, FRAMES))
        except Refused as e:
            failed += 1
            print('REFUSED', e)
    return failed


def check():
    """The sizes of what is built from a raw image. Returns how many are wrong or missing."""
    bad = 0
    for src, out, size in [(s, os.path.join(OUT, os.path.basename(s)), ROOM) for s in rooms()] + \
                          [(s, os.path.join(OUT, os.path.basename(s) + '.png'), (CELL * FRAMES, CELL)) for s in keepers()]:
        name = os.path.basename(out)
        if not os.path.exists(out):
            bad += 1
            print('%-20s NOT BUILT (%s is there)' % (name, src))
            continue
        im = Image.open(out)
        good = im.size == size
        bad += 0 if good else 1
        print('%-20s %dx%d %s' % (name, im.width, im.height, 'ok' if good else 'WRONG SIZE (%dx%d wanted)' % size))
    return bad


if __name__ == '__main__':
    sys.exit(1 if (check() if '--check' in sys.argv[1:] else build()) else 0)
