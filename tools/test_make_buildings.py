# PROTOTYPE - NOT FOR PRODUCTION
"""Tests of tools/make_buildings.py: which width a building's tiers are held to, and what is installed.

Works on synthetic images in a folder of its own: the real tools/buildings/raw/ and assets/sprites/iso/
are never touched.

Run from the root of the repository:  python tools/test_make_buildings.py   (exit code 1 on a failure)
"""
import os
import shutil
import sys
import tempfile
from PIL import Image

import make_buildings as M

WALL = (200, 120, 60, 255)


def building(w, h, pad=6):
    """A raw image as PixelLab gives it: a w x h building in the middle of a transparent margin `pad` wide."""
    im = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    im.paste(WALL, (pad, pad, pad + w, pad + h))
    return im


class Folders:
    """A raw folder and an output folder, made empty for one test and thrown away after it."""
    def __enter__(self):
        self.root = tempfile.mkdtemp()
        self.raw, self.out = os.path.join(self.root, 'raw'), os.path.join(self.root, 'out')
        os.makedirs(self.raw)
        os.makedirs(self.out)
        return self

    def __exit__(self, *a):
        shutil.rmtree(self.root)

    def put(self, where, name, im):
        im.save(os.path.join(self.raw if where == 'raw' else self.out, name))

    def size(self, name):
        p = os.path.join(self.out, name)
        return Image.open(p).size if os.path.exists(p) else None


tests = []


def test(f):
    tests.append(f)
    return f


@test
def an_older_building_is_held_to_its_installed_level_1():
    with Folders() as F:
        F.put('out', 'mill_l1.png', Image.new('RGBA', (40, 30), WALL))
        F.put('raw', 'mill_l5.png', building(40, 50))
        F.put('raw', 'mill_l10.png', building(44, 50))
        assert M.build(F.raw, F.out) == 1
        assert F.size('mill_l5.png') == (40, 50), F.size('mill_l5.png')
        assert F.size('mill_l10.png') is None, 'a wider tier was installed'
        assert F.size('mill_l1.png') == (40, 30), 'the installed level 1 was touched'


@test
def a_raw_level_1_is_installed_cropped_and_is_the_reference():
    with Folders() as F:
        F.put('raw', 'lodge_l1.png', building(50, 40))
        F.put('raw', 'lodge_l5.png', building(50, 60, pad=9))
        assert M.build(F.raw, F.out) == 0
        assert F.size('lodge_l1.png') == (50, 40), F.size('lodge_l1.png')
        assert F.size('lodge_l5.png') == (50, 60), F.size('lodge_l5.png')
        assert M.check(F.raw, F.out) == 0


@test
def a_raw_level_1_wins_over_an_old_installed_one():
    with Folders() as F:
        F.put('out', 'lodge_l1.png', Image.new('RGBA', (30, 30), WALL))
        F.put('raw', 'lodge_l1.png', building(50, 40))
        F.put('raw', 'lodge_l5.png', building(50, 60))
        assert M.build(F.raw, F.out) == 0
        assert F.size('lodge_l1.png') == (50, 40) and F.size('lodge_l5.png') == (50, 60)


@test
def a_tier_wider_than_its_raw_level_1_is_refused():
    with Folders() as F:
        F.put('raw', 'lodge_l1.png', building(50, 40))
        F.put('raw', 'lodge_l15.png', building(52, 60))
        assert M.build(F.raw, F.out) == 1
        assert F.size('lodge_l15.png') is None


@test
def check_finds_a_tier_of_the_wrong_width():
    with Folders() as F:
        F.put('raw', 'lodge_l1.png', building(50, 40))
        F.put('raw', 'lodge_l5.png', building(50, 60))
        M.build(F.raw, F.out)
        F.put('out', 'lodge_l5.png', Image.new('RGBA', (48, 60), WALL))
        assert M.check(F.raw, F.out) == 1


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
