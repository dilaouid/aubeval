"""Builds the README's gameplay GIFs: python tools/make_gifs.py [combat cafe market forge]   (default: all four)
Each clip is recorded by tools/record-game.js (headless Chrome, the game's own manual mode), then the frames
become one looping GIF in docs/:
  combat  a scripted battle: two cards played, every blow parried dead on, the next turn opening
  cafe, market, forge  the keeper's mini-game, played by the game's own bot
Pass --frames <dir> with a single clip to rebuild it from frames already recorded."""
import shutil, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
# size: the game draws 1280x720; smaller keeps the file light. ms: one frame. hold: the last frame lingers before the loop.
CLIPS = {
    'combat': dict(size=(960, 540), ms=67, hold=1400),
    'cafe':   dict(size=(800, 450), ms=83, hold=600),
    'market': dict(size=(800, 450), ms=83, hold=1800),
    'forge':  dict(size=(800, 450), ms=83, hold=600),
}


def build(name, frames_dir):
    c = CLIPS[name]
    files = sorted(frames_dir.glob('f*.png'))
    imgs = [Image.open(f).convert('RGB').resize(c['size'], Image.LANCZOS) for f in files]
    # One palette for the whole clip (no flicker), built from a spread of its frames.
    sample = imgs[::max(1, len(imgs) // 12)]
    sheet = Image.new('RGB', (c['size'][0], c['size'][1] * len(sample)))
    for i, im in enumerate(sample):
        sheet.paste(im, (0, i * c['size'][1]))
    pal = sheet.quantize(255, method=Image.MEDIANCUT, dither=Image.NONE)  # 255 colours: index 255 is kept for 'unchanged'
    full = [im.quantize(palette=pal, dither=Image.NONE) for im in imgs]
    # Delta frames: a pixel that did not change since the last frame is written transparent, so almost
    # everything compresses away (the backdrops hardly move; the keeper and the sparks do). A frame that
    # changed nothing is dropped, and its time goes to the one before.
    raw = lambda im: Image.frombytes('L', im.size, im.tobytes())  # palette indexes as grey levels
    kept, kd = [full[0]], [c['ms']]
    for prev, cur in zip(full, full[1:]):
        same = ImageChops.difference(raw(prev), raw(cur)).point(lambda d: 255 if d == 0 else 0)
        if same.getextrema()[0] == 255:
            kd[-1] += c['ms']
            continue
        d = cur.copy(); d.paste(255, mask=same)
        kept.append(d); kd.append(c['ms'])
    kd[-1] += c['hold'] - c['ms']
    dest = ROOT / f'docs/{name}.gif'
    kept[0].save(dest, save_all=True, append_images=kept[1:], duration=kd, loop=0, optimize=False,
                 transparency=255, disposal=1)
    out = kept
    print(dest.name, f'{len(out)} frames', f'{dest.stat().st_size / 1024 / 1024:.1f} MB')


args = sys.argv[1:]
given = None
if '--frames' in args:
    i = args.index('--frames'); given = Path(args[i + 1]); del args[i:i + 2]
names = args or list(CLIPS)
for n in names:
    if n not in CLIPS:
        sys.exit('clips: ' + ' '.join(CLIPS))
    d = given or Path(tempfile.mkdtemp(prefix=f'aubeval-{n}-'))
    if not given:
        subprocess.run(['node', str(ROOT / 'tools/record-game.js'), n, str(d)], check=True)
    build(n, d)
    if not given:
        shutil.rmtree(d, ignore_errors=True)
