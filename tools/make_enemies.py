# PROTOTYPE - NOT FOR PRODUCTION
"""Builds the warlords' duel sprites in assets/sprites/ from the raw PixelLab images in tools/enemies/raw/.

  tools/enemies/raw/<id>.png   one warlord of data/enemies.js DATA.warlords, 96x96 as PixelLab drew it
  -> assets/sprites/enemy_<id>.png   the same image cropped to its opaque pixels: the battle stands
                                     a sprite on its feet (js/battle.js), so its last row is the ground.

Nothing is resampled. The script prints each sprite's size: that is the w and h of its line in
assets/manifest.js ('enemy.<id>'). tools/enemies/ids.tsv says where each raw image comes from.

Run from the root of the repository:  python tools/make_enemies.py
"""
import glob
import os
from PIL import Image

RAW = 'tools/enemies/raw'
OUT = 'assets/sprites/enemy_%s.png'

for src in sorted(glob.glob(os.path.join(RAW, '*.png'))):
    name = os.path.splitext(os.path.basename(src))[0]
    im = Image.open(src).convert('RGBA')
    im = im.crop(im.getbbox())
    im.save(OUT % name)
    print("'enemy.%s': { file: 'sprites/enemy_%s.png', w: %d, h: %d }," % (name, name, im.width, im.height))
