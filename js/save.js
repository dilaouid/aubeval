// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Saving. The whole game is the plain object `state`, so a save is that object as JSON:
// kept in this browser (localStorage) every few seconds, and exported or imported as a file.
// Coming back, the village earns for the time it was closed (capped in config.js).
// The land is not in the save: only its seed (state.mapSeed) and what the player changed on it
// (state.land). A save from the first, small map (v 1) is brought onto the big one when it is
// loaded, and the file as it was is kept beside it once (KEY + '.before-v<new version>').
// v 3: beer became coffee (the tavern a café), and every working building needs a path to the
// hall: an older village gets the paths it needs, laid for free (Village.autoRoads).
// v 4: the city's rank, orders, popularity and taxes, the fog and the places entered: each module
// fills what an older save lacks (City.adopt, Explore.adopt, Venue.adopt).
// The wall clock is read here and nowhere else: only to date a save and measure an absence.
'use strict';

const Save = (() => {
  const KEY = 'aubeval.save.v1', VERSION = 4; // the key keeps its first name: an older save is found, then brought up to date
  // ?nosave plays without touching the save; ?demo=1 shows a made-up village and must never overwrite a real one.
  const enabled = !(params.has('nosave') || params.has('demo'));
  let live = false; // true once the player is in their village: the title's backdrop is never saved

  function has() { try { return enabled && !!localStorage.getItem(KEY); } catch (e) { return false; } }
  /** Writes the save now. */
  function persist() {
    if (!enabled || !live) return false;
    state.savedAt = Date.now(); state.seed = seed;
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }
  /** Fills a loaded save with any field a newer version added, so old saves keep working. */
  function adopt(data) {
    const base = Village.fresh();
    if (data.tuto === undefined) data.tuto = { step: 0, done: true }; // a village from before the tutorial: no start, but the lessons are still offered
    for (const k in base) if (data[k] === undefined) data[k] = base[k];
    const old = data.v;
    for (const k of ['res', 'totals', 'hero', 'quests', 'counters', 'raid', 'prestige', 'stats', 'cam', 'flags', 'land', 'tuto']) {
      for (const j in base[k]) if (data[k][j] === undefined) data[k][j] = base[k][j];
    }
    if (old < 3) { // beer became coffee, and the tavern a café
      for (const k of ['res', 'totals']) if (data[k].ale) { data[k].coffee = (data[k].coffee || 0) + data[k].ale; delete data[k].ale; }
      for (const b of data.buildings) if (b.kind === 'tavern') { b.kind = 'cafe'; delete b.starved; b.prog = 0; }
    }
    for (const r of DATA.resourceOrder) { if (data.res[r] == null) data.res[r] = 0; if (data.totals[r] == null) data.totals[r] = 0; }
    data.buildings = data.buildings.filter(b => DATA.buildings[b.kind]); // content removed since: dropped, not a crash
    data.hero.inv = data.hero.inv.filter(id => DATA.items[id]);
    data.units = (data.units || []).filter(u => DATA.units[u.kind]);
    data.raid.traps = (data.raid.traps || []).filter(t => DATA.traps[t.kind]);
    for (const slot in data.hero.equip) if (data.hero.equip[slot] && !DATA.items[data.hero.equip[slot]]) data.hero.equip[slot] = null;
    City.adopt(data, old); Explore.adopt(data, old); Venue.adopt(data, old); // each fills its own part of an older save
    state = data;
    if (data.seed) seed = data.seed;
    if (old === 1) Village.migrateV1(); else Village.sync();
    if (old < 3) { const n = Village.autoRoads(); if (n) ui.roadsLaid = n; }
    state.v = VERSION;
    const laid = ui.roadsLaid;
    Village.refreshUnlocks(true); resetUi();
    if (laid) toast(tr('roads_laid', { n: laid }), UI.C.gold);
  }
  /** The time away, played back: production in coarse steps, the mission's clock. No raid comes while away. */
  function catchUp() {
    const away = clamp((Date.now() - (state.savedAt || Date.now())) / 1000, 0, tune.offline_cap_hours * 3600);
    if (away < 20) return;
    const before = Object.assign({}, state.res), secs = away * tune.offline_rate, n = Math.min(4000, Math.ceil(secs));
    for (let i = 0; i < n; i++) Village.tick(secs / n);
    Units.away(secs); // the workers' trips, counted at their average pace
    Camp.away(away); // a fallen camp's respite runs on
    Hero.tick(away);
    Explore.away(secs, away); // EXPLORE hook: what the trade routes and the deposits paid, the expedition and the scouts under way, the lairs filling again
    const gains = {};
    for (const r of DATA.resourceOrder) { const d = Math.floor(state.res[r] - before[r]); if (d > 0) gains[r] = d; }
    ui.away = { seconds: away, gains };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY), data = JSON.parse(raw);
      if (!data || !(data.v >= 1 && data.v <= VERSION)) return false;
      if (data.v < VERSION && !localStorage.getItem(KEY + '.before-v' + VERSION)) localStorage.setItem(KEY + '.before-v' + VERSION, raw);
      adopt(data); live = true; catchUp(); return true;
    } catch (e) { return false; }
  }
  function begin() { live = true; persist(); }
  function wipe() { live = false; try { localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ } } // nothing is saved again until begin(): the next game is named first
  /** Downloads the save as a file. */
  function exportFile() {
    state.savedAt = Date.now(); state.seed = seed;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }));
    a.download = 'aubeval-sauvegarde.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  /** Opens a file picker and loads the chosen save. */
  function importFile() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !(data.v >= 1 && data.v <= VERSION) || !Array.isArray(data.buildings)) throw new Error('not a save');
          adopt(data); live = true; scene = 'play'; persist(); toast(tr('imported'), UI.C.good);
        } catch (e) { toast(tr('import_bad'), UI.C.bad); }
      };
      reader.readAsText(file);
    };
    input.click();
  }
  // Closing or hiding the page saves, so the absence is counted from the right moment.
  addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });

  return { has, persist, load, begin, wipe, exportFile, importFile, get enabled() { return enabled; } };
})();
