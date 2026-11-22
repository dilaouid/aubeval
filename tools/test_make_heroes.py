# PROTOTYPE - NOT FOR PRODUCTION
"""Tests of tools/make_heroes.py: the weld that sets a redrawn sprite's sword on the hero's battle sprite.

Run from the root of the repository:  python tools/test_make_heroes.py   (exit code 1 on a failure)
"""
import sys
from PIL import Image

import make_heroes as M

BODY, STEEL, OTHER = (40, 60, 160, 255), (200, 210, 230, 255), (220, 40, 40, 255)


def sprite(sword=None, extra=()):
    """A 44x50 figure: a body left of the seam, feet on the last row; `sword` = (x0, y0, x1, y1) drawn in STEEL; `extra` = [((x, y), colour)]."""
    im = Image.new('RGBA', (M.BW, M.BH), (0, 0, 0, 0))
    im.paste(BODY, (10, 10, 26, M.BH))
    if sword:
        im.paste(STEEL, sword)
    for xy, c in extra:
        im.putpixel(xy, c)
    return im


tests = []


def test(f):
    tests.append(f)
    return f


@test
def the_weld_takes_the_sword_and_leaves_the_body():
    base, redraw = sprite(sword=(34, 6, 37, 30)), sprite(sword=(33, 2, 39, 30))
    out, slide, apart = M.weld(base, redraw)
    assert slide == (0, 0) and apart == 0, (slide, apart)
    assert out.getpixel((38, 3)) == STEEL and out.getpixel((12, 20)) == BODY
    assert out.crop((0, 0, M.SEAM_X, M.BH)).tobytes() == base.crop((0, 0, M.SEAM_X, M.BH)).tobytes()


@test
def the_weld_finds_a_redraw_that_was_drawn_a_little_aside():
    base = sprite(sword=(34, 6, 37, 30))
    moved = Image.new('RGBA', (M.BW, M.BH), (0, 0, 0, 0))
    moved.paste(sprite(sword=(33, 4, 39, 30)), (2, -1))
    out, slide, _ = M.weld(base, moved)
    assert slide == (-2, 1), slide
    assert out.getpixel((38, 5)) == STEEL and out.getpixel((38, 3))[3] == 0


@test
def the_handle_and_the_pommel_below_the_seam_are_kept():
    low = M.SEAM_Y + 6
    base, redraw = sprite(sword=(34, 6, 37, 30)), sprite(sword=(34, 2, 37, low + 1))
    out, _, _ = M.weld(base, redraw)
    assert out.getpixel((35, M.SEAM_Y)) == STEEL, 'the sword stops on the seam row'
    assert out.getpixel((35, low)) == STEEL, 'the pommel is cut'


@test
def below_the_seam_the_hero_keeps_every_pixel_of_his_own():
    spot = (M.SEAM_X + 2, M.SEAM_Y + 4)
    base = sprite(sword=(34, 6, 37, 30), extra=[(spot, BODY)])
    redraw = sprite(sword=(34, 2, 37, 30), extra=[(spot, OTHER)])
    out, _, _ = M.weld(base, redraw)
    assert out.getpixel(spot) == BODY


@test
def a_tier_is_its_hero_but_for_the_sword():
    base = sprite(sword=(34, 6, 37, 30))
    out, _, _ = M.weld(base, sprite(sword=(34, 2, 37, M.SEAM_Y + 6)))
    assert M.only_sword_differs(base, out)
    face = out.copy()
    face.putpixel((12, 12), OTHER)
    assert not M.only_sword_differs(base, face), 'a changed body pixel passes'
    cape = sprite(sword=(34, 6, 37, 30), extra=[((M.SEAM_X + 2, M.SEAM_Y + 4), BODY)])
    worn, _, _ = M.weld(cape, sprite(sword=(34, 2, 37, 30)))
    worn.putpixel((M.SEAM_X + 2, M.SEAM_Y + 4), OTHER)
    assert not M.only_sword_differs(cape, worn), 'a changed hero pixel below the seam passes'


bad = 0
for t in tests:
    try:
        t()
        print('ok   ' + t.__name__.replace('_', ' '))
    except Exception as e:  # an assertion, or the function under test missing
        bad += 1
        print('FAIL %s\n     %s: %s' % (t.__name__.replace('_', ' '), type(e).__name__, e))
print('%d/%d passed' % (len(tests) - bad, len(tests)))
sys.exit(1 if bad else 0)
