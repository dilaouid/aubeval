"""Builds docs/combat.gif: python tools/make_combat_gif.py [frames-dir]
Records a scripted battle with tools/record-combat.js (headless Chrome, the game's own manual mode), then turns
the frames into one looping GIF: the hand, two cards played, the enemies' turn with every blow parried dead on,
and the next turn opening. Pass a frames-dir to rebuild from frames already recorded."""
import shutil, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SIZE = (960, 540)    # the game draws 1280x720; text stays readable at this size and the file stays small
FRAME_MS = 67        # the recording is 15 frames a second
END_HOLD_MS = 1400   # linger on the new turn before the loop restarts

frames_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.mkdtemp(prefix='aubeval-combat-'))
if len(sys.argv) <= 1:
    subprocess.run(['node', str(ROOT / 'tools/record-combat.js'), str(frames_dir)], check=True)

files = sorted(frames_dir.glob('f*.png'))
imgs = [Image.open(f).convert('RGB').resize(SIZE, Image.LANCZOS) for f in files]

# One palette for the whole clip (no flicker), built from a spread of its frames.
sample = imgs[::max(1, len(imgs) // 12)]
sheet = Image.new('RGB', (SIZE[0], SIZE[1] * len(sample)))
for i, im in enumerate(sample):
    sheet.paste(im, (0, i * SIZE[1]))
pal = sheet.quantize(256, method=Image.MEDIANCUT, dither=Image.NONE)
out = [im.quantize(palette=pal, dither=Image.NONE) for im in imgs]

dest = ROOT / 'docs/combat.gif'
dur = [FRAME_MS] * len(out)
dur[-1] = END_HOLD_MS
out[0].save(dest, save_all=True, append_images=out[1:], duration=dur, loop=0, optimize=False)
print(dest, f'{len(out)} frames', f'{dest.stat().st_size / 1024 / 1024:.1f} MB')
if len(sys.argv) <= 1:
    shutil.rmtree(frames_dir, ignore_errors=True)
