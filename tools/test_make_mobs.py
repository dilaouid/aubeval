# PROTOTYPE - NOT FOR PRODUCTION
"""Tests of tools/make_mobs.py: the map figures of the first mobs, built from the raw PixelLab frames.

Run from the root of the repository:  python tools/test_make_mobs.py   (exit code 1 on a failure)
"""
import contextlib
import io
import os
import sys
import tempfile
from PIL import Image

import make_heroes as H
import make_mobs as M

D = H.ROWS  # the eight directions, in the order the game reads the sheet


def frame(size, col):
    im = Image.new('RGBA', size, (0, 0, 0, 0))
    im.paste(col, (4, 2, size[0] - 4, size[1]))   # a figure that stands on the bottom row
    return im


def make_mob(root, name, size=(20, 24), walk=6, skip=None):
    """tools/mobs/raw/<name>/ as PixelLab's ZIP lays it out once renamed: rotations/<dir>.png, walk/<dir>/frame_NNN.png."""
    for i, d in enumerate(D):
        os.makedirs(os.path.join(root, name, 'unit', 'walk', d))
        os.makedirs(os.path.join(root, name, 'unit', 'rotations'), exist_ok=True)
        col = (40 + i * 20, 90, 60, 255)
        frame(size, col).save(os.path.join(root, name, 'unit', 'rotations', d + '.png'))
        for k in range(walk if d != skip else 0):
            frame(size, col).save(os.path.join(root, name, 'unit', 'walk', d, 'frame_%03d.png' % k))


tests = []


def test(f):
    tests.append(f)
    return f


@test
def a_mob_becomes_a_sheet_of_seven_columns_and_eight_rows():
    with tempfile.TemporaryDirectory() as raw, tempfile.TemporaryDirectory() as out:
        make_mob(raw, 'gobelin')
        lines = M.build(raw, out)
        assert len(lines) == 1 and 'gobelin' in lines[0], lines
        with Image.open(os.path.join(out, 'unit_gobelin.png')) as sheet:   # closed before the folder goes (Windows keeps it)
            assert sheet.width % 7 == 0 and sheet.height % 8 == 0, sheet.size
            assert (sheet.width // 7, sheet.height // 8) == (12, 22), sheet.size   # the cell is the figure's box, 20x24 minus the empty margins


@test
def every_mob_found_is_built_by_name():
    with tempfile.TemporaryDirectory() as raw, tempfile.TemporaryDirectory() as out:
        for n in ('brute', 'chaman'):
            make_mob(raw, n)
        M.build(raw, out)
        assert sorted(os.listdir(out)) == ['unit_brute.png', 'unit_chaman.png'], os.listdir(out)


@test
def a_mob_with_a_direction_missing_its_walk_is_refused_and_nothing_is_written_for_it():
    with tempfile.TemporaryDirectory() as raw, tempfile.TemporaryDirectory() as out:
        make_mob(raw, 'gobelin', skip='west')
        try:
            M.build(raw, out)
        except H.Refused:
            pass
        else:
            raise AssertionError('a mob with no walk to the west was built')
        assert not os.path.exists(os.path.join(out, 'unit_gobelin.png'))


@test
def a_mob_whose_frames_differ_in_size_is_refused():
    with tempfile.TemporaryDirectory() as raw, tempfile.TemporaryDirectory() as out:
        make_mob(raw, 'brute')
        frame((22, 24), (1, 2, 3, 255)).save(os.path.join(raw, 'brute', 'unit', 'walk', 'east', 'frame_002.png'))
        try:
            M.build(raw, out)
        except H.Refused:
            pass
        else:
            raise AssertionError('frames of two sizes were laid in one sheet')


@test
def check_says_what_is_not_built_and_what_is_wrong():
    with tempfile.TemporaryDirectory() as raw, tempfile.TemporaryDirectory() as out:
        make_mob(raw, 'gobelin')
        quiet = lambda: contextlib.redirect_stdout(io.StringIO())   # check prints a line per sheet
        with quiet():
            assert M.check(raw, out) == 1          # its raw is there, its sheet is not
            M.build(raw, out)
            assert M.check(raw, out) == 0
            Image.new('RGBA', (13, 17)).save(os.path.join(out, 'unit_gobelin.png'))   # neither 7 columns nor 8 rows
            assert M.check(raw, out) == 1


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
