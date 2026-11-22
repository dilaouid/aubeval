# PROTOTYPE - NOT FOR PRODUCTION
"""Makes the boss battles' backdrop, assets/sprites/bg_battle_boss.png, from the day one.

Nothing is drawn anew: assets/sprites/bg_battle.png is graded to dusk, so the two backdrops stay
the same place, pixel for pixel (js/battle.js shows the second when the fight is a boss's).

  the sky     everything above the hills takes the colour of a dusk sky at its height (SKY: violet
              at the top, orange at the horizon, in BANDS flat bands like the day sky's), lit a
              little by its own brightness so the clouds stay, rosy.
  the rest    hills, trees, grass and path are darkened and pulled toward purple (GRADE), and lose
              a little of their colour (FADE).

Run from the root of the repository:  python tools/make_boss_backdrop.py
"""
from PIL import Image, ImageChops

SRC = 'assets/sprites/bg_battle.png'
OUT = 'assets/sprites/bg_battle_boss.png'
HORIZON = 0.37                      # share of the height above which blue and white are sky
SKY = [(0.0, (58, 29, 92)), (0.35, (106, 42, 120)), (0.7, (184, 64, 95)), (1.0, (240, 122, 60))]  # as js/art.js bg.battle, frame 1
BANDS = 14                          # flat bands of sky, top to horizon
GRADE = [(0.66, 16), (0.56, 8), (0.70, 30)]  # per channel: x this, + that
FADE = 0.22                         # share of the graded ground's colour that is washed out to grey


def sky_colour(t):
    """The dusk sky's colour at t (0: top of the image, 1: the horizon), between the stops of SKY."""
    for (t0, c0), (t1, c1) in zip(SKY, SKY[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(round(a + (b - a) * k) for a, b in zip(c0, c1))
    return SKY[-1][1]


def main():
    im = Image.open(SRC).convert('RGB')
    w, h = im.size
    r, g, b = im.split()
    top = int(h * HORIZON)

    # the sky: in each column, everything above the first pixel of the hills (the first one, going
    # down, where green leads blue: the sky is blue, its clouds white)
    px = im.load()
    mask = Image.new('L', (w, h), 0)
    for x in range(w):
        y = 0
        while y < top and not (px[x, y][1] > px[x, y][2] + 6 and px[x, y][0] < 200):
            y += 1
        mask.paste(255, (x, 0, x + 1, y))

    dusk = Image.new('RGB', (w, h))
    for y in range(top):
        band = min(BANDS - 1, y * BANDS // top)
        dusk.paste(sky_colour(band / (BANDS - 1)), (0, y, w, y + 1))
    light = im.convert('L').point(lambda v: 150 + v * 105 // 255)        # clouds stay lighter than the sky around them
    dusk = ImageChops.multiply(dusk, Image.merge('RGB', (light, light, light)))

    rest = Image.merge('RGB', [c.point(lambda v, k=k, a=a: min(255, int(v * k + a))) for c, (k, a) in zip((r, g, b), GRADE)])
    rest = Image.blend(rest, rest.convert('L').convert('RGB'), FADE)     # a little of the colour goes with the light
    out = Image.composite(dusk, rest, mask)
    out.save(OUT)
    print('%s -> %s %dx%d' % (SRC, OUT, w, h))


if __name__ == '__main__':
    main()
