// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// The screens: loading, title, the village (play), battle, pause and figures, with the village's panels.
// `ui` is what the screen remembers between frames and is never saved.
'use strict';

const ui = {};
// placing: a building's id on the pointer; tool: a land tool on it ('path', 'clear' or 'plant:<flora id>');
// bar: the build bar's open tab; stroke: the last tile a held pointer drew on (the axe: the last screen point it swept).
// rot: 1 when the building on the pointer is turned (R); wall: the tile a rampart being drawn starts
// from (the pointer held down); wallVoid: that drawing was called off, until the button comes up.
// selU: the ids of the soldiers the player has selected; box: the selection box being drawn (Shift + drag).
function resetUi() { Object.assign(ui, { selU: [], box: null, panel: null, sel: null, placing: null, moving: null, tool: null, rot: 0, wall: null, wallShape: null, wallVoid: false, bar: DATA.buildTabs[0].id, stroke: null, tab: 'main', toasts: [], floats: [], disp: {}, wipeArm: 0, away: null, banner: null, saveT: 0, titleWipe: 0, titleT: 0 }); }
resetUi();
/** A line of news at the top of the screen. */
function toast(msg, color) { ui.toasts.push({ msg, color: color || UI.C.text, t: 0 }); if (ui.toasts.length > 4) ui.toasts.shift(); }
/** A number that pops from a place on the map and drifts up. */
/** A word that rises from a map point; `lift`: how many art pixels above the ground it starts. */
function floatText(wx, wy, msg, color, size, lift) { ui.floats.push({ wx, wy, lift: lift || 0, msg, color: color || UI.C.text, size: size || 16, t: 0 }); }

const scenes = (() => {
  const C = UI.C, B = DATA.buildings, I = DATA.items, RES = DATA.resources, T = DATA.map.tile, U = DATA.units;
  const TOP = 52, BOTTOM = 586; // the HUD's top bar ends at TOP, the build bar starts at BOTTOM
  const P = { x: 868, y: 60, w: 404, h: 520 }; // the side panel
  const lower = s => s.charAt(0).toLowerCase() + s.slice(1);
  const closePanel = () => { ui.panel = null; ui.sel = null; };
  function togglePanel(p) { ui.panel = ui.panel === p ? null : p; ui.sel = null; ui.placing = null; ui.moving = null; ui.tool = null; }
  /** Backs out one thing: a placement, then an open panel. False when there was nothing to back out of. */
  function cancel() {
    if (ui.wall) { ui.wall = null; ui.wallShape = null; ui.wallVoid = true; return true; } // the rampart being drawn, not the palisade on the pointer
    if (ui.placing || ui.moving || ui.tool) { ui.placing = null; ui.moving = null; ui.tool = null; return true; }
    if (ui.selU.length) { ui.selU = []; return true; }
    if (ui.panel) { closePanel(); return true; }
    return false;
  }

  // ---- The village's step ----
  function effects(dt) {
    for (let i = ui.toasts.length - 1; i >= 0; i--) { ui.toasts[i].t += dt; if (ui.toasts[i].t > 5) ui.toasts.splice(i, 1); }
    for (let i = ui.floats.length - 1; i >= 0; i--) { ui.floats[i].t += dt; if (ui.floats[i].t > 1) ui.floats.splice(i, 1); }
    for (const r of DATA.resourceOrder) { // totals count up smoothly, never in jumps
      const d = ui.disp[r] == null ? state.res[r] : ui.disp[r], diff = state.res[r] - d;
      ui.disp[r] = Math.abs(diff) < 0.6 ? state.res[r] : d + diff * Math.min(1, dt * 10);
    }
  }
  /** What goes on whatever the screen shows: time, production, autosave. The battle calls it too. */
  function background(dt) {
    state.t += dt; Village.tick(dt); Units.tick(dt); World.tick(dt); City.tick(dt); Explore.tick(dt); Venue.tick(dt);
    ui.saveT += dt; if (ui.saveT >= tune.autosave_seconds) { ui.saveT = 0; Save.persist(); }
  }
  /** What a land tool does on one tile. `quiet`: part of a stroke, no word when it cannot. */
  function useTool(tool, tx, ty, quiet) {
    if (tool === 'path') return Village.pave(tx, ty, quiet);
    if (tool === 'clear') return Village.clearTile(tx, ty);
    if (tool.startsWith('trap:')) return Raid.layTrap(tool.slice(5), tx, ty, quiet);
    return Village.plant(tool.slice(6), tx, ty, quiet); // 'plant:<flora id>'
  }
  const tileAt = (x, y) => { const p = World.toWorld(x, y); return { tx: Math.floor(p.x / T), ty: Math.floor(p.y / T) }; };
  /** Whether the building on the pointer (placed or moved) can be turned with R. */
  function turnable() { const mv = ui.moving && Village.byUid(ui.moving), k = ui.placing || (mv && mv.kind); return !!k && Village.canTurn(k); }
  const shift = () => down.has('ShiftLeft') || down.has('ShiftRight');
  // ---- Soldiers: chosen with a click or a box, sent with the right button ----
  const standing = () => Units.soldiers().filter(u => !(u.down > 0));
  function selectAll() { ui.selU = standing().map(u => u.id); if (!ui.selU.length) { toast(tr('no_soldiers'), C.bad); sfx('error'); } else sfx('click'); }
  /** Sends the selected soldiers to the map point under a screen point. False when there is nobody to send, or something else is in hand. */
  function orderAt(x, y) {
    if (!ui.selU.length || ui.placing || ui.moving || ui.tool || ui.wall || UI.hitAt(x, y)) return false;
    let p = World.toWorld(x, y);
    if (Camp.standing() && Camp.covers(p.x, p.y)) { p = Camp.gate(); toast(tr('camp_sent', { n: ui.selU.length }), C.accent); } // on the goblin camp: an assault, from its gate
    return Units.order(ui.selU, p.x, p.y);
  }
  /**
   * The tiles of the rampart being drawn, from where the button went down to the pointer, in the
   * order they are built. A line keeps to one axis of the map while the pointer strays little from
   * it, else it goes in steps that always touch side to side, so the wall stays closed. With Shift,
   * the outline of the rectangle between the two corners: an enclosure in one stroke.
   */
  function wallPlan() {
    if (!ui.wall) return [];
    const a = ui.wall, b = tileAt(mouse.x, mouse.y), out = [];
    const dx = b.tx - a.tx, dy = b.ty - a.ty, ax = Math.abs(dx), ay = Math.abs(dy), sx = Math.sign(dx), sy = Math.sign(dy);
    if (shift() && ax > 0 && ay > 0) { // round the rectangle from the first corner: along x, down y, back along x, up y
      for (let i = 0; i <= ax; i++) out.push({ tx: a.tx + i * sx, ty: a.ty });
      for (let i = 1; i <= ay; i++) out.push({ tx: b.tx, ty: a.ty + i * sy });
      for (let i = 1; i <= ax; i++) out.push({ tx: b.tx - i * sx, ty: b.ty });
      for (let i = 1; i < ay; i++) out.push({ tx: a.tx, ty: b.ty - i * sy });
      return out;
    }
    const major = Math.max(ax, ay), minor = Math.min(ax, ay);
    if (minor <= Math.max(1, major * tune.wall_snap)) { // straight along the axis it mostly follows
      for (let i = 0; i <= major; i++) out.push(ax >= ay ? { tx: a.tx + i * sx, ty: a.ty } : { tx: a.tx, ty: a.ty + i * sy });
      return out;
    }
    let x = a.tx, y = a.ty; out.push({ tx: x, ty: y }); // in steps: each one moves on x or on y, whichever keeps nearer the true line
    while (x !== b.tx || y !== b.ty) {
      const ex = Math.abs((x + sx - a.tx) * dy - (y - a.ty) * dx), ey = Math.abs((x - a.tx) * dy - (y + sy - a.ty) * dx);
      if (x !== b.tx && (y === b.ty || ex <= ey)) x += sx; else y += sy;
      out.push({ tx: x, ty: y });
    }
    return out;
  }
  /** Builds a drawn rampart, tile by tile in its order, until the stocks run out. */
  function buildWall(kind, plan) {
    let n = 0, broke = false;
    for (const t of plan) {
      if (!Village.canPlace(kind, t.tx, t.ty)) continue;
      if (!Village.canAfford(Village.cost(kind))) { broke = true; break; }
      if (Village.place(kind, t.tx, t.ty, false, true)) n++;
    }
    if (broke) toast(tr('no_funds'), UI.C.bad);
    else if (!n && plan.length) sfx('error');
    return n;
  }
  function worldClick(x, y) {
    const p = World.toWorld(x, y);
    if (ui.tool) {
      const t = tileAt(x, y), f = ui.tool === 'clear' && World.pickFlora(p.x, p.y); // the axe takes the tree under the pointer, not only the one on the tile
      if (!(f && Village.clearTile(f.tx, f.ty)) && !useTool(ui.tool, t.tx, t.ty)) sfx('error');
      return;
    }
    if (ui.placing) {
      const g = World.ghostTile(ui.placing, p.x, p.y, ui.rot), kind = ui.placing;
      if (Village.place(kind, g.tx, g.ty, false, false, ui.rot)) { if (!B[kind].wall && !B[kind].tower && !B[kind].decor) ui.placing = null; } // walls, towers and decorations go down in a row
      else sfx('error');
      return;
    }
    if (ui.moving) {
      const b = Village.byUid(ui.moving);
      if (b) { const g = World.ghostTile(b.kind, p.x, p.y, ui.rot); if (Village.move(b, g.tx, g.ty, ui.rot)) ui.moving = null; else sfx('error'); } else ui.moving = null;
      return;
    }
    if (Explore.click(p.x, p.y)) { sfx('click'); return; } // a place found in the wild: its panel
    const su = Units.pickAt(p.x, p.y); // a soldier under the pointer: he is chosen (with Shift, added to or taken from those already chosen)
    if (su) { ui.selU = shift() ? (ui.selU.includes(su.id) ? ui.selU.filter(id => id !== su.id) : ui.selU.concat(su.id)) : [su.id]; sfx('click'); return; }
    if (ui.selU.length) ui.selU = []; // a click anywhere else lets them go
    const b = World.pickBuilding(p.x, p.y);
    if (b) { ui.sel = b.uid; ui.panel = 'building'; sfx('click'); return; }
    const t = World.pickFlora(p.x, p.y);
    if (t) { Village.chop(t.tx, t.ty); return; }
    if (ui.panel === 'building') closePanel();
  }
  function playUpdate(dt) {
    const modal = ui.away || ui.banner, tut = Tuto.active(); // tut: the tutorial decides what a click, a key or a stroke may do
    for (const c of clicks) {
      if (c.button === 2) { if (modal || !orderAt(c.x, c.y)) cancel(); continue; } // the right button: an order to the chosen soldiers, else it backs out
      if (tut && !Tuto.click(c.x, c.y)) continue; // not what the guide is showing: the click is lost
      if (UI.click(c.x, c.y)) { if (scene !== 'play') return; continue; }
      if (!modal) worldClick(c.x, c.y);
    }
    if (modal) { if (pressed('Enter') || pressed('Space')) { ui.away = null; ui.banner = null; } effects(dt); return; }
    if (pressed('Escape') && !cancel()) { scene = 'pause'; return; }
    if (pressed('KeyP')) { scene = 'pause'; return; }
    const key = code => pressed(code) && (!tut || Tuto.keyOk(code)); // a panel's key: during the tutorial, only the one it asks for
    if (key('KeyH')) togglePanel('hero');
    if (key('KeyJ')) togglePanel('quests');
    if (key('KeyV')) togglePanel('menu');
    if (key('KeyK')) togglePanel('people');
    if (key('KeyG')) togglePanel('city');
    if (key('KeyE')) togglePanel('explore');
    if (key('KeyT')) selectAll();
    if (ui.selU.length) ui.selU = ui.selU.filter(id => { const u = Units.byId(id); return u && !(u.down > 0); });
    if (ui.tool && ui.tool.startsWith('trap:') && !Raid.trapsOpen()) ui.tool = null; // the raid is over: the traps go back in the cart
    // the selection box: Shift held, the button down on the map with nothing in hand, and a slide
    if (ui.box && !mouse.down) {
      const bx = ui.box, x0 = Math.min(bx.x, bx.x1), x1 = Math.max(bx.x, bx.x1), y0 = Math.min(bx.y, bx.y1), y1 = Math.max(bx.y, bx.y1);
      ui.selU = standing().filter(u => { const p = World.toScreen(u.x, u.y, 8); return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1; }).map(u => u.id);
      if (ui.selU.length) sfx('click');
      ui.box = null;
    } else if (ui.box) { ui.box.x1 = mouse.x; ui.box.y1 = mouse.y; }
    else if (mouse.down && mouse.drag && shift() && !ui.placing && !ui.moving && !ui.tool && !UI.hitAt(mouse.px, mouse.py)) ui.box = { x: mouse.px, y: mouse.py, x1: mouse.x, y1: mouse.y };
    // the zoom: the wheel under the pointer, the keys and the buttons at the middle of the view
    if (mouse.wheel && !UI.scroll(mouse.x, mouse.y, mouse.wheel) && !UI.hitAt(mouse.x, mouse.y)) World.zoomBy(mouse.wheel < 0 ? 1 : -1, mouse.x, mouse.y);
    if (pressed('Equal') || pressed('NumpadAdd')) World.zoomBy(1, W / 2, 316);
    if (pressed('Minus') || pressed('NumpadSubtract')) World.zoomBy(-1, W / 2, 316);
    if (pressed('KeyC') || pressed('Home')) goHome();
    if (pressed('KeyR') && turnable()) { ui.rot ^= 1; sfx('click'); }
    // a rampart, as in a strategy game: hold the button where it starts, slide to where it ends (a
    // line, or with Shift an enclosure), see it and its price, and let go to build it all
    const wallKind = ui.placing && B[ui.placing].wall ? ui.placing : null;
    if (!mouse.down) { if (ui.wall && wallKind) buildWall(wallKind, ui.wallShape || wallPlan()); ui.wall = null; ui.wallShape = null; ui.wallVoid = false; }
    else if (wallKind && mouse.drag && !ui.wall && !ui.wallVoid && !UI.hitAt(mouse.px, mouse.py)) ui.wall = tileAt(mouse.px, mouse.py);
    if (ui.wall && mouse.down) ui.wallShape = wallPlan(); // what is built on release is what was last shown, whatever Shift does as the button comes up
    // a path or a row of trees, drawn by holding the button and sliding: every tile the pointer crosses
    const drawing = ui.tool || wallKind;
    if (ui.tool === 'clear' && mouse.down && mouse.drag && !UI.hitAt(mouse.px, mouse.py)) {
      // the axe, held down: every tree the pointer sweeps over, picked by its drawn pixels as a click does (a tall tree is hit above its tile)
      const a = ui.stroke || { x: mouse.px, y: mouse.py, first: true }, b = { x: mouse.x, y: mouse.y };
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
      for (let i = a.first ? 0 : 1; i <= n; i++) {
        const sx = a.x + (b.x - a.x) * i / n, sy = a.y + (b.y - a.y) * i / n;
        if (UI.hitAt(sx, sy)) continue;
        const p = World.toWorld(sx, sy), t = World.pickFlora(p.x, p.y) || tileAt(sx, sy);
        if (!tut || Tuto.tileOk(t.tx, t.ty)) Village.clearTile(t.tx, t.ty);
      }
      ui.stroke = { x: b.x, y: b.y, first: false };
    } else if (ui.tool && mouse.down && mouse.drag && !UI.hitAt(mouse.px, mouse.py)) {
      const to = tileAt(mouse.x, mouse.y);
      if (!ui.stroke) ui.stroke = Object.assign(tileAt(mouse.px, mouse.py), { first: true });
      const s = ui.stroke, n = Math.max(Math.abs(to.tx - s.tx), Math.abs(to.ty - s.ty));
      for (let i = s.first ? 0 : 1; i <= n; i++) {
        const tx = n ? Math.round(s.tx + (to.tx - s.tx) * i / n) : to.tx, ty = n ? Math.round(s.ty + (to.ty - s.ty) * i / n) : to.ty;
        if (!tut || Tuto.tileOk(tx, ty)) useTool(ui.tool, tx, ty, true);
      }
      ui.stroke = { tx: to.tx, ty: to.ty, first: false };
    } else if (!mouse.down) ui.stroke = null;
    const cam = state.cam, sp = tune.cam_speed * dt * ART / World.zoom();
    if (down.has('ArrowLeft') || down.has('KeyA')) cam.x -= sp;
    if (down.has('ArrowRight') || down.has('KeyD')) cam.x += sp;
    if (down.has('ArrowUp') || down.has('KeyW')) cam.y -= sp;
    if (down.has('ArrowDown') || down.has('KeyS')) cam.y += sp;
    if ((mouse.ddx || mouse.ddy) && !drawing && !ui.box && !UI.hitAt(mouse.px, mouse.py)) { cam.x -= mouse.ddx / World.wpx(); cam.y -= mouse.ddy / World.wpx(); }
    World.clampCam();
    background(dt); effects(dt); Hero.tick(dt); Raid.tick(dt); Camp.tick(dt); Quests.tick(); Tuto.update(dt);
  }

  /** Brings the view back on the hall. */
  function goHome() { const h = Village.hallMid(); Object.assign(state.cam, World.camOn(h.x, h.y)); }

  // ---- Drawing the village screen ----
  function shadowText(s, x, y, size, c, align) { text(s, x + 2, y + 2, size, '#120e1c', align, true); text(s, x, y, size, c, align, true); }
  const capW = (s, size) => Math.max(size + 9, Math.ceil(UI.width(s, size - 2, true)) + 14);
  /** One key drawn as a keyboard cap, its middle on cy, for text of the given size; returns its width. */
  function keycap(s, x, cy, size) {
    const w = capW(s, size), h = size + 9, y = Math.round(cy - h / 2);
    x = Math.round(x);
    ctx.fillStyle = C.ink; ctx.fillRect(x, y, w, h); // the outline
    ctx.fillStyle = '#1e130b'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); // the cap's lower side
    ctx.fillStyle = C.bg2; ctx.fillRect(x + 1, y + 1, w - 2, h - 5); // its face
    ctx.fillStyle = C.lineL; ctx.fillRect(x + 2, y + 1, w - 4, 1); // the light on its top edge
    text(s, x + w / 2, y + (h - 3) / 2 + 1, size - 2, C.gold, 'center', true);
    return w;
  }
  /** A row of controls (DATA.strings.controls): key caps, then what they do, pair after pair.
   *  o: size (of the words, default 15), color, draw (false only measures). Returns its width. */
  function keyRow(row, x, cy, o = {}) {
    const size = o.size || 15, color = o.color || C.text, draw = o.draw !== false;
    let w = 0;
    row.forEach((part, i) => {
      if (Array.isArray(part)) { part.forEach((k, j) => { w += (draw ? keycap(k, x + w, cy, size) : capW(k, size)) + (j < part.length - 1 ? 4 : 0); }); return; }
      w += 8;
      if (draw) UI.label(part, x + w, cy, size, color, 'left');
      w += UI.width(part, size, true) + (i < row.length - 1 ? 20 : 0);
    });
    return w;
  }
  function prodText(d, b) {
    const lines = [];
    if (d.pop) { // a house: who lives there and what they pay
      const c = b ? Village.classOf(b) : DATA.classes[0];
      lines.push(tr('houses', { n: b ? Village.housed(b) : c.pop }) + ' · ' + c.name);
      lines.push(tr('tax', { n: fmtNum(d.produces.gold * (b ? Village.taxMult(b) * Village.outMult(b) : c.tax)), t: fmtNum(d.cycle) }));
      return lines;
    }
    if (d.produces) lines.push(tr('produces') + ' : ' + Object.keys(d.produces).map(r => `${fmtNum(d.produces[r] * (b ? Village.outMult(b) : 1))} ${lower(RES[r].name)}`).join(', ') + ' ' + tr('every', { n: fmtNum(d.cycle) }));
    if (d.consumes) lines.push(tr('consumes') + ' : ' + Object.keys(d.consumes).map(r => `${fmtNum(d.consumes[r] * (b ? Village.levelMult(b) : 1))} ${lower(RES[r].name)}`).join(', '));
    if (d.pop) lines.push(tr('houses', { n: d.pop + (b ? (b.lvl - 1) * 2 : 0) }));
    if (d.tower) lines.push(tr('tower_stats', { dmg: fmtNum(d.tower.dmg * (b ? 1 + (b.lvl - 1) * tune.tower_level_step : 1)), range: d.tower.range, rate: fmtNum(d.tower.rate) }));
    return lines;
  }
  /** How many lines UI.wrap would take. */
  function linesOf(str, maxW, size) {
    ctx.font = `${size}px ${FONT}`; let n = 0;
    for (const para of String(str).split('\n')) {
      let line = ''; n++;
      for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { n++; line = word; } else line = t; }
    }
    return n;
  }
  function drawWorldLabels() {
    for (const b of state.buildings) { // a building that waits shows why, on a red plate: no path to the hall, an input, a house's want
      if (b.damaged) continue;
      const ic = !Village.onRoad(b) ? 'icon.road' : b.starved ? RES[b.starved].icon : B[b.kind].pop && b.lack ? RES[b.lack].icon : B[b.kind].pop && Village.missingServices(b).length ? 'icon.service' : null;
      if (!ic) continue;
      const r = World.bRect(b), p = World.toScreenIso(r.cx, r.y), bob = Math.round(Math.sin(state.t * 4 + b.uid)) * 2;
      if (p.x < -40 || p.x > W + 40 || p.y < TOP - 40 || p.y > BOTTOM + 60) continue;
      UI.plate(p.x - 20, p.y - 46 + bob, 40, 40, 'bad'); UI.icon(ic, p.x, p.y - 26 + bob, 16);
    }
    const q = Quests.current();
    if (q && q.id === 'p1' && !Hero.away() && !Tuto.running()) { // the hero's first words (the tutorial's guide speaks instead)
      const hp = Raid.heroPost(), p = World.toScreen(hp.x, hp.y, 30);
      UI.box(p.x - 52, p.y - 34, 104, 30, '#fff7df', '#1b1420'); text(q.title, p.x, p.y - 18, 16, '#1b1420', 'center', true);
    }
    const from = state.raid.from; // where the raid comes out: a mark on the edge of the view when it is out of sight
    if (from && (state.raid.active || state.raid.warned)) {
      const p = World.toScreen(from.x, from.y, 12);
      if (p.x < 0 || p.x > W || p.y < TOP || p.y > BOTTOM) {
        const x = clamp(p.x, 30, W - 30), y = clamp(p.y, 160, 520), bob = Math.round(Math.sin(state.t * 6)) * 2;
        UI.region(x - 24, y - 24, 48, 48, () => Object.assign(state.cam, World.camOn(from.x, from.y)), tr('raid_where'));
        UI.plate(x - 24, y - 24 + bob, 48, 48, 'bad'); UI.icon('icon.raid', x, y + bob, 32);
      }
    }
    if (!ui.placing && !ui.moving && !ui.tool && !ui.box && !mouse.down && mouse.y > TOP && mouse.y < BOTTOM && !UI.hitAt(mouse.x, mouse.y)) {
      const wp = World.toWorld(mouse.x, mouse.y), hb = World.pickBuilding(wp.x, wp.y);
      if (hb && hb.uid !== ui.sel && !B[hb.kind].wall) { // what it is and how it is doing: a click opens its panel
        const d = B[hb.kind], st = statusOf(hb), name = d.name + (d.decor ? '' : ' · ' + tr('level', { n: hb.lvl })) + (d.pop ? ' · ' + Village.classOf(hb).name : '');
        const w = Math.max(UI.width(name, 14, true), st ? UI.width(st.text, 13, true) + 22 : 0) + 28, h = st ? 50 : 30;
        const x = clamp(mouse.x + 18, 4, W - w - 4), y = clamp(mouse.y - h - 8, TOP + 4, BOTTOM - h - 4);
        UI.plate(x, y, w, h); UI.label(name, x + 14, y + 16, 14, C.gold, 'left');
        if (st) { UI.icon(st.icon, x + 22, y + 35, 16); text(st.text, x + 34, y + 36, 13, st.color, 'left', true); }
      }
    }
    for (const f of ui.floats) {
      const p = World.toScreen(f.wx, f.wy, f.lift + f.t * 26);
      ctx.globalAlpha = clamp((1 - f.t) * 3, 0, 1); shadowText(f.msg, p.x, p.y, f.size, f.color, 'center'); ctx.globalAlpha = 1;
    }
  }
  function drawHud() {
    if (!UI.nine('topbar', 0, 0, W, TOP)) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, TOP); ctx.fillStyle = C.lineL; ctx.fillRect(0, TOP - 2, W, 2); }
    UI.region(0, 0, W, TOP, null);
    const rates = Village.rates(); let x = 12;
    // a plate per resource: its icon, the total, and the rate per second under it. The plates share
    // what the four buttons on the right leave, so nine resources still fit on one line.
    const shown = DATA.resourceOrder.filter(r => r === 'wood' || state.totals[r] > 0), BX = W - 12 - 6 * 50 + 4, POPW = 150;
    const stepX = clamp(Math.floor((BX - 12 - POPW - 8) / shown.length), 60, 104), pw = stepX - 4, small = stepX < 86; // many resources: smaller icons, the same plates
    for (const r of shown) {
      const rt = rates[r] || 0, ix = small ? 14 : 22, tx = small ? 26 : 40;
      UI.region(x, 6, pw, 40, null, RES[r].name + '\n' + (rt ? tr('res_rate_tip', { rate: fmtRate(rt) }) : tr('res_none_tip')));
      UI.plate(x, 6, pw, 40); UI.icon(RES[r].icon, x + ix, 26, small ? 16 : 32); Tuto.mark('res:' + r, x, 6, pw, 40);
      UI.label(fmt(ui.disp[r] == null ? state.res[r] : ui.disp[r]), x + tx, rt ? 19 : 26, small ? 14 : 16, C.text, 'left');
      if (rt) text(fmtRate(rt), x + tx, 35, small ? 11 : 12, rt > 0 ? C.good : C.bad, 'left', true);
      x += stepX;
    }
    const pop = Village.pop(), nx = Village.nextPopUnlock(), free = Units.free();
    UI.region(x, 6, POPW, 40, () => togglePanel('people'), tr('pop') + '\n' + tr('pop_tip') + '\n' + tr('pop_free_tip', { n: free })
      + (nx ? '\n' + tr('pop_next_tip', { n: nx.pop, name: nx.name }) : ''));
    UI.plate(x, 6, POPW, 40); UI.icon('icon.pop', x + 22, 26, 32);
    UI.label(String(pop), x + 40, 19, 16, C.text, 'left');
    text(tr('pop_free', { n: free }), x + 40, 35, 12, free > 0 ? C.good : C.dim, 'left', true);
    [['people', 'icon.pop', 'btn_people'], ['hero', 'icon.hero', 'btn_hero'], ['quests', 'icon.quest', 'btn_quests'], ['city', UI.ready('icon.city') ? 'icon.city' : 'icon.upgrade', 'btn_city'], ['explore', UI.ready('icon.explore') ? 'icon.explore' : 'icon.recenter', 'btn_explore'], ['menu', 'icon.village', 'btn_menu']].forEach(([p, ic, key], i) => {
      const s = tr(key), name = s.replace(/ \(.\)$/, ''), k = (s.match(/\((.)\)$/) || [])[1];
      UI.button(BX + i * 50, 6, 46, 40, '', () => togglePanel(p), { on: ui.panel === p, icon: ic, isz: 32, tip: name + (k ? '\n' + tr('key_tip', { k }) : '') });
      Tuto.mark('btn:' + p, BX + i * 50, 6, 46, 40);
    });

    // the quest to do now, with its one-line hint: a click opens the quest book
    const q = Quests.current(), qw = 430;
    const hint = q ? q.hint || q.text : tr('all_done'), n = Math.min(3, linesOf(hint, qw - 76, 13)), qh = (q ? 36 : 20) + n * 17;
    if (!Tuto.hidesQuest()) { // during the tutorial the guide's task box stands here instead
      UI.region(10, TOP + 8, qw, qh, () => togglePanel('quests'), tr('btn_quests'));
      UI.plate(10, TOP + 8, qw, qh); UI.icon('icon.quest', 38, TOP + 8 + qh / 2, 32); Tuto.mark('hud:quest', 10, TOP + 8, qw, qh);
      let y = TOP + 18;
      if (q) { UI.label(tr('quest') + ' · ' + q.title, 62, y + 4, 15, C.gold, 'left'); y += 13; }
      UI.wrap(hint, 62, y, qw - 76, 13, C.text, 17);
    }
    const my = TOP + 8 + qh + 6;
    if (state.mission) { // the hero away on a mission
      const m = DATA.missions.find(k => k.id === state.mission.id);
      UI.plate(10, my, qw, 40); UI.icon('icon.time', 30, my + 20, 16);
      UI.label(tr('mission_run', { title: m ? m.title : '' }), 44, my + 20, 13, C.accent, 'left');
      UI.bar(qw - 150, my + 12, 136, 16, 1 - state.mission.left / state.mission.total, C.accent);
      text(fmtTime(state.mission.left), qw - 82, my + 21, 11, C.text, 'center', true);
    }
    City.drawHud(10, my + (state.mission ? 46 : 0), qw); // the city's rank and the hero's popularity, under the quest
    // the raid: its countdown, then its count, on a plate in the middle that turns red when it is near
    const r = state.raid, rx = W / 2 - 160, ry = TOP + 8;
    if (r.active || r.timer != null || (r.camp && r.camp.down > 0)) Tuto.mark('hud:raid', rx, ry, 320, 52);
    if (r.active) {
      const pulse = 0.5 + 0.5 * Math.sin(state.t * 6);
      UI.plate(rx, ry, 320, 52, 'bad'); UI.icon('icon.raid', rx + 30, ry + 26, 32);
      ctx.globalAlpha = 0.75 + 0.25 * pulse;
      UI.wrap(tr(Raid.hudKey('raid_now'), Object.assign({ n: r.n + 1, left: r.active.raiders.length, leaks: r.active.leaks, max: tune.raid_leaks_to_lose }, Raid.hudVars())), rx + 54, ry + 10, 256, 14, C.text, 17, true);
      ctx.globalAlpha = 1;
    } else if (r.camp && r.camp.down > 0) { // the camp burnt down: no raid until the next one rises
      UI.plate(rx, ry, 320, 52, null); UI.icon('icon.raid', rx + 30, ry + 26, 32);
      UI.label(tr(r.timer != null ? 'camp_ruin_hud_short' : 'camp_ruin_hud'), rx + 54, ry + 18, 14, C.good, 'left'); // short beside the button
      UI.label(fmtTime(r.camp.down), rx + 54, ry + 36, 18, C.text, 'left');
      if (r.timer != null) UI.button(rx + 216, ry + 8, 94, 36, tr('camp_provoke'), Camp.provoke, { size: 14, tip: tr('camp_provoke_tip', { pct: Math.round(tune.raid_call_bonus * 100) }) }); // not before the raids have begun
    } else if (r.timer != null) {
      UI.plate(rx, ry, 320, 52, r.warned ? 'bad' : null); UI.icon('icon.raid', rx + 30, ry + 26, 32);
      UI.label(tr(Raid.hudKey('raid_in'), Object.assign({ n: r.n + 1, time: '' }, Raid.hudVars())).trim(), rx + 54, ry + 18, 14, r.warned ? C.bad : C.dim, 'left');
      UI.label(fmtTime(r.timer), rx + 54, ry + 36, 18, r.warned ? C.gold : C.text, 'left');
      UI.button(rx + 216, ry + 8, 94, 36, tr('raid_call'), Raid.callNow, { size: 14, primary: r.warned, tip: tr('raid_call_tip', { pct: Math.round(tune.raid_call_bonus * 100) }) });
    }
    if (Raid.hudExtra) Raid.hudExtra(rx, ry + 58, 320); // a siege: its warlord, and the button that challenges him
  }
  const TAB_ICONS = { city: 'icon.village', build: 'icon.build', defense: 'icon.defense', decor: 'icon.decor', land: 'icon.terrain' };
  function drawCards() { // the build bar: one card per building, the locked ones as "????" silhouettes
    if (!UI.nine('bottombar', 0, BOTTOM, W, H - BOTTOM)) { ctx.fillStyle = C.bg; ctx.fillRect(0, BOTTOM, W, H - BOTTOM); ctx.fillStyle = C.lineL; ctx.fillRect(0, BOTTOM, W, 2); }
    UI.region(0, BOTTOM, W, H - BOTTOM, null);
    const tabH = Math.min(26, Math.floor((H - BOTTOM - 16) / DATA.buildTabs.length));
    DATA.buildTabs.forEach((tab, i) => { UI.tab(16, BOTTOM + 8 + i * tabH, 100, tabH, tab.name, () => { ui.bar = tab.id; }, ui.bar === tab.id, { icon: TAB_ICONS[tab.id], size: 12 }); Tuto.mark('bar:' + tab.id, 16, BOTTOM + 8 + i * tabH, 100, tabH); });
    const items = (DATA.buildTabs.find(tab => tab.id === ui.bar) || DATA.buildTabs[0]).items;
    const stepX = Math.min(124, Math.floor(1136 / items.length));
    items.forEach((k, i) => {
      // a card is a building, a land tool or a tree to plant: each has a name, a picture, a price and what a click picks up
      const trap = k.startsWith('trap:') ? DATA.traps[k.slice(5)] : null, armed = !trap || Raid.trapsOpen(); // a trap is laid like a tool, once the horn has sounded
      const tool = k.startsWith('tool:') ? k.slice(5) : k.startsWith('plant:') || trap ? k : null, fl = k.startsWith('plant:') ? DATA.flora[k.slice(6)] : null;
      const d = trap ? { name: trap.name, card: trap.card, sprite: trap.sprite, cost: trap.cost, desc: trap.desc + '\n' + tr(armed ? 'trap_tip' : 'trap_wait') }
        : tool ? (fl ? { name: fl.name, card: fl.name, sprite: fl.sprite, desc: tr('plant_tip') } : DATA.tools[tool]) : B[k];
      const x = 128 + i * stepX, y = BOTTOM + 8, w = stepX - 4, h = H - BOTTOM - 16;
      Tuto.mark('card:' + k, x, y, w, h);
      const raids = state.raid.timer != null || !!state.raid.active || state.raid.n > 0; // the traps' cards open with the first raid
      const open = trap ? raids : tool ? true : Village.isUnlocked(k), done = !tool && !!d.unique && Village.count(k) > 0;
      const price = tool ? (fl ? Village.toolCost(fl.plant) : d.cost ? Village.toolCost(d.cost) : {}) : Village.cost(k);
      const can = open && !done && armed && Village.canAfford(price), on = tool ? ui.tool === tool : ui.placing === k;
      const tip = open ? [d.name, d.desc].concat(tool ? [] : prodText(d)).join('\n') : '????\n' + (trap ? tr('trap_locked') : tr('need') + ' : ' + Quests.describe(d.unlock).map(p => p.text).join(', '));
      const hov = UI.region(x, y, w, h, () => {
        if (!open || done) { sfx('error'); return; }
        if (!armed) { toast(tr('trap_wait'), C.accent); sfx('error'); return; }
        sfx('click'); ui.placing = tool || on ? null : k; ui.tool = tool && !on ? tool : null; ui.moving = null; closePanel();
      }, tip);
      const look = !open ? 'card_locked' : on ? 'card_on' : hov ? 'card_hover' : 'card';
      if (!UI.nine(look, x, y, w, h)) UI.box(x, y, w, h, on ? C.btnH : hov && open ? C.bg2 : C.bg, on ? C.gold : can ? C.lineL : C.line);
      const s = open ? Art.get(d.sprite) : Art.silhouette(d.sprite), lift = hov && open && !on ? 2 : 0;
      const fit = Math.min(1, (w - 24) / (s.width * PX), 58 / (s.height * PX)), sw = s.width * PX * fit, sh = s.height * PX * fit; // shrunk to fit the card
      if (open && !can && !done) ctx.globalAlpha = 0.55; // unlit until it can be paid
      blit(s, x + w / 2 - sw / 2, y + 10 + (58 - sh) / 2 - lift, fit);
      ctx.globalAlpha = 1;
      if (!open) {
        UI.icon('icon.lock', x + w / 2, y + 40, 32);
        UI.label('????', x + w / 2, y + 78, 15, C.dim);
        const need = trap ? { short: tr('need_raids_short') } : Quests.describe(d.unlock)[0];
        if (need) text(need.short, x + w / 2, y + 96, 12, C.dim, 'center', true);
        return;
      }
      UI.label(d.card, x + w / 2, y + 76, 13, on ? C.gold : C.text);
      if (trap && !armed) UI.icon('icon.time', x + w - 16, y + 16, 16); // waits for the horn
      if (done) { UI.icon('icon.check', x + w / 2 - 30, y + 96, 16); text(tr('built'), x + w / 2 + 8, y + 97, 13, C.good, 'center', true); }
      else {
        const keys = Object.keys(price), two = keys.length > 2;
        keys.forEach((r, j) => {
          const cx = x + (keys.length === 1 ? w / 2 - 20 : 8 + (j % 2) * Math.floor((w - 12) / 2)), cy = y + (two ? 92 + (j >> 1) * 16 : 96);
          UI.icon(RES[r].icon, cx + 8, cy, 16);
          text(fmt(price[r]), cx + 19, cy + 1, two ? 12 : 13, state.res[r] >= price[r] ? C.text : C.bad, 'left', true);
        });
      }
    });
  }

  // ---- Side panels ----
  function drawForge(b, x, y, w) {
    text(tr('forge_title'), x, y + 10, 16, C.gold, 'left', true); y += 26;
    if (b.craft) {
      text(tr('forging', { name: I[b.craft.item].name }), x, y + 8, 14, C.accent, 'left', true);
      UI.bar(x + 230, y, w - 230, 16, 1 - b.craft.left / b.craft.total, C.accent); y += 24;
    }
    for (const id in I) {
      const it = I[id], open = Quests.met(it.requires), own = Hero.has(id), plus = state.hero.plus[id] || 0;
      if (!open) { UI.icon('icon.lock', x + 8, y + 13, 16); text(`${it.name} · ${Quests.describe(it.requires).map(p => p.text).join(', ')}`, x + 26, y + 13, 14, C.dim, 'left'); y += 26; continue; }
      const st = [it.atk ? tr('stat_atk', { n: it.atk }) : '', it.def ? tr('stat_def', { n: it.def }) : '', it.hp ? tr('stat_hp', { n: it.hp }) : ''].filter(Boolean).join(' · ');
      text(it.name + (plus ? ' +' + plus : ''), x, y + 11, 15, C.text, 'left', true);
      text(st, x + w - 126, y + 11, 14, C.good, 'right');
      const price = Hero.craftCost(id);
      UI.cost(price, x, y + 32, { size: 14, gap: 8 });
      UI.button(x + w - 118, y + 4, 118, 36, own ? tr('forge_plus', { n: plus + 1 }) : tr('forge_do'), () => Hero.startCraft(b, id),
        { size: 14, primary: !own, disabled: !!b.craft || b.damaged || !Village.canAfford(price), tip: it.name + '\n' + it.desc + (own ? '\n' + tr('forge_plus_tip', { pct: Math.round(tune.plus_bonus * 100) }) : '') });
      Tuto.mark('forge:' + id, x + w - 118, y + 4, 118, 36);
      y += 46;
    }
    return y;
  }
  /**
   * What a building is doing, in a few words, with its colour: the first thing its panel and its
   * hover label say. Damage, then a missing road, then a missing input, then the house's wants.
   */
  function statusOf(b) {
    const d = B[b.kind];
    if (b.damaged) return { text: tr('st_damaged'), color: C.bad, icon: 'icon.warn' };
    if (!Village.onRoad(b)) return { text: tr('st_no_road'), color: C.bad, icon: 'icon.road' };
    if (d.pop) {
      if (b.lack) return { text: tr('st_lack', { res: lower(RES[b.lack].name) }), color: C.bad, icon: RES[b.lack].icon };
      const miss = Village.missingServices(b);
      if (miss.length) return { text: tr('st_lack_svc', { name: B[miss[0]].name }), color: C.bad, icon: 'icon.service' };
      return Village.canRaise(b) ? { text: tr('st_can_raise', { name: Village.nextClass(b).name }), color: C.gold, icon: 'icon.upgrade' } : { text: tr('st_happy'), color: C.good, icon: 'icon.check' };
    }
    if (b.paused) return { text: tr('st_paused'), color: C.dim, icon: 'icon.time' };
    if (b.starved) return { text: tr('st_starved', { res: lower(RES[b.starved].name) }), color: C.bad, icon: RES[b.starved].icon };
    if (b.craft) return { text: tr('forging', { name: I[b.craft.item].name }), color: C.accent, icon: 'icon.gear' };
    if (b.train) return { text: tr('training', { name: U[b.train.kind].name }), color: C.accent, icon: 'icon.army' };
    if (d.service) { const n = state.buildings.filter(h => B[h.kind].pop && Village.servicesOf(h).has(b.kind)).length; return { text: tr('st_serves', { n }), color: C.good, icon: 'icon.service' }; }
    if (d.produces || d.craft || d.train || d.tower) return { text: tr('st_working'), color: C.good, icon: 'icon.check' };
    return null;
  }
  /** A line of a recipe: what goes in, an arrow, what comes out, each with its icon, and the time. */
  function recipe(d, b, x, y) {
    const lm = b ? Village.levelMult(b) : 1, om = b ? Village.outMult(b) : 1;
    let cx = x;
    const item = (r, n) => { UI.icon(RES[r].icon, cx + 8, y, 16); text(fmtNum(n), cx + 19, y + 1, 14, C.text, 'left', true); cx += 26 + UI.width(fmtNum(n), 14, true); };
    if (d.consumes) { for (const r in d.consumes) item(r, d.consumes[r] * lm); text('→', cx, y + 1, 15, C.gold, 'left', true); cx += 22; }
    for (const r in d.produces) item(r, d.produces[r] * om);
    text(tr('every', { n: fmtNum(d.cycle) }), cx + 2, y + 1, 13, C.dim, 'left');
  }
  /** A section title with a brass rule after it. Returns the y under it. */
  function section(title, x, y, w) {
    const tw = UI.width(title, 15, true);
    text(title, x, y + 10, 15, C.gold, 'left', true);
    ctx.fillStyle = 'rgba(143,95,28,0.6)'; ctx.fillRect(x + tw + 10, y + 10, Math.max(0, w - tw - 10), 1);
    return y + 24;
  }
  /** A line that holds or not: a tick or a padlock, then the words. Returns the y under it. */
  function check(ok, str, x, y, w) { UI.icon(ok ? 'icon.check' : 'icon.lock', x + 8, y + 9, 16); return UI.wrap(str, x + 22, y, w - 22, 14, ok ? C.good : C.bad); }
  /** The tabs a building's panel has, by what it is. One tab: no tab bar. */
  function tabsOf(d, b) {
    if (b.kind === 'hall') return [['village', 'tb_village'], ['taxes', 'tb_taxes'], ['look', 'tb_look']];
    if (d.monument) return [['works', 'tb_works'], ['info', 'tb_info']];
    if (d.pop) return [['people', 'tb_people'], ['street', 'tb_street'], ['look', 'tb_look']];
    if (d.craft) return [['forge', 'tb_forge'], ['info', 'tb_info']];
    if (d.trade) return [['trade', 'tb_trade'], ['info', 'tb_info']];
    if (d.train) return [['army', 'tb_army'], ['info', 'tb_info']];
    return [['info', 'tb_info']];
  }
  /** The keeper's word for now: a raid, work under way, or a want first, else his lines in turn. */
  function keeperLine(kp, b) {
    return state.raid.active && kp.raid ? kp.raid : b && (b.craft || b.train) && kp.busy ? kp.busy : b && (b.starved || b.damaged) && kp.sad ? kp.sad
      : kp.lines[Math.floor(state.t / 9 + (b ? b.uid : 0)) % kp.lines.length];
  }
  /**
   * The panel of the chosen building: a header that says what it is and how it is doing, tabs
   * for what it does, a body that scrolls, and its actions always at the bottom.
   */
  function drawBuilding() {
    const b = Village.byUid(ui.sel);
    if (!b) { closePanel(); return; }
    const d = B[b.kind], x = P.x + 24, w = P.w - 48, tabs = tabsOf(d, b);
    if (ui.selShown !== b.uid) { ui.selShown = b.uid; ui.btab = tabs[0][0]; UI.scrollTop('bld'); }
    if (!tabs.some(t => t[0] === ui.btab)) ui.btab = tabs[0][0];
    UI.panel(P.x, P.y, P.w, P.h, d.name + (d.decor ? '' : ' · ' + tr('level', { n: b.lvl })), closePanel);
    // ---- the header: the keeper, or the building itself; then its state and its one line of work
    const hy = P.y + 56, kp = d.keeper && DATA.keepers[d.keeper];
    UI.plate(x, hy, 76, 76);
    const sid = kp ? 'portrait.' + d.keeper : d.sprite, sh = kp && Art.sheet(sid);
    const s = kp && sh ? Art.get(sid, Math.floor(state.t * tune.portrait_fps) % sh.cols) : Art.get(d.sprite, World.frameOf(b));
    const k = Math.min(68 / (s.width * PX), 68 / (s.height * PX));
    blit(s, x + 38 - s.width * PX * k / 2, hy + 72 - s.height * PX * k, k);
    const tx = x + 88, tw = w - 88, st = statusOf(b);
    let y = hy + 2;
    if (kp) { text(kp.name + ' · ' + kp.title, tx, y + 8, 13, C.dim, 'left', true); y += 18; }
    if (st) { UI.icon(st.icon, tx + 8, y + 9, 16); y = UI.wrap(st.text, tx + 22, y, tw - 22, 14, st.color, 17, true); }
    if (d.produces && !d.pop && !d.trade) { recipe(d, b, tx, y + 10); y += 22; }
    else if (d.pop) { text(tr('house_head', { n: Village.housed(b), gold: fmtNum(d.produces.gold * Village.taxMult(b) * Village.outMult(b)), t: fmtNum(d.cycle) }), tx, y + 9, 13, C.text, 'left'); y += 20; }
    if (kp && y < hy + 62) UI.wrap(tr('quote', { s: keeperLine(kp, b) }), tx, y, tw, 12, C.dim, 15); // the keeper's word, as far as it fits
    // ---- the tabs
    let top = hy + 86;
    if (Venue.has(b)) { // a place that can be entered: its keeper waits inside, with a game to play
      UI.button(x, top, w, 34, tr('venue_enter', { name: kp ? kp.name : d.name }), () => Venue.open(b), { primary: true, size: 14, tip: tr('venue_enter_tip') });
      Tuto.mark('venue:enter', x, top, w, 34); top += 42;
    }
    if (tabs.length > 1) {
      const tw2 = Math.floor((w - (tabs.length - 1) * 4) / tabs.length);
      tabs.forEach(([id, key], i) => { UI.tab(x + i * (tw2 + 4), top, tw2, 30, tr(key), () => { ui.btab = id; UI.scrollTop('bld'); }, ui.btab === id, { size: 13 }); Tuto.mark('btab:' + id, x + i * (tw2 + 4), top, tw2, 30); });
      top += 38;
    }
    // ---- the body, which scrolls; the actions stay below it
    const by = P.y + P.h - 58;
    // a wall in a rampart: one more row, « Tout le rempart » (one level up); and below it, when pieces are broken or it can come down, one for « Tout réparer » and « Tout démolir »
    const wall = d.wall && !b.damaged ? Village.rampart(b) : null, whole = d.wall ? Village.rampartAll(b) : [b];
    const up = wall && wall.length > 1, broken = whole.filter(o => o.damaged), canRepair = broken.length > (b.damaged ? 1 : 0), canRazeAll = whole.length > 1;
    const row = (up ? 48 : 0) + (canRepair || canRazeAll ? 48 : 0);
    UI.scrollBox('bld', x, top, w, by - 34 - row - top, y0 => {
      const t = ui.btab;
      if (t === 'info') return infoTab(b, d, x, y0, w);
      if (t === 'people') return houseTab(b, x, y0, w);
      if (t === 'street') return streetTab(b, x, y0, w);
      if (t === 'look') return lookTab(b, d, x, y0, w);
      if (t === 'village') return hallTab(b, x, y0, w);
      if (t === 'forge') return drawForge(b, x, y0, w);
      if (t === 'trade') return drawTrade(b, x, y0, w);
      if (t === 'army') return drawBarracks(b, x, y0, w);
      if (t === 'works') return City.worksTab(b, x, y0, w);
      if (t === 'taxes') return City.taxTab(b, x, y0, w);
      return y0;
    });
    const ly = by - 18;
    ctx.fillStyle = C.lineL; ctx.fillRect(x, ly - 14, w, 1);
    const list = c => Object.keys(c).map(r => c[r] + ' ' + lower(RES[r].name)).join(', ');
    let ry = by - 74;
    if (canRepair || canRazeAll) { // the whole rampart at once: its broken pieces mended, or all of it pulled down (a second click confirms)
      ctx.fillStyle = C.lineL; ctx.fillRect(x, ry - 6, w, 1);
      const both = canRepair && canRazeAll, bw = both ? 174 : 196, bx = x + (both ? bw + 8 : 0);
      if (canRepair) {
        const c = Village.rampartRepairCost(whole);
        UI.button(x, ry, bw, 36, tr('rampart_repair_all', { n: broken.length }), () => Village.repairRampart(b), { disabled: !Village.canAfford(c), size: 14, icon: 'icon.build', tip: tr('rampart_repair_tip', { n: broken.length }) + '\n' + list(c) });
      }
      if (canRazeAll) {
        const armed = ui.rampArm && ui.rampArm.uid === b.uid && ui.rampArm.until > state.t;
        UI.button(canRepair ? bx : x, ry, bw, 36, tr(armed ? 'rampart_demolish_sure' : 'rampart_demolish_all', { n: whole.length }), () => {
          if (armed) { Village.demolishRampart(b); ui.rampArm = null; closePanel(); } else ui.rampArm = { uid: b.uid, until: state.t + 4 };
        }, { size: 14, icon: 'icon.demolish', tip: tr('rampart_demolish_tip', { n: whole.length }) + `\n${lower(tr('refund'))} ${list(Village.rampartRefund(whole))}` });
      }
      ry -= 48;
    }
    if (up) { // every palisade of this rampart at its level, one level up, in one click
      const c = Village.rampartCost(wall);
      ctx.fillStyle = C.lineL; ctx.fillRect(x, ry - 6, w, 1);
      UI.button(x, ry, 196, 36, tr('rampart_all', { n: wall.length }), () => Village.upgradeRampart(b), { disabled: !Village.canAfford(c), size: 14, icon: 'icon.upgrade', tip: tr('rampart_tip', { n: wall.length, lvl: b.lvl, next: b.lvl + 1 }) });
      Tuto.mark('act:rampart', x, ry, 196, 36);
      UI.cost(c, x + 206, ry + 18, { size: 14 });
    }
    if (b.damaged) {
      const c = Village.repairCost(b);
      text(tr('repair') + ' :', x, ly, 14, C.dim, 'left'); UI.cost(c, x + 84, ly, { size: 14 });
      UI.button(x, by, 136, 40, tr('repair'), () => Village.repair(b), { primary: true, disabled: !Village.canAfford(c), size: 15, icon: 'icon.build' });
    } else if (!d.decor) {
      const c = Village.upgradeCost(b), lab = tr('upgrade_to', { n: b.lvl + 1 }) + ' :';
      text(lab, x, ly, 14, C.dim, 'left'); UI.cost(c, x + 10 + UI.width(lab, 14), ly, { size: 14 });
      UI.button(x, by, 136, 40, tr('upgrade'), () => Village.upgrade(b), { primary: true, disabled: !Village.canAfford(c), size: 15, icon: 'icon.upgrade', tip: tr('upgrade') + '\n' + upgradeTip(b, d) });
      Tuto.mark('act:upgrade', x, by, 136, 40);
    } else text(tr('decor_beauty', { n: fmtNum(d.beauty || 0), r: tune.beauty_radius }), x, ly, 14, C.good, 'left', true);
    if (d.fixed) return; // the hall: upgraded, never moved or demolished
    const ax = d.decor ? x : x + 140;
    UI.button(ax, by, 108, 40, tr('move'), () => { ui.moving = b.uid; ui.rot = b.rot || 0; ui.placing = null; ui.panel = null; }, { size: 14, icon: 'icon.move' });
    Tuto.mark('act:move', ax, by, 108, 40); Tuto.mark('act:demolish', ax + 112, by, 104, 40);
    const rf = Village.refund(b);
    UI.button(ax + 112, by, 104, 40, tr('demolish'), () => { Village.demolish(b); closePanel(); }, { size: 14, icon: 'icon.demolish', tip: `${tr('demolish')}\n${lower(tr('refund'))} ${Object.keys(rf).map(r => rf[r] + ' ' + lower(RES[r].name)).join(', ')}` });
  }
  /** What the next level brings, in one or two lines (the upgrade button's tip, and the Infos tab). */
  function upgradeTip(b, d) {
    const ms = tune.milestone_levels, n = b.lvl + 1, out = [];
    if (d.pop) out.push(tr('up_house'));
    else if (d.produces) out.push(tr('up_prod', { pct: Math.round(tune.upgrade_output_step * 100) }));
    if (d.tower) out.push(tr('up_tower', { pct: Math.round(tune.tower_level_step * 100) }));
    if (d.wall) out.push(tr('up_wall'));
    if (d.train) out.push(tr('up_army', { pct: Math.round(tune.soldier_level_step * 100) }));
    if (d.service) out.push(tr('up_service', { n: fmtNum(tune.service_radius_step) }));
    if (b.kind === 'hall') out.push(tr('up_hall'));
    if (d.produces && n % ms === 0) out.push(tr('up_double'));
    if (!d.looks && !d.decor && World.tier(n) > World.tier(b.lvl)) out.push(tr('up_look'));
    return out.join('\n');
  }
  /** The Infos tab: what it is for, its work, its level and what it does to the houses around. */
  function infoTab(b, d, x, y, w) {
    y = UI.wrap(d.desc, x, y, w, 14, C.dim) + 6;
    if (d.decor) y = UI.wrap(tr('decor_note'), x, y, w, 14, C.text) + 6;
    if (d.produces && !d.pop) {
      y = section(tr('sec_work'), x, y, w);
      recipe(d, b, x, y + 9); y += 22;
      UI.bar(x, y, w, 12, b.paused ? 0 : clamp(b.prog, 0, 1), C.accent); y += 20;
    }
    if (d.tower) { y = section(tr('sec_defense'), x, y, w); y = UI.wrap(prodText(d, b).join('\n'), x, y, w, 14, C.text) + 4; }
    if (d.wall) { y = section(tr('sec_defense'), x, y, w); text(tr('wall_hp', { hp: Math.ceil(b.hp), max: Village.wallMax(b) }), x, y + 9, 14, C.text, 'left'); y += 24; }
    if (!d.decor) {
      y = section(tr('sec_level'), x, y, w);
      const ms = tune.milestone_levels, next = (Math.floor(b.lvl / ms) + 1) * ms;
      if (d.produces) { text(tr('milestone', { n: next }), x, y + 9, 14, C.text, 'left'); y += 20; UI.bar(x, y, w, 10, (b.lvl % ms) / ms, C.gold); y += 18; }
      if (World.tier(b.lvl) < 3 && !d.looks) y = UI.wrap(tr('next_look', { n: (World.tier(b.lvl) + 1) * ms }), x, y, w, 14, C.dim) + 2;
      y = UI.wrap(tr('next_level') + ' : ' + upgradeTip(b, d).split('\n').join(' · '), x, y, w, 14, C.text) + 4;
    }
    if (d.service || d.beauty) {
      y = section(tr('sec_town'), x, y + 4, w);
      if (d.service) {
        const n = state.buildings.filter(h => B[h.kind].pop && Village.servicesOf(h).has(b.kind)).length;
        y = UI.wrap(tr('serves', { r: fmtNum(Village.serviceRadius(b)), n }), x, y, w, 14, C.text) + 2;
        const who = DATA.classes.filter(c => c.services.includes(b.kind)).map(c => c.name);
        if (who.length) y = UI.wrap(tr('wanted_by', { who: who.join(', ') }), x, y, w, 14, C.dim) + 2;
      }
      if (d.beauty) y = UI.wrap(tr(d.beauty > 0 ? 'beauty_plus' : 'beauty_minus', { n: fmtNum(Math.abs(d.beauty)), r: tune.beauty_radius }), x, y, w, 14, d.beauty > 0 ? C.good : C.bad) + 2;
    }
    if (Village.needsRoad(b.kind)) { y = section(tr('sec_road'), x, y + 4, w); y = check(Village.onRoad(b), tr(Village.onRoad(b) ? 'road_ok' : 'road_missing'), x, y, w) + 2; }
    if (b.damaged) y = UI.wrap(tr('damaged'), x, y + 4, w, 14, C.bad, 0, true) + 4;
    return y;
  }
  /** A house's Habitants tab: its class, what it eats, how happy it is, and the way up. */
  function houseTab(b, x, y, w) {
    const c = Village.classOf(b), nx = Village.nextClass(b), sat = Village.satOf(b);
    y = section(c.name, x, y, w);
    y = UI.wrap(c.desc, x, y, w, 13, C.dim) + 4;
    text(tr('needs') + ' :', x, y + 11, 14, C.dim, 'left'); let nxp = x + 70;
    for (const r in c.needs) { UI.icon(RES[r].icon, nxp + 8, y + 11, 16); text('×' + c.needs[r], nxp + 18, y + 12, 14, b.lack === r ? C.bad : C.text, 'left', true); nxp += 46; }
    text(tr('every', { n: fmtNum(tune.need_cycle) }), x, y + 30, 12, C.dim, 'left'); y += 42;
    for (const k of c.services) y = check(Village.servicesOf(b).has(k), tr('in_reach', { name: B[k].name }), x, y, w);
    text(tr('satisfaction'), x, y + 10, 14, C.dim, 'left'); UI.bar(x + 100, y + 2, w - 100, 16, sat, sat >= 0.99 ? C.gold : b.lack || b.lackSvc ? C.bad : C.good); y += 26;
    if (!nx) return UI.wrap(tr('class_top'), x, y + 4, w, 14, C.gold) + 4;
    y = section(tr('raise_title', { name: nx.name }), x, y + 4, w);
    for (const p of Village.raiseSteps(b)) y = check(p.ok, p.text, x, y, w);
    const rc = Village.raiseCost(b), can = Village.canRaise(b);
    UI.cost(rc, x, y + 12, { size: 13, gap: 6 }); y += 24;
    UI.button(x, y, w, 36, tr('raise_to', { name: nx.name }), () => Village.raise(b), { primary: can, disabled: !can || !Village.canAfford(rc), size: 14,
      tip: nx.name + '\n' + nx.desc + '\n' + tr('raise_tip', { pop: nx.pop }) });
    Tuto.mark('raise', x, y, w, 36);
    return y + 44;
  }
  /** A house's Rue tab: the beauty around it, its services, its road, and what makes its tax. */
  function streetTab(b, x, y, w) {
    const bt = Village.beauty(b), c = Village.classOf(b);
    y = section(tr('beauty_title', { n: fmtNum(bt.total) }), x, y, w);
    y = UI.wrap(tr('beauty_help', { r: tune.beauty_radius }), x, y, w, 13, C.dim) + 4;
    if (!bt.parts.length) y = UI.wrap(tr('beauty_none'), x, y, w, 14, C.dim) + 2;
    for (const p of bt.parts) { text(p.name, x + 8, y + 9, 14, C.text, 'left'); text((p.n > 0 ? '+' : '') + fmtNum(p.n), x + w, y + 9, 14, p.n >= 0 ? C.good : C.bad, 'right', true); y += 20; }
    y = section(tr('services'), x, y + 6, w);
    for (const k of ['cafe', 'chapel', 'market']) {
      const has = Village.servicesOf(b).has(k), want = DATA.classes.find(cl => cl.services.includes(k));
      y = check(has, B[k].name + (has ? '' : ' · ' + tr('wanted_from', { name: want ? want.name : '' })), x, y, w);
    }
    y = section(tr('sec_road'), x, y + 6, w);
    y = check(Village.onRoad(b), tr(Village.onRoad(b) ? 'road_ok' : 'road_missing'), x, y, w);
    y = section(tr('tax_title'), x, y + 6, w);
    const rows = [[tr('tax_class', { name: c.name }), c.tax], [tr('tax_sat'), tune.unhappy_tax + (1 - tune.unhappy_tax) * Village.satOf(b)], [tr('tax_beauty'), Village.beautyMult(b)], [tr('tax_level'), Village.outMult(b)]];
    for (const [k, v] of rows) { text(k, x + 8, y + 9, 14, C.text, 'left'); text('×' + fmtNum(v), x + w, y + 9, 14, C.gold, 'right', true); y += 20; }
    return y;
  }
  /** The Apparence tab: the style (free, any time), and for a house the looks it grows into. */
  function lookTab(b, d, x, y, w) {
    if (d.styles) {
      y = section(tr('style'), x, y, w);
      const bw = Math.floor((w - 16) / d.styles.length);
      d.styles.forEach((name, i) => UI.button(x + i * (bw + 8), y, bw, 34, name, () => Village.setStyle(b, i), { on: (b.style || 0) === i, size: 14 }));
      Tuto.mark('style', x, y, w, 34);
      y += 44;
    }
    if (d.looks === 'class') { // the house and the four it grows into, its own lit, the ones to come dimmed
      y = section(tr('looks_title'), x, y, w);
      y = UI.wrap(tr('looks_help'), x, y, w, 13, C.dim) + 6;
      const n = DATA.classes.length, cw = Math.floor(w / n);
      DATA.classes.forEach((c, i) => {
        const s = Art.get(d.sprite, (b.style || 0) * n + i), k = Math.min((cw - 6) / (s.width * PX), 84 / (s.height * PX)), cx = x + i * cw + cw / 2, mine = (b.cls || 0) === i;
        if (mine) UI.plate(x + i * cw + 1, y, cw - 2, 112);
        if ((b.cls || 0) < i) ctx.globalAlpha = 0.45;
        blit(s, cx - s.width * PX * k / 2, y + 90 - s.height * PX * k, k);
        ctx.globalAlpha = 1;
        text(c.name, cx, y + 102, 11, mine ? C.gold : C.dim, 'center', true);
      });
      y += 120;
    }
    if (b.kind === 'hall') {
      const ms = tune.milestone_levels, tier = World.tier(b.lvl);
      if (tier < 3) y = UI.wrap(tr('next_look', { n: (tier + 1) * ms }), x, y, w, 14, C.dim) + 4;
    }
    return y;
  }
  /** The hall's Village tab: the town in numbers, the safe zone and the camp. */
  function hallTab(b, x, y, w) {
    y = UI.wrap(B.hall.desc, x, y, w, 14, C.dim) + 6;
    y = section(tr('sec_town'), x, y, w);
    y = UI.wrap(`${tr('pop')} : ${Village.pop()}`, x, y, w, 14, C.text);
    DATA.classes.forEach((c, i) => { const n = Village.classCount(i) - Village.classCount(i + 1); if (n) y = UI.wrap(`${c.name} : ${tr(n > 1 ? 'houses_n' : 'house_n', { n })}`, x + 8, y, w - 8, 13, C.dim); });
    const cut = state.buildings.filter(o => Village.needsRoad(o.kind) && !Village.onRoad(o)).length;
    if (cut) y = check(false, tr('hall_cut', { n: cut }), x, y + 2, w);
    if (state.prestige.renown) y = UI.wrap(tr('prestige_have', { n: state.prestige.renown, pct: Math.round(state.prestige.renown * tune.renown_bonus * 100) }), x, y, w, 14, C.gold);
    y = section(tr('sec_defense'), x, y + 6, w);
    y = UI.wrap(tr('hall_pillage'), x, y, w, 13, C.dim);
    y = UI.wrap(tr('hall_guard', { pct: fmtNum(Village.pillagePct() * 100) }), x, y + 2, w, 14, C.text);
    y = UI.wrap(tr('safe_zone', { n: fmtNum(Village.safeRadius()), step: fmtNum(tune.safe_radius_step) }), x, y + 2, w, 14, C.text);
    Camp.ensure();
    const c = Village.campMid(), h = Village.hallMid(), cp = state.raid.camp;
    if (!Camp.standing()) { // burnt down: the time until the next one
      y = UI.wrap(tr('camp_down', { time: fmtTime(cp.down) }), x, y + 2, w, 14, C.good) + 4;
      UI.button(x, y, w, 32, tr('camp_ruin_show'), () => { Object.assign(state.cam, World.camOn(c.x, c.y)); }, { size: 13, icon: 'icon.raid' });
      return y + 40;
    }
    y = UI.wrap(tr('camp_info', { n: Math.round(Math.hypot(c.x - h.x, c.y - h.y) / T), dir: Raid.compass(c) }), x, y + 2, w, 14, C.text);
    y = UI.wrap(tr('camp_force', { n: cp.guards.length, all: Camp.roster(cp.lvl).length, hp: fmtNum(Math.max(0, cp.hp)), max: fmtNum(cp.max), fell: state.counters.campsDown || 0 }), x, y + 2, w, 14, C.dim);
    { const chief = Camp.chiefLine && Camp.chiefLine(); if (chief) { const top = y + 2; y = UI.wrap(chief, x, top, w, 14, C.accent); Tuto.mark('camp:chief', x, top, w, y - top); } } // THREAT hook: the chief of a camp risen after one fell (js/camp.js)
    y = UI.wrap(tr('camp_how'), x, y + 2, w, 13, C.dim) + 4;
    const none = !Units.soldiers().some(u => !(u.down > 0));
    UI.button(x, y, w, 34, tr('camp_attack'), () => { if (Camp.attack()) { ui.selU = standing().map(u => u.id); Object.assign(state.cam, World.camOn(c.x, c.y)); } }, { primary: true, size: 14, icon: 'icon.raid', disabled: none, tip: none ? tr('camp_no_soldiers') : null });
    Tuto.mark('camp:attack', x, y, w, 34);
    y += 42;
    UI.button(x, y, w, 32, tr('camp_show'), () => { Object.assign(state.cam, World.camOn(c.x, c.y)); }, { size: 13, icon: 'icon.raid' });
    return y + 40;
  }
  /** A shopkeeper beside the panel: the portrait, alive, and a word for the player. `b`: the building he or she keeps, when there is one. */
  function drawKeeper(id, b) {
    const kp = DATA.keepers[id], sid = 'portrait.' + id, sh = Art.sheet(sid), px = P.x - 152, py = P.y + 62;
    const line = keeperLine(kp, b);
    UI.plate(px, py, 148, 176);
    if (sh) { // the strip's frames, one after the other; a bigger portrait is shrunk to the frame
      const s = Art.get(sid, Math.floor(state.t * tune.portrait_fps) % sh.cols), k = Math.min(1, 128 / (s.height * PX));
      blit(s, px + 74 - s.width * PX * k / 2, py + 140 - s.height * PX * k, k);
    }
    UI.label(kp.name, px + 74, py + 150, 14, C.gold); text(kp.title, px + 74, py + 165, 11, C.dim, 'center');
    const bw = 304, said = tr('quote', { s: line }), bh = linesOf(said, bw - 28, 13) * 17 + 18; // what he or she says, under the portrait
    UI.plate(P.x - 4 - bw, py + 180, bw, bh); UI.wrap(said, P.x - 4 - bw + 14, py + 189, bw - 28, 13, C.text, 17);
  }
  /** The market: its spice imports, and gold against goods. */
  function drawTrade(b, x, y, w) {
    if (b.starved && !b.paused) y = UI.wrap(tr('starved', { res: lower(RES[b.starved].name) }), x, y, w, 14, C.bad, 0, true);
    UI.bar(x, y + 6, w - 150, 12, b.paused ? 0 : clamp(b.prog, 0, 1), C.accent);
    UI.button(x + w - 142, y, 142, 26, tr(b.paused ? 'import_off' : 'import_on'), () => { b.paused = !b.paused; }, { size: 12, on: !b.paused, tip: tr('import_tip') }); Tuto.mark('import', x + w - 142, y, 142, 26); y += 34;
    UI.icon('icon.trade', x + 8, y + 9, 16); text(tr('trade_title', { n: tune.trade_lot }), x + 22, y + 9, 15, C.gold, 'left', true); y += 22;
    for (const r in DATA.trade) {
      const bp = Village.buyPrice(r), sp = Village.sellPrice(r);
      UI.icon(RES[r].icon, x + 8, y + 13, 16); text(RES[r].name, x + 22, y + 14, 14, C.text, 'left', true);
      text(fmt(state.res[r]), x + 128, y + 14, 13, C.dim, 'right');
      UI.button(x + 134, y, 108, 26, tr('buy', { p: bp }), () => Village.buy(r), { size: 12, disabled: b.damaged || state.res.gold < bp, tip: tr('buy_tip', { n: tune.trade_lot, res: lower(RES[r].name), p: bp }) });
      UI.button(x + 248, y, 108, 26, tr('sell', { p: sp }), () => Village.sell(r), { size: 12, disabled: b.damaged || state.res[r] < tune.trade_lot, tip: tr('sell_tip', { n: tune.trade_lot, res: lower(RES[r].name), p: sp }) });
      if (r === Object.keys(DATA.trade)[0]) Tuto.mark('trade', x, y, w, 26);
      y += 28;
    }
    return y;
  }
  /** One kind of unit on a line: how many, its price, the button that trains one and the one that sends one home. */
  function unitRow(k, x, y, w, stats) {
    const d = U[k], miss = Quests.describe(d.unlock).filter(p => !p.ok);
    if (miss.length) { UI.icon('icon.lock', x + 8, y + 13, 16); text(`${d.name} · ${miss.map(p => p.text).join(', ')}`, x + 26, y + 13, 13, C.dim, 'left'); return y + 26; }
    text(`${d.plural} : ${Units.count(k)}`, x, y + 11, 15, C.text, 'left', true);
    if (stats) text(stats, x + w - 126, y + 11, 13, C.good, 'right');
    UI.cost(Units.cost(k), x, y + 31, { size: 13, gap: 6 });
    const why = Units.blocked(k);
    UI.button(x + w - 118, y + 3, 84, 36, tr('train'), () => Units.train(k), { size: 14, primary: !why, disabled: !!why, tip: d.name + '\n' + d.desc + (why ? '\n' + why : '') });
    Tuto.mark('train:' + k, x + w - 118, y + 3, 84, 36);
    UI.button(x + w - 30, y + 3, 30, 36, '−', () => Units.dismiss(k), { size: 18, disabled: !Units.count(k), tip: tr('dismiss_tip') });
    return y + 44;
  }
  /** The barracks: the recruit at drill, a line per kind of soldier, and the two orders for all of them. */
  function drawBarracks(b, x, y, w) {
    const free = Units.free();
    text(tr('train_title'), x, y + 10, 15, C.gold, 'left', true); text(tr('pop_free', { n: free }), x + w, y + 10, 13, free > 0 ? C.good : C.bad, 'right', true); y += 24;
    if (b.train) { text(tr('training', { name: U[b.train.kind].name }), x, y + 9, 14, C.accent, 'left', true); UI.bar(x + 190, y, w - 190, 16, 1 - b.train.left / b.train.total, C.accent); y += 24; }
    for (const k of DATA.unitOrder) if (U[k].role === 'soldier') y = unitRow(k, x, y, w, tr('unit_stats', { hp: Math.round(U[k].hp * Units.drill()), atk: fmtNum(U[k].atk * Units.drill()) }));
    return armyButtons(x, y + 2, w);
  }
  function armyButtons(x, y, w) {
    const any = Units.soldiers().length > 0;
    UI.button(x, y, (w - 8) / 2, 34, tr('select_all'), selectAll, { size: 13, disabled: !any, tip: tr('select_all') + '\n' + tr('key_tip', { k: 'T' }) });
    UI.button(x + (w + 8) / 2, y, (w - 8) / 2, 34, tr('recall'), Units.recall, { size: 13, disabled: !any, tip: tr('recall_tip') });
    return y + 40;
  }
  /** The People panel: the classes, the workers to train, and the army in a glance. */
  function drawPeople() {
    const x = P.x + 24, w = P.w - 48, free = Units.free();
    UI.panel(P.x, P.y, P.w, P.h, tr('people_title'), closePanel);
    drawKeeper('steward', null);
    UI.scrollBox('people', x, P.y + 56, w, P.h - 72, y => peopleBody(x, y, w, free));
  }
  /** The People panel's body, from y down. Returns the y under it. */
  function peopleBody(x, y, w, free) {
    text(`${tr('pop')} : ${Village.pop()}`, x, y + 10, 16, C.text, 'left', true);
    text(tr('pop_free', { n: free }), x + w, y + 10, 14, free > 0 ? C.good : C.dim, 'right', true); y += 26;
    text(tr('classes'), x, y + 10, 15, C.gold, 'left', true); y += 22;
    DATA.classes.forEach((c, i) => { // a line per class: its houses, and what one of them eats
      const n = Village.classCount(i) - Village.classCount(i + 1), keys = Object.keys(c.needs);
      UI.region(x, y, w, 20, null, c.name + '\n' + c.desc);
      text(c.name, x, y + 10, 14, n ? C.text : C.dim, 'left', true);
      text(tr(n > 1 ? 'houses_n' : 'house_n', { n }), x + 92, y + 10, 13, C.dim, 'left');
      keys.forEach((r, j) => { const nx = x + w - (keys.length - j) * 44; UI.icon(RES[r].icon, nx + 8, y + 10, 16); text('×' + c.needs[r], nx + 19, y + 11, 13, C.text, 'left'); });
      y += 21;
    });
    const hungry = state.buildings.filter(b => B[b.kind].pop && b.lack).length;
    if (hungry) y = UI.wrap(tr(hungry > 1 ? 'houses_lack' : 'house_lack'), x, y, w, 13, C.bad);
    text(tr('workers'), x, y + 14, 15, C.gold, 'left', true); y += 26;
    for (const k of DATA.unitOrder) if (U[k].role === 'worker') y = unitRow(k, x, y, w);
    const idle = state.units.filter(u => Units.isWorker(u) && u.sx == null).length;
    if (idle) y = UI.wrap(tr('workers_idle', { n: idle }), x, y, w, 13, C.bad);
    text(tr('soldiers'), x, y + 12, 15, C.gold, 'left', true); y += 24;
    if (!Units.barracks()) return UI.wrap(tr('soldiers_none'), x, y, w, 13, C.dim);
    const down = Units.soldiers().filter(u => u.down > 0).length;
    text(DATA.unitOrder.filter(k => U[k].role === 'soldier').map(k => `${U[k].plural} ${Units.count(k)}`).join(' · ') + (down ? ' · ' + tr('soldiers_down', { n: down }) : ''), x, y + 9, 13, C.text, 'left'); y += 22;
    y = armyButtons(x, y, w);
    return UI.wrap(tr('soldiers_help'), x, y, w, 12, C.dim, 16);
  }
  function drawHero() {
    const h = state.hero, st = Hero.stats(), x = P.x + 24, w = P.w - 48;
    UI.panel(P.x, P.y, P.w, P.h, tr('hero_title') + ' · ' + heroName(), closePanel);
    UI.sprite('hero.battle', x, P.y + 56, 2, Hero.weaponTier());
    const sx = x + 100; let y = P.y + 72;
    text(tr('level', { n: h.lvl }), sx, y, 20, C.gold, 'left', true);
    text(`${h.xp} / ${Hero.xpNeed(h.lvl)} XP`, x + w, y, 14, C.dim, 'right'); y += 18;
    UI.bar(sx, y, w - 100, 14, h.xp / Hero.xpNeed(h.lvl), C.accent); y += 28;
    UI.icon('icon.hp', sx + 12, y + 8, 32); text(String(st.hp), sx + 30, y + 9, 17, C.text, 'left', true);
    UI.icon('icon.atk', sx + 100, y + 8, 32); text(fmtNum(st.atk), sx + 118, y + 9, 17, C.text, 'left', true);
    UI.icon('icon.def', sx + 188, y + 8, 32); text(fmtNum(st.def), sx + 206, y + 9, 17, C.text, 'left', true); y += 32;
    const ms = state.mission && DATA.missions.find(k => k.id === state.mission.id);
    const trip = !ms && Explore.onTrip(); // away at a place found in the wild (js/explore.js)
    UI.wrap(ms ? tr('mission_run', { title: ms.title }) + ' · ' + fmtTime(state.mission.left) : trip ? tr('ex_trip') : tr('at_village'), sx, y - 2, w - 100, 14, ms || trip ? C.accent : C.dim, 18);
    UI.scrollBox('hero', x, P.y + 160, w, P.h - 176, y0 => heroBody(h, x, y0, w));
  }
  /** The hero's gear, bag and skills, from y down. Returns the y under them. */
  function heroBody(h, x, y, w) {
    for (const slot of ['weapon', 'armor']) {
      const id = h.equip[slot];
      text(tr(slot) + ' :', x, y + 10, 15, C.dim, 'left');
      text(id ? I[id].name + (h.plus[id] ? ' +' + h.plus[id] : '') : tr('nothing'), x + 76, y + 10, 15, id ? C.text : C.dim, 'left', !!id); y += 24;
    }
    y += 6; text(tr('inventory'), x, y + 10, 16, C.gold, 'left', true); y += 28;
    if (!h.inv.length) y = UI.wrap(tr('inventory_empty'), x, y, w, 14, C.dim) + 4;
    for (const id of h.inv) {
      const it = I[id], s = Hero.itemStats(id), on = h.equip[it.slot] === id;
      text(it.name + (h.plus[id] ? ' +' + h.plus[id] : ''), x, y + 9, 15, C.text, 'left', true);
      text([s.atk ? tr('stat_atk', { n: fmtNum(s.atk) }) : '', s.def ? tr('stat_def', { n: fmtNum(s.def) }) : '', s.hp ? tr('stat_hp', { n: fmtNum(s.hp) }) : ''].filter(Boolean).join(' · '), x, y + 27, 14, C.good, 'left');
      UI.button(x + w - 104, y + 2, 104, 32, on ? tr('equipped') : tr('equip'), () => Hero.equip(id), { size: 14, primary: !on, disabled: on, tip: it.name + '\n' + it.desc });
      Tuto.mark('equip:' + id, x + w - 104, y + 2, 104, 32);
      y += 40;
    }
    // his deck: one row per card the village and his level give him; a click leaves it at home
    const st = Hero.stats(), stats = { atk: st.atk, def: st.def, max: st.hp }, pool = Cards.pool();
    y += 8; text(tr('deck'), x, y + 10, 16, C.gold, 'left', true); text(tr('deck_count', { n: Cards.size() }), x + w, y + 10, 14, C.dim, 'right'); Tuto.mark('deck', x, y - 2, w, 26); y += 24;
    y = UI.wrap(tr('deck_help', { min: tune.deck_min }), x, y, w, 13, C.dim, 17) + 6;
    for (const e of pool) {
      const on = !e.benched, y0 = y;
      UI.button(x, y, 30, 30, '', () => { if (!Cards.toggle(e.id)) toast(tr('deck_min', { min: tune.deck_min }), C.bad); }, { icon: on ? 'icon.check' : null, on });
      text(`${e.c.name}${e.copies > 1 ? ' ×' + e.copies : ''}`, x + 40, y + 9, 14, on ? C.text : C.dim, 'left', true);
      text(Cards.origin(e), x + w, y + 9, 12, C.dim, 'right');
      y = UI.wrap(tr('card_cost', { n: e.c.cost }) + ' · ' + Cards.lines(e, stats).join(' · '), x + 40, y + 19, w - 40, 13, on ? C.good : C.dim, 16) + 8;
      UI.region(x + 34, y0, w - 34, y - y0 - 6, null, Cards.tip(e, stats));
    }
    const more = DATA.cardOrder.filter(id => !pool.some(e => e.id === id));
    if (more.length) {
      y += 4; text(tr('deck_more'), x, y + 10, 15, C.gold, 'left', true); y += 26;
      for (const id of more) {
        const c = DATA.cards[id];
        UI.icon('icon.lock', x + 8, y + 9, 16); text(c.name, x + 22, y + 9, 14, C.dim, 'left', true);
        text(c.from === 'hero' ? tr('deck_locked', { n: c.lvl }) : tr('deck_build', { name: B[c.from].name }), x + w, y + 9, 13, C.dim, 'right'); y += 22;
      }
    }
    return y;
  }
  function rewardLine(r, drops) {
    const parts = [];
    if (r.xp) parts.push(`+${r.xp} XP`);
    if (r.gold) parts.push(`+${r.gold} or`);
    for (const k in r.res || {}) parts.push(`+${r.res[k]} ${lower(RES[k].name)}`);
    for (const d of drops || []) parts.push(`${d.n} ${lower(RES[d.res].name)}` + (d.chance < 1 ? ` (${Math.round(d.chance * 100)} %)` : ''));
    return tr('reward') + ' : ' + parts.join(', ');
  }
  function questBlock(q, x, y, w, contract) {
    const done = !contract && state.quests.done[q.id];
    text(q.title + (contract ? ' · ' + tr('tier', { n: Quests.tierOf(q) + 1 }) : ''), x, y + 10, 17, done ? C.dim : C.gold, 'left', true); y += 26;
    if (done) { UI.icon('icon.check', x + 8, y + 6, 16); text(tr('done'), x + 22, y + 6, 14, C.good, 'left'); return y + 28; }
    y = UI.wrap(q.text, x, y, w, 15, C.text) + 2;
    if (q.encounter) y = UI.wrap(q.encounter.map(id => DATA.enemies[id].name).join(', '), x, y, w, 14, C.bad);
    const need = Quests.describe(q.goal).concat(Quests.describe(q.requires));
    for (const p of need) { UI.icon(p.ok ? 'icon.check' : 'icon.lock', x + 8, y + 10, 16); text(p.text, x + 22, y + 10, 14, p.ok ? C.good : C.bad, 'left'); y += 22; }
    y = UI.wrap(rewardLine(Quests.rewardOf(q)), x, y + 2, w, 14, C.dim);
    const un = Quests.unlocksOf(q);
    if (un.length) y = UI.wrap(tr('unlocks') + ' : ' + un.join(', '), x, y, w, 14, C.accent);
    y += 6;
    if (q.type === 'deliver') { UI.button(x, y, 170, 38, tr('deliver'), () => Quests.deliver(q), { primary: true, disabled: !need.every(p => p.ok), size: 15 }); y += 46; }
    else if (q.encounter) { const why = Quests.blocked(q); UI.button(x, y, 200, 38, tr('go_fight'), () => Quests.startBattle(q), { primary: true, disabled: !!why, size: 15, tip: why ? tr('locked_quest') + '\n' + why : null }); Tuto.mark('fight:' + q.id, x, y, 200, 38); y += 46; }
    return y + 8;
  }
  function missionBlock(m, x, y, w) {
    text(m.title, x, y + 10, 17, C.gold, 'left', true); text(fmtTime(m.time), x + w, y + 10, 15, C.dim, 'right'); y += 26;
    y = UI.wrap(m.text, x, y, w, 15, C.text) + 2;
    y = UI.wrap(rewardLine(m.reward, m.drops), x, y, w, 14, C.dim) + 4;
    const cur = state.mission && state.mission.id === m.id, miss = Quests.describe(m.requires).filter(p => !p.ok);
    if (cur) { UI.bar(x, y, w, 18, 1 - state.mission.left / state.mission.total, C.accent); text(fmtTime(state.mission.left), x + w / 2, y + 10, 14, C.text, 'center', true); return y + 34; }
    if (miss.length) { UI.icon('icon.lock', x + 8, y + 10, 16); text(miss.map(p => p.text).join(', '), x + 22, y + 10, 14, C.bad, 'left'); return y + 34; }
    UI.button(x, y, 190, 36, tr('start_mission'), () => Hero.startMission(m), { primary: true, size: 15, disabled: Hero.away() || !Village.canAfford(m.cost) });
    Tuto.mark('mission:' + m.id, x, y, 190, 36);
    if (Object.keys(m.cost).length) UI.cost(m.cost, x + 204, y + 18, { size: 14 });
    return y + 50;
  }
  function drawQuests() {
    const x = P.x + 24, w = P.w - 48;
    UI.panel(P.x, P.y, P.w, P.h, tr('btn_quests').replace(' (J)', ''), closePanel);
    [['main', 'tab_main'], ['side', 'tab_side'], ['missions', 'tab_missions'], ['contracts', 'tab_contracts']].forEach(([id, key], i) => {
      UI.tab(x + i * 89, P.y + 58, 87, 30, tr(key), () => { ui.tab = id; UI.scrollTop('quests'); }, ui.tab === id, { size: 13 }); Tuto.mark('qtab:' + id, x + i * 89, P.y + 58, 87, 30);
    });
    UI.scrollBox('quests', x, P.y + 98, w, P.h - 114, y => questsBody(x, y, w));
  }
  /** The quest book's open tab, from y down. Returns the y under it. */
  function questsBody(x, y, w) {
    if (ui.tab === 'main') {
      const cur = Quests.current(), ch = cur ? cur.chapter : DATA.chapters[DATA.chapters.length - 1];
      text(ch.title, x, y + 10, 16, C.accent, 'left', true); y += 30;
      for (const q of ch.quests) {
        if (state.quests.done[q.id]) { UI.icon('icon.check', x + 8, y + 8, 16); text(q.title, x + 22, y + 8, 15, C.dim, 'left'); y += 26; }
        else if (q === cur) y = questBlock(q, x, y + 4, w);
        else { UI.icon('icon.lock', x + 8, y + 8, 16); text('???', x + 22, y + 8, 15, C.dim, 'left'); y += 26; }
      }
      if (!cur) y = UI.wrap(tr('next_chapter'), x, y + 8, w, 15, C.text);
    } else if (ui.tab === 'side') {
      for (const q of DATA.sideQuests) y = questBlock(q, x, y, w);
    } else if (ui.tab === 'missions') {
      for (const m of DATA.missions) y = missionBlock(m, x, y, w);
    } else {
      const open = DATA.contracts.filter(q => Quests.met(q.requires));
      if (!open.length) y = UI.wrap(tr('contracts_none'), x, y, w, 15, C.dim);
      for (const q of open) y = questBlock(q, x, y, w, true);
    }
    return y;
  }
  /** Puts this land's link (the game's address with ?seed=) in the clipboard; when the browser refuses, shows it instead. */
  function copyMapLink() {
    const url = location.origin + location.pathname + '?seed=' + state.mapSeed, show = () => toast(tr('map_link', { url }), C.text);
    try { navigator.clipboard.writeText(url).then(() => toast(tr('map_copied'), C.good), show); } catch (e) { show(); }
  }
  function drawMenu() {
    const x = P.x + 24, w = P.w - 48;
    UI.panel(P.x, P.y, P.w, P.h, tr('menu_title'), closePanel);
    let y = UI.wrap(Save.enabled ? tr('save_note') : tr('save_off'), x, P.y + 60, w, 14, C.dim) + 8;
    UI.button(x, y, w, 36, tr('save_now'), () => { if (Save.persist()) toast(tr('saved'), C.good); }, { size: 15, disabled: !Save.enabled, icon: 'icon.check' }); y += 42;
    UI.button(x, y, (w - 8) / 2, 36, tr('export'), Save.exportFile, { size: 13 }); Tuto.mark('menu:export', x, y, w, 36);
    UI.button(x + (w + 8) / 2, y, (w - 8) / 2, 36, tr('import'), Save.importFile, { size: 13 }); y += 42;
    const half = (w - 8) / 2;
    UI.button(x, y, half, 36, muted ? tr('sound_off') : tr('sound_on'), () => setMuted(!muted), { size: 13, icon: 'icon.sound' });
    UI.button(x + half + 8, y, half, 36, tr('book_btn'), () => { ui.panel = 'lessons'; UI.scrollTop('lessons'); }, { size: 13, icon: 'icon.quest' }); Tuto.mark('menu:lessons', x + half + 8, y, half, 36); y += 42;
    text(tr('map_no', { n: state.mapSeed }), x, y + 23, 15, C.gold, 'left', true);
    UI.button(x + half + 8, y, half, 36, tr('map_copy'), copyMapLink, { size: 13 }); y += 52;
    text(tr('prestige_title'), x, y + 10, 17, C.gold, 'left', true); y += 28;
    y = UI.wrap(tr('prestige_text'), x, y, w, 14, C.text) + 4;
    const n = Village.renownGain(), pct = k => Math.round(k * tune.renown_bonus * 100);
    if (state.prestige.renown) y = UI.wrap(tr('prestige_have', { n: state.prestige.renown, pct: pct(state.prestige.renown) }), x, y, w, 14, C.gold);
    y = UI.wrap(n > 0 ? tr('prestige_gain', { n, pct: pct(n) }) : tr('prestige_none'), x, y, w, 14, n > 0 ? C.good : C.dim) + 6;
    UI.button(x, y, w, 38, tr('prestige_do'), () => { if (Village.newStart()) closePanel(); }, { size: 15, primary: n > 0, disabled: n < 1 || !!state.raid.active });
    Tuto.mark('menu:prestige', x, y, w, 38);
    const armed = ui.wipeArm > state.t;
    UI.button(x, P.y + P.h - 60, w, 36, armed ? tr('wipe_confirm') : tr('wipe'), () => {
      if (armed) { Save.wipe(); reset(); openNaming(); } else ui.wipeArm = state.t + 4; // a new game: the hero is named first
    }, { size: 14 });
  }
  /** The Livre des leçons: every lesson of Aveline's, to follow or play again (js/tutorial.js draws its lines). */
  function drawLessons() {
    const x = P.x + 24, w = P.w - 48;
    UI.panel(P.x, P.y, P.w, P.h, tr('book_title'), closePanel);
    UI.scrollBox('lessons', x, P.y + 56, w, P.h - 72, y => Tuto.book(x, y, w));
  }
  function drawToasts() {
    const el = Raid.elite ? Raid.elite().length : 0, top = Tuto.running() ? 190 : (state.raid.siege && (state.raid.warned || state.raid.active) ? 216 : 130) + (el ? 36 + el * 18 : 0); // under the guide's task box, or the siege's and the elite raid's plates
    ui.toasts.forEach((t, i) => {
      const w = Math.min(820, UI.width(t.msg, 15, true) + 40), y = top + i * 40;
      ctx.globalAlpha = clamp((5 - t.t) * 2, 0, 1);
      UI.plate(640 - w / 2, y, w, 36); UI.label(t.msg, 640, y + 19, 15, t.color);
      ctx.globalAlpha = 1;
    });
  }
  function drawModals() {
    const m = ui.away || ui.banner;
    if (!m) return;
    UI.region(0, 0, W, H, null); ctx.fillStyle = 'rgba(20,13,8,0.6)'; ctx.fillRect(0, 0, W, H);
    UI.panel(360, 170, 560, 360);
    const close = () => { ui.away = null; ui.banner = null; };
    if (ui.away) {
      UI.label(tr('away_title'), 640, 214, 34, C.gold, 'center', true);
      let y = UI.wrap(tr('away_text', { time: fmtTime(ui.away.seconds) }), 392, 250, 496, 16, C.text) + 10;
      const keys = Object.keys(ui.away.gains);
      if (!keys.length) UI.wrap(tr('away_nothing'), 392, y, 496, 15, C.dim);
      keys.forEach((r, i) => { const cx = 400 + (i % 2) * 250, cy = y + (i >> 1) * 32; UI.icon(RES[r].icon, cx + 16, cy + 11, 32); text(`+${fmt(ui.away.gains[r])} ${lower(RES[r].name)}`, cx + 38, cy + 11, 17, C.good, 'left', true); });
    } else {
      UI.label(m.title, 640, 216, 36, C.gold, 'center', true);
      text(m.sub, 640, 258, 17, C.accent, 'center', true);
      UI.wrap(m.text, 392, 286, 496, 16, C.text, 23);
    }
    UI.button(520, 468, 240, 46, tr('continue'), close, { primary: true, size: 18 });
  }
  /**
   * What a building would do on these tiles, said before it is placed: whether it touches a
   * path to the hall, how many houses it would serve or embellish (and which, to frame them on
   * the map), and for a house the services and the beauty it would have there.
   */
  function placeInfo(kind, tx, ty, rot, mv) {
    const d = B[kind], sz = Village.size(kind, rot), mx = tx + sz.w / 2, my = ty + sz.h / 2, lines = [], touched = new Set();
    let color = null;
    if (Village.needsRoad(kind)) lines.push(Village.roadAt(kind, tx, ty, rot) ? { text: tr('gh_road_ok'), color: C.good, icon: 'icon.road' } : { text: tr('gh_road_no'), color: C.bad, icon: 'icon.road' });
    const houses = state.buildings.filter(h => B[h.kind].pop && (!mv || h.uid !== mv.uid));
    const near = r => houses.filter(h => { const hd = Village.dims(h); return Math.hypot(h.x + hd.w / 2 - mx, h.y + hd.h / 2 - my) <= r; });
    if (d.service) {
      const hs = near(d.service.radius); hs.forEach(h => touched.add(h.uid)); color = PAL.amberL;
      lines.push({ text: tr('gh_serves', { n: hs.length, name: d.name }), color: C.gold, icon: 'icon.service' });
    }
    if (d.beauty) {
      const hs = near(tune.beauty_radius + Math.max(sz.w, sz.h) / 2); if (!d.service) { hs.forEach(h => touched.add(h.uid)); color = d.beauty > 0 ? PAL.greenL : PAL.red; }
      if (hs.length || d.beauty > 0) lines.push({ text: tr(d.beauty > 0 ? 'gh_beauty_plus' : 'gh_beauty_minus', { n: fmtNum(Math.abs(d.beauty)), h: hs.length }), color: d.beauty > 0 ? C.good : C.bad, icon: 'icon.beauty' });
    }
    if (d.pop) {
      const sv = Village.servicesAt(mx, my), bt = Village.beautyAt(mx, my, mv);
      lines.push({ text: tr('gh_services', { list: ['cafe', 'chapel', 'market'].map(k => B[k].card + (sv.has(k) ? ' ✓' : ' ✗')).join(' · ') }), color: C.text, icon: 'icon.service' });
      lines.push({ text: tr('gh_beauty', { n: fmtNum(bt.total) }), color: bt.total >= 0 ? C.good : C.bad, icon: 'icon.beauty' });
    }
    return { lines, touched, color };
  }
  function playDraw() {
    Tuto.begin(); // the places its arrow can point at are named again as this frame is drawn
    const view = { sel: ui.sel, units: new Set(ui.selU), zone: !!(ui.placing || ui.moving || ui.tool) };
    const mv = ui.moving && Village.byUid(ui.moving), kind = ui.placing || (mv && mv.kind);
    const plan = ui.wall && ui.placing ? ui.wallShape || wallPlan() : null;
    if (plan) { // the rampart being drawn: each tile, free or not, and what it all costs
      view.wall = { kind: ui.placing, tiles: plan.map(t => ({ tx: t.tx, ty: t.ty, ok: Village.canPlace(ui.placing, t.tx, t.ty) })) };
    } else if (kind && mouse.y > TOP && mouse.y < BOTTOM && !ui.away && !ui.banner) {
      const p = World.toWorld(mouse.x, mouse.y), g = World.ghostTile(kind, p.x, p.y, ui.rot);
      view.ghost = { kind, tx: g.tx, ty: g.ty, rot: ui.rot, ok: Village.canPlace(kind, g.tx, g.ty, mv ? mv.uid : undefined, ui.rot), uid: mv ? mv.uid : 0 };
      view.ghostInfo = placeInfo(kind, g.tx, g.ty, ui.rot, mv);
      view.touched = view.ghostInfo.touched; view.touchedColor = view.ghostInfo.color;
    }
    if (ui.tool === 'path') view.roads = true; // the path tool in hand: the paved tiles cut off from the hall show in red
    if (ui.tool && mouse.y > TOP && mouse.y < BOTTOM && !ui.away && !ui.banner) { // the tile a land tool is over
      const p = World.toWorld(mouse.x, mouse.y), f = ui.tool === 'clear' && World.pickFlora(p.x, p.y), t = f || tileAt(mouse.x, mouse.y);
      const free = Village.inMap(t.tx, t.ty) && Village.occ[Village.idx(t.tx, t.ty)] === 0;
      const trap = ui.tool.startsWith('trap:') ? ui.tool.slice(5) : null;
      const ok = trap ? Raid.trapsOpen() && Raid.canTrap(t.tx, t.ty) : ui.tool === 'clear' ? Village.inMap(t.tx, t.ty) && (!!Village.floraAt(t.tx, t.ty) || Village.occ[Village.idx(t.tx, t.ty)] === -2) : free;
      view.tool = { tx: t.tx, ty: t.ty, ok, flora: ui.tool.startsWith('plant:') ? ui.tool.slice(6) : null, trap };
    }
    World.draw(view);
    if (view.ghostInfo && view.ghostInfo.lines.length) { // what the building on the pointer would do here
      const gi = view.ghostInfo, w = Math.max(...gi.lines.map(l => UI.width(l.text, 13, true))) + 44, h = gi.lines.length * 19 + 14;
      const x = clamp(mouse.x + 22, 4, W - w - 4), y = clamp(mouse.y + 18, TOP + 4, BOTTOM - h - 54);
      UI.plate(x, y, w, h);
      gi.lines.forEach((l, i) => { UI.icon(l.icon, x + 20, y + 16 + i * 19, 16); text(l.text, x + 32, y + 17 + i * 19, 13, l.color, 'left', true); });
    }
    if (ui.box) { // the selection box being drawn
      const bx = ui.box, x0 = Math.min(bx.x, bx.x1), y0 = Math.min(bx.y, bx.y1), bw = Math.abs(bx.x1 - bx.x), bh = Math.abs(bx.y1 - bx.y);
      ctx.fillStyle = 'rgba(155,232,95,0.14)'; ctx.fillRect(x0, y0, bw, bh);
      ctx.fillStyle = C.good; ctx.fillRect(x0, y0, bw, 2); ctx.fillRect(x0, y0 + bh - 2, bw, 2); ctx.fillRect(x0, y0, 2, bh); ctx.fillRect(x0 + bw - 2, y0, 2, bh);
    }
    drawWorldLabels(); drawHud(); drawCards();
    // the view's own buttons, above the build bar
    UI.button(10, BOTTOM - 50, 44, 44, '', () => World.zoomBy(-1, W / 2, 316), { icon: 'icon.zoom_out', tip: tr('zoom_out') });
    UI.button(58, BOTTOM - 50, 44, 44, '', () => World.zoomBy(1, W / 2, 316), { icon: 'icon.zoom_in', tip: tr('zoom_in') });
    UI.button(106, BOTTOM - 50, 44, 44, '', goHome, { icon: 'icon.recenter', tip: tr('recenter') + '\n' + tr('recenter_tip') });
    Tuto.mark('view', 10, BOTTOM - 50, 140, 44);
    if (Units.soldiers().length) UI.button(154, BOTTOM - 50, 44, 44, '', selectAll, { icon: 'icon.army', on: ui.selU.length > 0, tip: tr('select_all') + '\n' + tr('key_tip', { k: 'T' }) });
    if (ui.selU.length && !kind && !ui.tool) { // the chosen soldiers, and how to send them
      const hint = tr('sel_hint', { n: ui.selU.length }), hw = UI.width(hint, 14, true) + 36;
      UI.plate(640 - hw / 2, BOTTOM - 46, hw, 38); UI.label(hint, 640, BOTTOM - 26, 14, C.text);
      UI.button(640 + hw / 2 + 6, BOTTOM - 46, 110, 38, tr('recall'), Units.recall, { size: 14, tip: tr('recall_tip') });
    }
    if (kind || ui.tool) { // what the pointer is carrying, and how to put it down
      const name = kind ? B[kind].name : ui.tool.startsWith('plant:') ? DATA.flora[ui.tool.slice(6)].name : ui.tool.startsWith('trap:') ? DATA.traps[ui.tool.slice(5)].name : DATA.tools[ui.tool].name;
      const turn = !ui.tool && turnable();
      const hint = name + ' · ' + tr(ui.tool ? (ui.tool.startsWith('trap:') ? 'trap_hint' : 'tool_hint') : mv ? 'move_hint' : B[kind].wall ? 'wall_hint' : 'place_hint') + (turn ? ' ' + tr('turn_hint') : ''), hw = Math.max(560, UI.width(hint, 14, true) + 36);
      UI.plate(640 - hw / 2, BOTTOM - 46, hw, 38);
      UI.label(hint, 640, BOTTOM - 26, 14, C.text);
      if (turn) UI.button(640 + hw / 2 + 6, BOTTOM - 46, 120, 38, tr('turn'), () => { ui.rot ^= 1; }, { size: 14, tip: tr('turn_tip') });
    }
    if (plan && plan.length) { // the drawn rampart's length and price, by the pointer
      const ok = view.wall.tiles.filter(t => t.ok).length, c = {}, one = Village.cost(ui.placing);
      for (const r in one) c[r] = one[r] * ok;
      const can = Village.canAfford(c), lbl = tr('wall_count', { n: ok }), w = UI.width(lbl, 14, true) + 30 + Object.keys(c).length * 64;
      const x = clamp(mouse.x + 18, 4, W - w - 4), y = clamp(mouse.y - 46, TOP + 4, BOTTOM - 40);
      UI.plate(x, y, w, 32);
      UI.label(lbl, x + 12, y + 16, 14, can ? C.text : C.bad, 'left');
      UI.cost(c, x + 20 + UI.width(lbl, 14, true), y + 16, { size: 14 });
    }
    if (ui.panel === 'building') drawBuilding();
    else if (ui.panel === 'hero') drawHero();
    else if (ui.panel === 'quests') drawQuests();
    else if (ui.panel === 'menu') drawMenu();
    else if (ui.panel === 'people') drawPeople();
    else if (ui.panel === 'lessons') drawLessons();
    else if (ui.panel === 'city') City.drawPanel(P);
    else if (ui.panel === 'explore') Explore.drawPanel(P);
    Tuto.draw(); drawToasts(); drawModals(); // the news stays readable over the tutorial's dimmed screen
  }

  // ---- The other screens ----
  function titleStart() {
    if (Save.has() && Save.load()) scene = 'play';
    else { reset(); openNaming(); } // a new game: the hero is named first
  }

  // ---- Naming the hero, before a new game ----
  // The name is typed into a real text field laid over the canvas (accents, paste, a phone's
  // keyboard all work); the canvas draws the panel around it. It is kept in state.hero.name.
  const NAME_BOX = { x: 470, y: 330, w: 420, h: 56 }; // the field, in logical units
  let nameField = null;
  function field() {
    if (nameField) return nameField;
    const f = nameField = document.createElement('input');
    Object.assign(f, { type: 'text', autocomplete: 'off', spellcheck: false, placeholder: DATA.hero.name });
    f.setAttribute('autocapitalize', 'words'); f.setAttribute('enterkeyhint', 'done'); f.setAttribute('aria-label', tr('name_ask'));
    Object.assign(f.style, { position: 'fixed', display: 'none', boxSizing: 'border-box', margin: 0, padding: '0 12px', border: 'none', outline: 'none',
      background: 'transparent', color: UI.C.text, caretColor: UI.C.gold, textAlign: 'center', fontFamily: FONT, fontWeight: 'bold', zIndex: 2 });
    f.addEventListener('input', () => { // what a name cannot hold never gets in, nor more than its length (Hero.nameChars)
      const v = Hero.nameChars(f.value);
      if (v !== f.value) { const at = Math.max(0, f.selectionStart - (f.value.length - v.length)); f.value = v; f.setSelectionRange(at, at); sfx('error'); }
      ui.nameWhy = null;
    });
    f.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); nameConfirm(); }
      else if (e.key === 'Escape') { e.preventDefault(); nameBack(); }
    });
    document.body.appendChild(f);
    return f;
  }
  function openNaming() {
    const f = field();
    scene = 'naming'; ui.nameWhy = null;
    f.value = state.hero.name || DATA.hero.name; // the default, ready to keep with Entrée or to type over
    f.style.display = 'block'; placeField(); f.focus(); f.select();
  }
  function closeNaming() { if (nameField) { nameField.blur(); nameField.style.display = 'none'; } }
  /** Lays the text field over its box on the canvas, at the canvas's present size. */
  function placeField() {
    const r = canvas.getBoundingClientRect(), k = r.width / W, b = NAME_BOX, s = nameField.style;
    s.left = (r.left + (b.x + 4) * k) + 'px'; s.top = (r.top + (b.y + 4) * k) + 'px';
    s.width = ((b.w - 8) * k) + 'px'; s.height = ((b.h - 8) * k) + 'px'; s.fontSize = (26 * k) + 'px';
  }
  function nameConfirm() {
    const r = Hero.cleanName(nameField.value);
    if (r.why) { ui.nameWhy = r.why; sfx('error'); nameField.focus(); return; }
    state.hero.name = r.name; closeNaming();
    Save.begin(); scene = 'play'; sfx('click');
  }
  function nameBack() { closeNaming(); scene = 'title'; ui.titleWipe = 0; }
  function drawNaming() {
    World.draw({ dim: 0.62 });
    const px = 330, py = 150, pw = 620, ph = 400, b = NAME_BOX, f = field(), lim = { min: DATA.hero.nameMin, max: DATA.hero.nameMax };
    UI.panel(px, py, pw, ph, tr('name_title'));
    UI.sprite('hero.battle', px + 34, b.y - 60, 2, 1);
    text(tr('map_no', { n: state.mapSeed }), b.x, py + 72, 15, C.gold, 'left', true); // the land behind the panel, and another one to start on
    UI.button(b.x + b.w - 170, py + 50, 170, 32, tr('map_other'), () => reset(Village.drawSeed(false)), { size: 13 });
    UI.label(tr('name_ask'), b.x + b.w / 2, b.y - 36, 20, C.text);
    UI.box(b.x, b.y, b.w, b.h, '#1b1420', ui.nameWhy ? C.bad : document.activeElement === f ? C.gold : C.lineL);
    UI.region(b.x, b.y, b.w, b.h, () => f.focus());
    const n = [...f.value.replace(/\s+/g, ' ').trim()].length;
    text(n + ' / ' + lim.max, b.x + b.w, b.y + b.h + 16, 13, n > lim.max ? C.bad : C.dim, 'right');
    UI.wrap(ui.nameWhy ? tr(ui.nameWhy, lim) : tr('name_rule', lim), 640, b.y + b.h + 40, pw - 60, 14, ui.nameWhy ? C.bad : C.dim, 18, false, 'center');
    const by = py + ph - 96;
    UI.button(px + 40, by, 200, 46, tr('name_back'), nameBack, { size: 17 });
    UI.button(px + pw - 300, by, 260, 46, tr('name_ok'), nameConfirm, { size: 18, primary: true });
    text(tr('name_keys'), 640, by + 68, 13, C.dim, 'center');
    placeField();
  }
  function drawTitle() {
    World.draw({ dim: 0.62 });
    const bob = Math.round(Math.sin(ui.titleT * 2) * 2);
    if (UI.ready('ui.logo')) { const lg = Art.get('ui.logo'); blit(lg, 640 - lg.width * PX / 2, 40 + bob); } // the PixelLab logo, at the world's pixel size
    else { text(TITLE, 644, 154 + bob, 104, '#120e1c', 'center', true, TITLE_FONT); text(TITLE, 640, 150 + bob, 104, C.gold, 'center', true, TITLE_FONT); }
    UI.label(tr('subtitle'), 640, 226, 22, C.text);
    UI.sprite('hero.battle', 596, 250, 2, 1);
    // the first controls, two by two, under no frame; the full list waits in the pause
    const rows = DATA.strings.controls_title, gap = 64, cy = 392, lh = 38, n = Math.ceil(rows.length / 2);
    const colW = [0, 1].map(c => Math.max(0, ...rows.filter((_, i) => i % 2 === c).map(r => keyRow(r, 0, 0, { size: 18, draw: false }))));
    const x0 = 640 - (colW[0] + gap + colW[1]) / 2, my = cy + n * lh + 6, more = DATA.strings.controls_more;
    const band = ctx.createLinearGradient(140, 0, 1140, 0); // a dark band fading at both ends, under the words
    band.addColorStop(0, 'rgba(20,13,8,0)'); band.addColorStop(0.22, 'rgba(20,13,8,0.72)');
    band.addColorStop(0.78, 'rgba(20,13,8,0.72)'); band.addColorStop(1, 'rgba(20,13,8,0)');
    const bt = cy - 30, bh = my - cy + 52;
    ctx.fillStyle = band; ctx.fillRect(140, bt, 1000, bh);
    for (let k = 1; k <= 6; k++) { ctx.globalAlpha = 1 - k / 7; ctx.fillRect(140, bt - k * 2, 1000, 2); ctx.fillRect(140, bt + bh + (k - 1) * 2, 1000, 2); } // soft top and bottom
    ctx.globalAlpha = 1;
    rows.forEach((r, i) => keyRow(r, x0 + (i % 2) * (colW[0] + gap), cy + Math.floor(i / 2) * lh, { size: 18 }));
    keyRow(more, 640 - keyRow(more, 0, 0, { draw: false }) / 2, my, { color: C.dim });
    const has = Save.has(), by = my + 44, hov = UI.over(390, by, 500, 54);
    if (!UI.nine(hov ? 'button_primary_hover' : 'button_primary', 390, by, 500, 54)) UI.box(390, by, 500, 54, C.btnP, C.gold);
    UI.label(tr(has ? 'start_continue' : 'start_new'), 640, by + 28, 20, C.text);
    if (has) UI.label(ui.titleWipe ? tr('start_wipe_confirm') : tr('start_wipe'), 640, by + 80, 15, ui.titleWipe ? C.bad : C.dim, 'center', false);
    if (has && Village.sharedSeed) UI.label(tr('map_shared', { n: Village.sharedSeed }), 640, by + 104, 15, C.gold, 'center', false); // a shared link, over a village of one's own
  }
  function drawPause() {
    playDraw();
    UI.region(0, 0, W, H, null); ctx.fillStyle = 'rgba(20,13,8,0.72)'; ctx.fillRect(0, 0, W, H);
    const groups = DATA.strings.controls, gh = g => 44 + g.rows.length * 30; // a group: its title, its rows, a gap
    const colH = Math.max(...[0, 1].map(c => groups.filter(g => g.col === c).reduce((s, g) => s + gh(g), 0)));
    const pw = 900, ph = 104 + colH + 84, px = 640 - pw / 2, py = Math.round((H - ph) / 2), colX = [px + 44, px + pw / 2 + 20], colW = pw / 2 - 64;
    UI.panel(px, py, pw, ph);
    UI.label(tr('paused'), 640, py + 46, 48, C.gold);
    const ys = [py + 104, py + 104]; // every control, by group, in two columns
    for (const g of groups) {
      const x = colX[g.col]; let y = ys[g.col];
      UI.icon(g.icon, x + 9, y, 18); UI.label(g.title, x + 26, y, 17, C.gold, 'left');
      ctx.fillStyle = 'rgba(143,95,28,0.6)'; ctx.fillRect(x, y + 15, colW, 2);
      y += 38;
      for (const r of g.rows) { keyRow(r, x, y); y += 30; }
      ys[g.col] = y + 6;
    }
    const tip = tr('controls_tip'), tw = UI.width(tip, 15, true) + 26, ty = py + 104 + colH + 8; // the one rule that is not a key
    UI.icon('icon.road', 640 - tw / 2 + 9, ty, 18); UI.label(tip, 640 - tw / 2 + 26, ty, 15, C.dim, 'left');
    UI.label(tr('pause_hint'), 640, py + ph - 34, 18, C.accent);
  }
  function drawFigures() { // every unit and enemy kind side by side, then every building, each named
    clear(PAL.grass); ctx.fillStyle = PAL.grassD; for (let i = 0; i < 90; i++) ctx.fillRect((i * 263) % W, (i * 149) % H, 2, 4);
    const row = (ids, y, x0, stepX, names, frame) => ids.forEach((id, i) => {
      const s = Art.get(id, frame || 0), x = x0 + i * stepX;
      blit(s, x - s.width * PX / 2, y - s.height * PX);
      shadowText(names[i], x, y + 16, 15, C.text, 'center');
    });
    const en = DATA.enemies;
    row(['hero.battle', 'enemy.gobelin', 'enemy.brute', 'enemy.chaman', 'enemy.grakk'], 230, 180, 230, [heroName() + ' (héros)', en.gobelin.name, en.brute.name, en.chaman.name, en.grakk.name], 1);
    ['hero', 'villager', 'gobelin', 'brute', 'chaman', 'grakk'].forEach((kind, i) => { // the map's figures, facing the player
      const s = World.unitSprite(kind, 0, 1, false, 0), x = 150 + i * 196;
      blit(s, x - s.width * PX / 2, 340 - s.height * PX);
      shadowText(['Héros', 'Villageois', 'Gobelin', 'Brute', 'Chaman', 'Grakk'][i], x, 356, 15, C.text, 'center');
    });
    DATA.unitOrder.forEach((k, i) => { // the citizens at work and the soldiers
      const s = World.unitSprite(U[k].sprite, 0, 1, false, 0), x = 90 + i * 132;
      blit(s, x - s.width * PX / 2, 450 - s.height * PX);
      shadowText(U[k].name, x, 466, 15, C.text, 'center');
    });
    DATA.trapOrder.forEach((k, i) => { // the traps
      const s = Art.get(DATA.traps[k].sprite), x = 900 + i * 130;
      blit(s, x - s.width * PX / 2, 450 - s.height * PX);
      shadowText(DATA.traps[k].name, x, 466, 15, C.text, 'center');
    });
    let x = 14;
    for (const k of ['hall'].concat(DATA.buildOrder.filter(id => !B[id].decor))) {
      const s = Art.get(B[k].sprite), z = 0.4, slot = Math.max(78, s.width * PX * z + 6); // well under half size: every building in one row
      blit(s, x + slot / 2 - s.width * PX * z / 2, 660 - s.height * PX * z, z);
      shadowText(B[k].card, x + slot / 2, 682, 12, C.text, 'center');
      x += slot + 4;
    }
  }

  /** ?scene=variants: every sprite that has several variants, each variant numbered as in assets/manifest.js. */
  function drawVariants() {
    clear(PAL.grass); ctx.fillStyle = PAL.grassD; for (let i = 0; i < 90; i++) ctx.fillRect((i * 263) % W, (i * 149) % H, 2, 4);
    shadowText('Variantes : le numéro est la place de l’image dans « frames » (assets/manifest.js)', 640, 26, 17, C.text, 'center');
    const cell = (id, f, x, y, k, label) => { // feet on y, centred on x
      const s = Art.get(id, f);
      blit(s, x - s.width * PX * k / 2, y - s.height * PX * k, k);
      shadowText(label, x, y + 14, 14, C.text, 'center');
    };
    const head = (s, x, y) => shadowText(s, x, y, 16, C.gold, 'center');
    head('hero.battle', 335, 76);
    ['bâton', 'lame d’apprenti', 'acier', 'runique'].forEach((n, f) => cell('hero.battle', f, 110 + f * 150, 200, 1, `${f} · ${n}`));
    head('building.house', 835, 76);
    ['toit orange', 'toit ardoise'].forEach((n, f) => cell('building.house', f, 760 + f * 150, 200, 1, `${f} · ${n}`));
    head('bg.battle', 1140, 56);
    ['jour', 'crépuscule (boss)'].forEach((n, f) => { // the battle backdrop, a quarter of its size
      const s = Art.get('bg.battle', f), x = 1060, y = 70 + f * 118;
      ctx.drawImage(s, x, y, 160, 90); shadowText(`${f} · ${n}`, x + 80, y + 102, 14, C.text, 'center');
    });
    ['unit.hero', 'unit.villager', 'unit.gobelin', 'unit.brute', 'unit.chaman', 'unit.grakk'].forEach((id, i) => {
      [0, 1].forEach(f => cell(id, f, 70 + i * 196 + f * 72, 400, 2, String(f)));
      head(id, 106 + i * 196, 446);
    });
    ['tree.red', 'tree.gold', 'tree.green'].forEach((id, i) => {
      [0, 1].forEach(f => cell(id, f, 70 + i * 140 + f * 62, 556, 1, String(f)));
      head(id, 101 + i * 140, 596);
    });
    UI.box(466, 508, 798, 104, 'rgba(18,14,28,0.55)', C.line); // a dark ground, so the grass tiles show on this grass page
    ['tile.grass', 'tile.forest', 'tile.path', 'tile.water', 'tile.bank'].forEach((id, i) => {
      [0, 1, 2].forEach(f => cell(id, f, 500 + i * 158 + f * 44, 556, 1, String(f)));
      head(id, 544 + i * 158, 596);
    });
    UI.wrap('Une variante sans image dans « frames » (null) garde son dessin. Une seule image (sans « frames ») remplace toutes les variantes.', 40, 650, 1200, 16, C.text);
  }

  // ---- The loading screen: the player's first screen, until the images of assets/manifest.js have
  // all arrived (or failed: those keep their drawn look). Then the title fades in. The checks' own
  // openings (?scene, ?demo, ?tuto, ?lesson, ?manual) never pass through it (index.html).
  const LOAD_MAX = 15, LOAD_FADE = 0.4; // seconds: the longest the screen waits on a slow file; the fade to the title
  const load = { t: 0, fade: -1 }; // fade: seconds since everything arrived, -1 until then
  const loadHold = params.has('loading') ? clamp(Number(params.get('loading')) || 0, 0, 1) : null; // ?loading=0.45: the screen held at that share, for a screenshot
  function loadingUpdate(dt) {
    if (loadHold != null) return;
    load.t += dt;
    const p = Art.progress;
    if (load.fade < 0 && (p.done >= p.total || load.t >= LOAD_MAX)) load.fade = 0;
    if (load.fade >= 0) { load.fade += dt; if (load.fade >= LOAD_FADE) scene = 'title'; }
  }
  function drawLoading() {
    const p = Art.progress, k = loadHold != null ? loadHold : p.total ? p.done / p.total : 1;
    const n = loadHold != null ? Math.round(loadHold * p.total) : p.done;
    if (load.fade >= 0) drawTitle(); else clear('#0d0a14');
    ctx.globalAlpha = load.fade >= 0 ? Math.max(0, 1 - load.fade / LOAD_FADE) : 1; // the loading screen thins away over the title
    clear('#0d0a14');
    if (UI.ready('ui.logo')) { const lg = Art.get('ui.logo'); blit(lg, 640 - lg.width * PX / 2, 150); } // the logo is often among the first to arrive
    else { text(TITLE, 644, 264, 104, '#120e1c', 'center', true, TITLE_FONT); text(TITLE, 640, 260, 104, C.gold, 'center', true, TITLE_FONT); }
    const bx = 400, by = 470, bw = 480, bh = 18;
    ctx.fillStyle = '#1b1420'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = C.gold; ctx.fillRect(bx + 3, by + 3, Math.round((bw - 6) * k), bh - 6);
    ctx.strokeStyle = C.lineL; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    text(tr('loading', { n, total: p.total }), 640, by + 42, 17, C.text);
    if (p.failed) text(tr('loading_missing', { n: p.failed }), 640, by + 70, 14, C.dim);
    ctx.globalAlpha = 1;
  }

  return {
    loading: { update: loadingUpdate, draw: drawLoading },
    variants: { update() {}, draw: drawVariants },
    title: {
      update(dt) {
        ui.titleT += dt;
        if (pressed('KeyN') && Save.has()) { if (ui.titleWipe) { Save.wipe(); ui.titleWipe = 0; } else ui.titleWipe = 1; return; }
        if (pressed('Enter') || pressed('Space') || pressed('NumpadEnter') || clicks.some(c => c.button === 0)) titleStart();
      },
      draw: drawTitle,
    },
    naming: { // the hero's name, before a new game: typed into the field, Entrée starts, Échap goes back
      update(dt) {
        ui.titleT += dt;
        if (pressed('Enter') || pressed('NumpadEnter')) { nameConfirm(); return; }
        if (pressed('Escape')) { nameBack(); return; }
        for (const c of clicks) { // the buttons are the panel's: a click on one is its own (as in the village, playUpdate)
          if (c.button !== 0) continue;
          if (UI.click(c.x, c.y)) { if (scene !== 'naming') return; continue; }
          setTimeout(() => nameField && scene === 'naming' && nameField.focus(), 0); // a click beside them gives the field the keys back
        }
      },
      draw: drawNaming,
    },
    play: { update: playUpdate, draw: playDraw },
    battle: { update(dt) { background(dt); Battle.update(dt); }, draw() { Battle.draw(); } },
    venue: { update(dt) { background(dt); effects(dt); Venue.update(dt); }, draw() { Venue.draw(); } }, // a place entered full screen (js/venue.js)
    pause: {
      update() { if (pressed('KeyP') || pressed('Escape') || pressed('Enter')) scene = 'play'; },
      draw: drawPause,
    },
    figures: { update() {}, draw: drawFigures },
  };
})();

/** ?demo=1: a village a few minutes in, walled, paved and decorated, with a raid on its way. For screenshots and for checking new art in place. */
function buildDemo() {
  const h = DATA.map.hall, B = DATA.buildings;
  for (const id of ['p1', 'p2', 'p3', 'p4', 'p5', 'm1']) state.quests.done[id] = true;
  state.tuto.done = true; state.tuto.off = !params.has('lesson'); // a village well under way: nothing left to teach (?lesson= opens one on it)
  Object.assign(state.res, { wood: 900, planks: 900, stone: 600, wheat: 30, bread: 22, gold: 900, shard: 1 });
  for (const k of DATA.buildOrder) state.unlocked[k] = true;
  for (let y = -3; y <= 12; y++) for (let x = -9; x <= 12; x++) Village.clearTile(h.x + x, h.y + y); // nothing wild inside the ramparts
  const put = (k, dx, dy, rot) => { // tiles from the hall's corner; whatever grows there is felled first. rot 1: turned
    const d = Village.size(k, rot);
    for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) Village.clearTile(h.x + dx + x, h.y + dy + y);
    Village.place(k, h.x + dx, h.y + dy, true, true, rot);
  };
  for (const [k, dx, dy, rot] of [['lumber_hut', -6, -6], ['lumber_hut', -3, -6], ['sawmill', 0, -6], ['forge', 5, -5], ['house', -8, -2, 1], ['house', -8, 1, 1], ['house', -5, 7],
    ['farm', 8, -1], ['bakery', 8, 3, 1], ['quarry', 4, -9], ['watchtower', -7, 5], ['watchtower', 11, 7], ['mage_tower', 9, 8],
    ['barracks', -5, 2], ['cafe', 5, 8], ['market', -4, -3], ['house', -9, -6], ['house', 9, -4],
    ['fountain', 1, 9], ['lamp', 0, 4], ['lamp', 4, 4], ['bench', -1, 10], ['flowers', 4, 10], ['well', -3, 4], ['statue', 5, 11], ['stall', -4, 10], ['banner', 1, 4], ['banner', 3, 4], ['barrels', 6, 5], ['hedge', 0, 12], ['hedge', 4, 12]]) put(k, dx, dy, rot);
  for (let x = -10; x <= 13; x++) if (x !== 2) put('palisade', x, 13);      // a rampart below the village, with a gate
  for (let y = -3; y <= 12; y++) { put('palisade', -10, y); put('palisade', 13, y); }
  for (let y = 3; y <= 16; y++) if (y < 9 || y > 10) { Village.clearTile(h.x + 2, h.y + y); Village.pave(h.x + 2, h.y + y, true); } // the paved way out, through both gates and around the fountain
  for (let x = -6; x <= 9; x++) { Village.clearTile(h.x + x, h.y + 6); Village.pave(h.x + x, h.y + 6, true); }
  Village.autoRoads(); // every working building joined to the hall by a path, as a player would have done
  Object.assign(state.res, { wood: 340, planks: 126, stone: 45, wheat: 30, bread: 22, coffee: 12, spice: 6, gold: 196, shard: 1 });
  Object.assign(state.totals, state.res);
  // the five classes, side by side; a few workers at their trades; a small guard
  state.buildings.filter(b => b.kind === 'house').forEach((b, i) => { b.cls = [4, 3, 2, 1, 0][i] || 0; b.sat = [1, 0.9, 0.8, 0.6, 0.4][i] || 0.5; b.lvl = b.cls >= 2 ? 5 : 1; });
  const door = Units.rally(0);
  for (const k of ['woodcutter', 'woodcutter', 'miner', 'farmhand', 'militia', 'militia', 'militia', 'archer', 'archer', 'knight']) Units.add(k, door.x, door.y);
  state.hero.inv = ['sword_1']; state.hero.equip.weapon = 'sword_1'; state.hero.lvl = 3;
  const assault = params.has('assault') ? Number(params.get('assault')) || 30 : 0; // ?assault=40: the guard sent at the goblin camp, 40 seconds on
  if (assault) { state.raid.n = 3; state.raid.timer = 400; Camp.ensure(); Camp.attack(); }
  else if (!(Raid.demo && Raid.demo())) { state.raid.n = 3; Raid.start(false); } // Raid.demo (THREAT hook): &siege=1..4 sets a siege up instead (js/raid.js)
  // the guard sent to meet the raid a little inside the safe zone, and traps laid on the raiders' way to it
  const m = Village.hallMid();
  if (assault) { // the assault, played out; the view on the camp
    for (let i = 0; i < 60 * assault; i++) { state.t += STEP; Village.tick(STEP); Units.tick(STEP); Raid.tick(STEP); Camp.tick(STEP); World.tick(STEP); }
    const c = Village.campMid(); Object.assign(state.cam, World.camOn(c.x, c.y));
  } else {
  const from = state.raid.from, fd = Math.hypot(from.x - m.x, from.y - m.y) || 1, ux = (from.x - m.x) / fd, uy = (from.y - m.y) / fd;
  const stand = { x: m.x + ux * (fd - 9 * 16), y: m.y + uy * (fd - 9 * 16) };
  if (params.get('look') === 'raid') for (let i = -3; i <= 9; i++) for (let j = -5; j <= 5; j++) Village.clearTile(Math.floor((stand.x + ux * i * 16 - uy * j * 16) / 16), Math.floor((stand.y + uy * i * 16 + ux * j * 16) / 16)); // a clearing, so the shot shows the fight
  Units.order(Units.soldiers().map(u => u.id), stand.x, stand.y);
  for (let i = 2; i <= 6; i++) for (const side of [-1, 0, 1]) Raid.layTrap(['spikes', 'tar', 'powder'][(i + side + 3) % 3], Math.floor((from.x - ux * i * 16 - uy * side * 16) / 16), Math.floor((from.y - uy * i * 16 + ux * side * 16) / 16), true);
  Object.assign(state.res, { wood: 340, planks: 126, gold: 196 });
  const secs = Number(params.get('demo')) > 1 ? Number(params.get('demo')) : 12; // ?demo=20: the raid 20 seconds in
  for (let i = 0; i < 60 * secs; i++) { state.t += STEP; Village.tick(STEP); Units.tick(STEP); Raid.tick(STEP); Camp.tick(STEP); World.tick(STEP); }
  Object.assign(state.cam, World.camOn(m.x, m.y + 40));
  if (params.get('look') === 'raid') Object.assign(state.cam, World.camOn(stand.x + ux * 48, stand.y + uy * 48)); // ?look=raid: the view on the guard and the traps
  }
  if (params.has('sel')) ui.selU = Units.soldiers().filter(u => !(u.down > 0)).map(u => u.id);               // ?sel: the guard selected
  if (params.get('look') === 'camp') { const c = Village.campMid(); Object.assign(state.cam, World.camOn(c.x, c.y)); } // ?look=camp: the view on the goblin camp
  if (params.get('look') === 'houses') { const hs = state.buildings.filter(b => b.kind === 'house'), b = hs[2] || hs[0]; Object.assign(state.cam, World.camOn((b.x + 1) * 16, (b.y + 1) * 16)); } // ?look=houses
  if (params.get('place') && B[params.get('place')]) { ui.placing = params.get('place'); mouse.x = 560; mouse.y = 300; } // ?place=cafe: that building on the pointer, at the middle of the view
  City.demo(); Explore.demo(); // what a grown village has of them
  ui.toasts.length = 0; ui.floats.length = 0;
  // ?panel=hero, quests, menu, people or a building's kind (forge, hall, market...): opens that panel, for screenshots of the HUD
  const pn = params.get('panel'), pb = pn && state.buildings.find(b => b.kind === pn);
  if (pb) { ui.sel = pb.uid; ui.panel = 'building'; if (params.get('btab')) { ui.selShown = pb.uid; ui.btab = params.get('btab'); } } else if (pn) ui.panel = pn; // &btab=street: that tab of its panel
  if (pb && params.get('bscroll')) { if (!params.get('btab')) { ui.selShown = pb.uid; ui.btab = null; } UI.scrollTo('bld', Number(params.get('bscroll'))); } // &bscroll=400: its panel scrolled down that far
  if (params.get('tab')) ui.tab = params.get('tab');
}
