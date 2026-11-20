// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-20
// Where Aveline suggests building. Every free place a building fits on is scored against the village
// as the player has built it, and the best one is lit: a village that grows by her suggestions stays
// airy and tidy. What a place is scored on, each with its weight in config.js (siting_*):
//   path    tiles of new path it would need (a place off the streets is fine when a short path joins it)
//   far     its distance from the hall: the village stays compact
//   near    its distance from where the step says (`near` in data/tutorial.js), for the guided start
//   noise   a noisy workshop (beauty < 0) beside houses, or a house beside one: quarters stay apart
//   charm   a pretty building or a decoration beside houses: the more houses it graces, the better
//   serve   a service (café, chapel, market) reaching houses, above all houses it does not reach yet
//   kin     a workshop beside its own kind or its chain (sawmill by the lumber huts), a house by houses
//   cramp   other buildings against its sides: some breathing room
//   pocket  a free tile it would wall in for good, or a one-tile sliver between it and another building
//   block   the tiles straight on from a street's dead end: where the street will go on
//   front   a decoration or a tower on the tiles beside a street: they are for the buildings that need one
//   face    a workshop's long side along its street (rewarded)
//   tower   a tower away from the side of the village that faces the goblin camp
// Nothing here reads the game: the caller hands it the village (`env`, below). js/tutorial.js builds
// it from the live game; tools/check-siting.js from small made-up villages, to test the choices.
//
// env, in tiles:
//   B                 DATA.buildings
//   buildings         [{ uid, kind, x, y, w, h, lvl }], their footprints as they stand (turned)
//   hall              { x, y, w, h }
//   size(kind, rot)   a footprint { w, h }; canTurn(kind)
//   needsRoad(kind)   whether it must touch a path joined to the hall
//   free(x, y)        a tile something can be built or paved on; road(x, y) a path joined to the hall;
//                     built(x, y) a tile under a building; tree(x, y) a tree (optional)
//   camp              { x, y } the middle of the goblin camp, or null
//   R                 config.js beauty_radius; serviceR(b) a service building's reach
//   hidden(tx, ty, w, h)   optional: true when the place would be lost behind a building's picture
//   w                 the weights: Siting.weights(tune)
'use strict';

const Siting = (() => {
  /** The weights, from config.js. */
  const weights = t => ({
    reach: t.siting_reach, pathMax: t.siting_path_max, path: t.siting_path, far: t.siting_far, near: t.siting_near,
    noise: t.siting_noise, charm: t.siting_charm, serve: t.siting_serve, kin: t.siting_kin, cramp: t.siting_cramp,
    pocket: t.siting_pocket, block: t.siting_block, front: t.siting_front, face: t.siting_face, tower: t.siting_tower,
  });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const key = (x, y) => y * 65536 + x;
  /** The tiles beside a footprint's four sides (never its corners). */
  function around(tx, ty, w, h, f) {
    for (let x = 0; x < w; x++) { f(tx + x, ty - 1, 0, -1); f(tx + x, ty + h, 0, 1); }
    for (let y = 0; y < h; y++) { f(tx - 1, ty + y, -1, 0); f(tx + w, ty + y, 1, 0); }
  }
  /** The tiles around a footprint, corners included. */
  function ring(tx, ty, w, h, f) {
    for (let x = tx - 1; x <= tx + w; x++) { f(x, ty - 1); f(x, ty + h); }
    for (let y = ty; y < ty + h; y++) { f(tx - 1, y); f(tx + w, y); }
  }

  /** What the village is now, worked out once for all the places scored. */
  function survey(env, span) {
    const B = env.B, hall = env.hall, hc = mid(hall);
    const town = env.buildings.filter(b => b.kind !== 'hall' && !B[b.kind].wall && !B[b.kind].tower);
    const extent = Math.max(6, ...town.map(b => dist(mid(b), hc)));
    const houses = env.buildings.filter(b => B[b.kind].pop);
    // the tiles straight on from each street's dead end: kept free for the street to go on
    const reserved = new Map(), x0 = Math.floor(hc.x - span), y0 = Math.floor(hc.y - span), x1 = Math.ceil(hc.x + span), y1 = Math.ceil(hc.y + span);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!env.road(x, y)) continue;
      const on = SIDES.filter(([dx, dy]) => env.road(x + dx, y + dy));
      if (on.length !== 1) continue;
      const [dx, dy] = on[0];
      for (let i = 1; i <= 3; i++) { const k = key(x - dx * i, y - dy * i); reserved.set(k, Math.max(reserved.get(k) || 0, i === 1 ? 1 : 0.5)); }
    }
    let u = { x: 0, y: 1 };
    if (env.camp) { const d = dist(env.camp, hc) || 1; u = { x: (env.camp.x - hc.x) / d, y: (env.camp.y - hc.y) / d }; }
    return { hc, extent, houses, reserved, u, x0, y0, x1, y1 };
  }

  /** From the streets, over free tiles: how many tiles of new path reach each tile (up to `max`), and the way back. */
  function paths(env, sv, max) {
    const out = new Map(), q = [];
    for (let y = sv.y0 - max; y <= sv.y1 + max; y++) for (let x = sv.x0 - max; x <= sv.x1 + max; x++) if (env.road(x, y)) { out.set(key(x, y), { n: 0, x, y, prev: null }); q.push(key(x, y)); }
    for (let i = 0; i < q.length; i++) {
      const o = out.get(q[i]);
      if (o.n >= max) continue;
      for (const [dx, dy] of SIDES) {
        const X = o.x + dx, Y = o.y + dy, k = key(X, Y);
        if (out.has(k) || !env.free(X, Y)) continue;
        out.set(k, { n: o.n + 1, x: X, y: Y, prev: o }); q.push(k);
      }
    }
    return out;
  }
  /** How a footprint joins the streets: { n, tiles } of new path (none when it touches one), or null. */
  function joinOf(env, pm, tx, ty, w, h) {
    let best = null;
    const inside = (x, y) => x >= tx && x < tx + w && y >= ty && y < ty + h;
    around(tx, ty, w, h, (x, y) => {
      if (best && best.n === 0) return;
      if (env.road(x, y)) { best = { n: 0, tiles: [] }; return; }
      const o = pm.get(key(x, y));
      if (!o || (best && o.n >= best.n)) return;
      const tiles = [];
      for (let p = o; p && p.n > 0; p = p.prev) { if (inside(p.x, p.y)) return; tiles.push({ tx: p.x, ty: p.y }); }
      best = { n: tiles.length, tiles: tiles.reverse() }; // from the street out to the building
    });
    return best;
  }

  /** What one kind of thing is, for the scoring: a building's data, or `as` (a tree to plant). */
  function traits(env, kind, as) {
    const d = as || env.B[kind] || {};
    const partners = new Set();
    for (const k in env.B) { // its chain: what feeds it, what it feeds
      const o = env.B[k];
      const feeds = (a, b) => a.produces && b.consumes && Object.keys(a.produces).some(r => r !== 'gold' && b.consumes[r]);
      if (k !== kind && (feeds(o, d) || feeds(d, o))) partners.add(k);
    }
    return {
      d, beauty: d.beauty || 0, home: !!d.pop, service: !!d.service, decor: !!d.decor, tower: !!d.tower, guard: !!d.train,
      work: !d.pop && !d.decor && !d.tower && !d.wall && !d.service && !!(d.produces || d.craft || d.train),
      wide: (d.w || 1) * (d.h || 1) >= 9 && (d.beauty || 0) >= 0, partners,
    };
  }

  /** The score of a place (lower is better). `why`, when given, gets each term: [name, value]. */
  function score(env, sv, kind, tr, c, opts, why) {
    const w = env.w, B = env.B, { tx, ty } = c, cw = c.w, ch = c.h, m = { x: tx + cw / 2, y: ty + ch / 2 };
    let s = 0;
    const add = (name, v) => { if (!v) return; s += v; if (why) { const o = why.find(q => q[0] === name); if (o) o[1] += v; else why.push([name, v]); } };
    const inside = (x, y) => x >= tx && x < tx + cw && y >= ty && y < ty + ch;
    if (c.join) add('path', w.path * c.join.n);
    add('far', w.far * dist(m, sv.hc) * (tr.wide ? 0.5 : 1));
    if (opts.near) add('near', w.near * dist(m, opts.near));

    // its beauty or its noise, on the houses around it
    if (!tr.home && tr.beauty) {
      const reach = env.R + Math.max(cw, ch) / 2;
      let graced = 0;
      for (const h of sv.houses) {
        const dd = dist(mid(h), m);
        if (tr.beauty < 0) {
          if (dd <= reach) add('noise', w.noise * -tr.beauty);
          else if (dd <= reach + 3) add('noise', w.noise * 0.25 * -tr.beauty); // the land just beyond: kept for houses
        } else if (dd <= reach && graced < 6) { graced++; add('charm', -w.charm * tr.beauty); }
      }
      if (tr.beauty < 0 && dist(sv.hc, m) <= reach) add('noise', w.noise * 0.5 * -tr.beauty); // the hall's square: the heart of the village stays quiet
    }
    // a house: the noise, beauty and services already around it, and its neighbours
    if (tr.home) {
      let kin = 0, charm = 0;
      for (const o of env.buildings) {
        const od = B[o.kind], om = mid(o), dd = dist(om, m);
        if (od.beauty && !od.pop && dd <= env.R + Math.max(o.w, o.h) / 2) { if (od.beauty < 0) add('noise', w.noise * -od.beauty); else charm += od.beauty; }
        if (od.service && dd <= env.serviceR(o)) add('serve', -w.serve);
        if (od.pop && dd <= 7) kin++;
      }
      add('charm', -w.charm * Math.min(3, charm)); // a pretty street draws it, but never into the square itself
      add('kin', -w.kin * Math.min(3, kin));
    }
    if (!tr.decor) for (const o of env.buildings) if (B[o.kind].decor && dist(mid(o), m) < Math.max(cw, ch) / 2 + 1.5) add('cramp', w.cramp * 2); // a decoration keeps its bit of open ground
    // a service: the houses it reaches, above all those that have none of its kind yet
    if (tr.service) {
      const r = tr.d.service.radius, same = env.buildings.filter(o => o.kind === kind);
      for (const h of sv.houses) {
        const hm = mid(h);
        if (dist(hm, m) > r) continue;
        add('serve', -w.serve * (same.some(o => dist(mid(o), hm) <= env.serviceR(o)) ? 0.5 : 1.5));
      }
    }
    // a workshop: beside its own kind, its chain, or the other noisy ones (one quarter for them all)
    if (tr.work) {
      let near = Infinity;
      for (const o of env.buildings) {
        const od = B[o.kind];
        if (o.kind === kind || tr.partners.has(o.kind) || (tr.beauty < 0 && od.beauty < 0 && !od.pop)) near = Math.min(near, dist(mid(o), m));
      }
      if (near < 9) add('kin', -w.kin * 3 * (9 - near) / 9);
    }
    // a tower: on the side of the camp, just past the houses and workshops
    if (tr.tower) {
      const goal = { x: sv.hc.x + sv.u.x * (sv.extent + 3), y: sv.hc.y + sv.u.y * (sv.extent + 3) };
      add('tower', w.tower * dist(m, goal));
      for (const o of env.buildings) if (B[o.kind].tower && dist(mid(o), m) < 5) add('tower', w.tower * 3); // towers spread along the front
    }
    if (tr.guard) add('tower', -w.tower * 0.3 * Math.max(-sv.extent, Math.min(sv.extent, (m.x - sv.hc.x) * sv.u.x + (m.y - sv.hc.y) * sv.u.y)));

    // room: buildings against it, tiles walled in, slivers, a street's way on, the street's sides
    if (!tr.decor) {
      let against = 0;
      ring(tx, ty, cw, ch, (x, y) => { if (env.built(x, y)) against++; });
      add('cramp', w.cramp * against * (tr.home ? 0.5 : 1));
    }
    const blocked = (x, y) => inside(x, y) || !(env.free(x, y) || env.road(x, y));
    ring(tx, ty, cw, ch, (x, y) => {
      if (!env.free(x, y) || (c.join && c.join.tiles.some(t => t.tx === x && t.ty === y))) return;
      if (SIDES.every(([dx, dy]) => blocked(x + dx, y + dy))) add('pocket', w.pocket);
    });
    if (!tr.decor) around(tx, ty, cw, ch, (x, y, dx, dy) => { if (env.free(x, y) && env.built(x + dx, y + dy)) add('pocket', w.pocket * 0.4); });
    for (let y = ty; y < ty + ch; y++) for (let x = tx; x < tx + cw; x++) {
      const r = sv.reserved.get(key(x, y)); if (r) add('block', w.block * r);
      if (!c.needRoad && SIDES.some(([dx, dy]) => env.road(x + dx, y + dy))) add('front', w.front);
    }
    if (c.needRoad && c.join && c.join.n === 0) {
      let face = 0; around(tx, ty, cw, ch, (x, y) => { if (env.road(x, y)) face++; });
      add('face', -w.face * Math.min(face, Math.max(cw, ch)));
    }
    return s;
  }

  /**
   * The best place for a building of this kind: { tx, ty, rot, w, h, path: [{ tx, ty }] new path
   * to lay first, from the street out, score, why }, or null when none fits. opts: near { x, y },
   * rot (only that turn; both are tried when left out), as (the traits of a thing that is not a
   * building: a tree), top (how many of the best are checked for `hidden`).
   */
  function best(kind, env, opts = {}) {
    const w = env.w, as = opts.as, d = as || env.B[kind];
    const tr = traits(env, kind, as);
    const needRoad = !as && env.needsRoad(kind);
    const sv0 = survey(env, 0), span = Math.min(w.reach, Math.ceil(sv0.extent) + 10), sv = survey(env, span);
    const pm = needRoad ? paths(env, sv, w.pathMax) : null;
    const rots = opts.rot != null ? [opts.rot] : !as && env.canTurn(kind) && d.w !== d.h ? [0, 1] : [0];
    const all = [];
    for (const rot of rots) {
      const sz = as ? { w: as.w || 1, h: as.h || 1 } : env.size(kind, rot);
      for (let ty = sv.y0; ty <= sv.y1; ty++) for (let tx = sv.x0; tx <= sv.x1; tx++) {
        let fits = true;
        for (let y = 0; y < sz.h && fits; y++) for (let x = 0; x < sz.w && fits; x++) if (!env.free(tx + x, ty + y)) fits = false;
        if (!fits) continue;
        const join = needRoad ? joinOf(env, pm, tx, ty, sz.w, sz.h) : null;
        if (needRoad && !join) continue;
        const c = { tx, ty, rot, w: sz.w, h: sz.h, join, needRoad };
        c.score = score(env, sv, kind, tr, c, opts);
        all.push(c);
      }
    }
    if (!all.length) return null;
    all.sort((a, b) => a.score - b.score || a.ty - b.ty || a.tx - b.tx);
    let pick = all[0];
    if (env.hidden) pick = all.slice(0, opts.top || 40).find(c => !env.hidden(c.tx, c.ty, c.w, c.h)) || all[0]; // in plain sight first
    const why = [];
    score(env, sv, kind, tr, pick, opts, why);
    return { tx: pick.tx, ty: pick.ty, rot: pick.rot, w: pick.w, h: pick.h, path: pick.join ? pick.join.tiles : [], score: pick.score, why };
  }

  /**
   * A rampart of `n` tiles to suggest: across the way from the camp, a few tiles past the village.
   * Returns [{ tx, ty }] or null.
   */
  function wall(n, env) {
    const sv = survey(env, 0), dd = sv.extent + 5, goal = { x: sv.hc.x + sv.u.x * dd, y: sv.hc.y + sv.u.y * dd };
    const [dx, dy] = Math.abs(sv.u.x) > Math.abs(sv.u.y) ? [0, 1] : [1, 0]; // across the way in
    let best = null;
    for (let oy = -8; oy <= 8; oy++) for (let ox = -8; ox <= 8; ox++) {
      const x = Math.round(goal.x - dx * n / 2) + ox, y = Math.round(goal.y - dy * n / 2) + oy, tiles = [];
      for (let i = 0; i < n; i++) tiles.push({ tx: x + dx * i, ty: y + dy * i });
      if (!tiles.every(t => env.free(t.tx, t.ty) && !SIDES.some(([a, b]) => env.road(t.tx + a, t.ty + b)))) continue;
      const s = dist({ x: x + dx * n / 2, y: y + dy * n / 2 }, goal);
      if (!best || s < best.s) best = { s, tiles };
    }
    return best ? best.tiles : null;
  }

  /**
   * A trap's tile: on the raiders' way (`route`, from the camp to the hall), a little before the
   * village, inside a tower's reach when one covers the way. ok(x, y): a trap fits there.
   */
  function trap(route, env, ok) {
    if (!route || !route.length) return null;
    const sv = survey(env, 0), goal = sv.extent + 3, towers = env.buildings.filter(b => env.B[b.kind].tower);
    let best = null;
    for (const t of route) {
      if (!ok(t.tx, t.ty)) continue;
      const p = { x: t.tx + 0.5, y: t.ty + 0.5 }, covered = towers.some(o => dist(mid(o), p) <= env.B[o.kind].tower.range);
      const s = Math.abs(dist(p, sv.hc) - goal) - (covered ? 4 : 0);
      if (!best || s < best.s) best = { s, tx: t.tx, ty: t.ty };
    }
    return best && { tx: best.tx, ty: best.ty };
  }

  return { weights, best, wall, trap };
})();
