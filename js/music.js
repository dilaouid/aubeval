'use strict';
// Music: one looping track at a time, crossfaded when the scene asks for another.
// index.html calls Music.update(STEP) after every simulation step. The tracks and their
// licences are listed in assets/music/CREDITS.md.
//
// Which track plays:
//   loading, title     menu
//   play               world (the village), raid while a raid is on the map
//   battle             battle (the card battle, the sieges' duel too)
//   venue              the place's own theme: cafe, shop (market) or forge
//   pause              the same track, quieter
//   anything else      silence
//
// The tracks are streamed (a media element each), not decoded: the longest is over four minutes
// and a decoded track would weigh a hundred megabytes. The volume is set on the element itself
// (not through the Web Audio graph), so it also plays from a double-click (file://), where a
// media element cannot be routed through the graph.
// ?music=0 plays the game without music.
const Music = (() => {
  const DIR = 'assets/music/';
  const FILES = {
    menu: 'menu_awesomeness.ogg',
    world: 'world_world-map.ogg',
    raid: 'raid_battle-in-the-winter.ogg',
    battle: 'battle_battle-rpg-theme.ogg',
    cafe: 'cafe_the-bards-tale.ogg',
    market: 'shop_buy-something.ogg',
    forge: 'forge_minstrel-dance.ogg',
  };
  const FADE = 1.2;     // seconds a crossfade takes
  const DUCK = 0.35;    // the paused game's share of the volume
  const KEEP = { world: 1, menu: 1 }; // the tracks that pick up where they stopped; the others start over each time
  const off = CHEAP || params.get('music') === '0' || !!window.GAME_AUDIO; // a headless shot or a check (it injects its own audio) has no use for it
  const tracks = {}; // id -> { el, v (0..1, how far its fade is), retry (seconds before play() is asked again) }
  let cur = null;    // the track the scene asked for last

  function get(id) {
    if (!tracks[id]) {
      const el = new Audio(DIR + FILES[id]);
      el.loop = true; el.preload = 'auto'; el.volume = 0;
      tracks[id] = { el, v: 0, retry: 0 };
    }
    return tracks[id];
  }

  /** The track this moment of the game asks for, or null for silence. */
  function want() {
    switch (scene) {
      case 'loading': case 'title': return 'menu';
      case 'battle': return 'battle';
      case 'venue': return Venue.id;
      case 'play': return state.raid && state.raid.active ? 'raid' : 'world';
      case 'pause': return cur; // the game goes quiet, the music with it
      case 'naming': return ui.nameEdit ? cur : null; // changing look from a running game: the track goes on; naming a new game is silent
      default: return null;
    }
  }

  function update(dt) {
    if (off || !audio) return; // `audio` exists from the first key or click: a browser lets sound start only after one
    if (document.visibilityState !== 'visible') { for (const id in tracks) tracks[id].el.pause(); return; }
    cur = want();
    if (cur && !FILES[cur]) cur = null;
    const master = muted ? 0 : tune.volume * (scene === 'pause' ? DUCK : 1) * tune.music;
    if (cur) get(cur);
    for (const id in tracks) {
      const t = tracks[id], on = id === cur;
      t.v = clamp(t.v + (on ? dt : -dt) / FADE, 0, 1);
      t.el.volume = clamp(t.v * master, 0, 1);
      if (on) {
        t.retry = Math.max(0, t.retry - dt);
        if (t.el.paused && t.retry <= 0) { t.retry = 1; const p = t.el.play(); if (p && p.catch) p.catch(() => {}); } // refused (no gesture yet, file still loading): asked again in a second
      } else if (t.v === 0 && !t.el.paused) {
        t.el.pause();
        if (!KEEP[id]) t.el.currentTime = 0;
      }
    }
  }

  return { update, get current() { return cur; } };
})();
