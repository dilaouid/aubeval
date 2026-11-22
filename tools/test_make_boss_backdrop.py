# PROTOTYPE - NOT FOR PRODUCTION
"""Tests of tools/make_boss_backdrop.py: what it takes for sky, and the image it leaves in assets/.

Run from the root of the repository:  python tools/test_make_boss_backdrop.py   (exit code 1 on a failure)
"""
import sys
from PIL import Image

import make_boss_backdrop as M

W, H = 200, 100
SKY_TOP, SKY_LOW, CLOUD = (19, 167, 250), (160, 224, 250), (255, 254, 253)   # the day sky of bg_battle.png, its lightest band, a cloud (a warm white: a little less blue than red)
TEAL, TEAL_EDGE, GRASS = (30, 132, 138), (39, 148, 162), (90, 188, 107)      # the far hills, their soft edge, the fields


def crest(x):
    """The first row of the hills in column x: a crest at row 20 in the middle, valleys down to row 46 on the sides."""
    return 20 + abs(x - W // 2) * 26 // (W // 2)


def day():
    """A small day backdrop: banded blue sky with a cloud, teal hills whose crest is far above their valleys, fields below."""
    im = Image.new('RGB', (W, H), GRASS)
    px = im.load()
    for x in range(W):
        top = crest(x)
        for y in range(top):
            px[x, y] = SKY_TOP if y < 15 else SKY_LOW
        px[x, top] = TEAL_EDGE
        for y in range(top + 1, 55):
            px[x, y] = TEAL
    im.paste(CLOUD, (30, 5, 70, 11))
    return im


tests = []


def test(f):
    tests.append(f)
    return f


@test
def the_sky_is_everything_above_the_hills_and_nothing_of_them():
    mask = M.sky_mask(day()).load()
    wrong = [(x, y) for x in range(W) for y in range(H) if (mask[x, y] > 0) != (y < crest(x))]
    assert not wrong, '%d pixels taken for the wrong side of the horizon, the first at %s' % (len(wrong), wrong[0])


@test
def a_cloud_is_sky():
    assert M.sky_mask(day()).getpixel((50, 8)) > 0


@test
def the_built_backdrop_keeps_no_daylight_sky():
    im = Image.open(M.OUT).convert('RGB')
    # a strip of day sky left under the dusk is graded with the ground: still a light blue, which nothing else up there is
    blue = sum(1 for r, g, b in im.crop((0, 0, im.width, im.height // 2)).getdata() if b >= 170 and b > r + 40)
    assert blue == 0, '%d pixels of the day sky are left in %s' % (blue, M.OUT)


@test
def the_built_backdrop_is_at_the_size_the_battle_draws_it():
    assert Image.open(M.OUT).size == M.SIZE == (640, 360), Image.open(M.OUT).size


bad = 0
for t in tests:
    try:
        t()
        print('ok   ' + t.__name__.replace('_', ' '))
    except Exception as e:  # an assertion, or the thing under test missing
        bad += 1
        print('FAIL %s\n     %s: %s' % (t.__name__.replace('_', ' '), type(e).__name__, e))
print('%d/%d passed' % (len(tests) - bad, len(tests)))
sys.exit(1 if bad else 0)
