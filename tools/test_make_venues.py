# PROTOTYPE - NOT FOR PRODUCTION
"""Tests of tools/make_venues.py: what it does to a keeper's frames before laying them in a strip.

Run from the root of the repository:  python tools/test_make_venues.py   (exit code 1 on a failure)
"""
import sys
from PIL import Image

import make_venues as M

SKIN, CLOTH, RULE = (220, 170, 140, 255), (70, 110, 60, 255), (250, 250, 250, 255)


def figure(bottom, rule=False, dx=0):
    """A 160x160 frame: a body from row 20 down to `bottom` (not included), and under it, when asked, the light rule PixelLab leaves."""
    im = Image.new('RGBA', (M.CELL, M.CELL), (0, 0, 0, 0))
    im.paste(SKIN, (60 + dx, 20, 100 + dx, 60))
    im.paste(CLOTH, (40 + dx, 60, 120 + dx, bottom))
    if rule:
        im.paste(RULE, (44 + dx, bottom, 116 + dx, bottom + 2))
    return im


tests = []


def test(f):
    tests.append(f)
    return f


@test
def the_light_rule_under_a_figure_is_dropped_and_nothing_else():
    out = M.unruled(figure(150, rule=True))
    assert out.getbbox()[3] == 150, out.getbbox()
    assert out.getpixel((80, 149)) == CLOTH and out.getpixel((80, 30)) == SKIN


@test
def a_figure_with_no_rule_is_left_as_it_is():
    im = figure(150)
    assert M.unruled(im).tobytes() == im.tobytes()


@test
def a_white_apron_that_reaches_the_bottom_is_not_a_rule():
    im = figure(150)
    im.paste(RULE, (50, 100, 110, 150))  # a wide white cloth, many rows high
    assert M.unruled(im).getbbox()[3] == 150
    assert M.unruled(im).getpixel((80, 120)) == RULE


@test
def the_frames_go_down_together_until_the_lowest_stands_on_the_edge():
    frames = M.grounded([figure(150), figure(146), figure(148)])
    assert [f.getbbox()[3] for f in frames] == [160, 156, 158], [f.getbbox()[3] for f in frames]
    assert frames[0].getpixel((80, 159)) == CLOTH


@test
def frames_already_on_the_edge_do_not_move():
    im = figure(160)
    assert M.grounded([im])[0].tobytes() == im.tobytes()


@test
def a_strip_is_the_frames_side_by_side():
    strip = M.strip([figure(160), figure(160, dx=10)])
    assert strip.size == (2 * M.CELL, M.CELL)
    assert strip.getpixel((80, 30)) == SKIN and strip.getpixel((M.CELL + 90, 30)) == SKIN and strip.getpixel((M.CELL + 61, 30))[3] == 0


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
