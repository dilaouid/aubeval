// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-19
// Text, numbers, buttons and panels. Screens draw with these every frame; each button registers
// a clickable region, and the next step sends the waiting clicks to the regions (UI.click).
'use strict';

/**
 * The hero's name, as the player chose it (state.hero.name), or the default before a game is under way.
 * of: with « de » before it, elided before a vowel or a mute h (« d’Aldric », « de Bertrand »).
 */
function heroName(of) {
  const n = (typeof state !== 'undefined' && state && state.hero && state.hero.name) || DATA.hero.name;
  return of ? (/^[aeiouyhàâäéèêëîïôöûüÿæœ]/i.test(n) ? 'd’' : 'de ') + n : n;
}
/** Fills {hero} and {de_hero} in a line of text. */
function withHero(s) { return s.indexOf('_hero}') < 0 && s.indexOf('{hero}') < 0 ? s : s.split('{de_hero}').join(heroName(true)).split('{hero}').join(heroName()); }
/** A string from data/strings.js, with {holes} filled from vars, and the hero's name in its place. */
function tr(key, vars) {
  let s = DATA.strings[key];
  if (s == null) return key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return typeof s === 'string' ? withHero(s) : s;
}
/** Big numbers keep short names: 12 400 -> "12,4 k". */
function fmt(n) {
  n = Math.floor(n + 1e-6);
  if (n < 10000) return String(n);
  const units = ['k', 'M', 'Md', 'Bn', 'Tn'];
  let i = -1, x = n;
  while (x >= 1000 && i < units.length - 1) { x /= 1000; i++; }
  return (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : x.toFixed(0)).replace('.', ',') + ' ' + units[i];
}
function fmtRate(r) { return (r >= 0 ? '+' : '−') + (Math.abs(r) < 100 ? Math.abs(r).toFixed(1).replace('.', ',') : fmt(Math.abs(r))) + '/s'; }
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  if (s >= 3600) return Math.floor(s / 3600) + ' h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0');
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function fmtNum(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }

const UI = (() => {
  // Dark walnut and brass, the colours of the PixelLab HUD kit; the flat look below is only drawn
  // while its images load, or when one is missing.
  const C = {
    bg: '#2a1a10', bg2: '#3d2616', line: '#140d08', lineL: '#8f5f1c', text: '#f6eedb', dim: '#c9b79a',
    gold: '#ffd75e', good: '#9be85f', bad: '#ff7a6a', accent: '#ffa154', ink: '#140d08',
    btn: '#553520', btnH: '#6e4529', btnP: '#b8402a', btnPH: '#e0662f', dis: '#3a3530',
  };
  /**
   * The HUD kit (assets/sprites/ui/, made by imagegen/pixellab/ui/install_ui.py): each look is a
   * sprite 'ui.<look>' drawn as a 9-slice at the world's pixel size. Its corners stay as they are,
   * its edges and middle repeat. Insets in art pixels, [left, top, right, bottom], by the look's
   * first word: 'button_hover' uses 'button'.
   */
  const SKIN = {
    panel: [14, 14, 14, 14], plate: [6, 6, 6, 6], button: [6, 6, 6, 6], tab: [6, 6, 6, 5],
    card: [14, 12, 14, 12], topbar: [46, 13, 46, 13], bottombar: [10, 10, 10, 10],
  };
  const ready = id => Art.loaded(id); // an image still loading, or never listed, is not drawn: the flat look stands in
  const slices = new Map(); // 'look WxH' (art pixels) -> { src, cv }: the 9-slice painted at that size from that image
  function paintNine(img, [l, t, r, b], aw, ah) {
    const cv = document.createElement('canvas'); cv.width = aw; cv.height = ah;
    const g = cv.getContext('2d'), iw = img.width, ih = img.height;
    if (l + r > aw) l = r = Math.floor(aw / 2); // smaller than its corners: the corners meet
    if (t + b > ah) t = b = Math.floor(ah / 2);
    const sw = iw - l - r, sh = ih - t - b, dw = aw - l - r, dh = ah - t - b;
    const tile = (sx, sy, sW, sH, dx, dy, dW, dH) => { // repeats a source piece over a box, cutting the last copy
      if (dW <= 0 || dH <= 0) return;
      if (sW <= 0 || sH <= 0) { g.drawImage(img, sx, sy, Math.max(1, sW), Math.max(1, sH), dx, dy, dW, dH); return; }
      for (let y = 0; y < dH; y += sH) for (let x = 0; x < dW; x += sW) {
        const w = Math.min(sW, dW - x), h = Math.min(sH, dH - y);
        g.drawImage(img, sx, sy, w, h, dx + x, dy + y, w, h);
      }
    };
    g.drawImage(img, 0, 0, l, t, 0, 0, l, t); g.drawImage(img, iw - r, 0, r, t, aw - r, 0, r, t);
    g.drawImage(img, 0, ih - b, l, b, 0, ah - b, l, b); g.drawImage(img, iw - r, ih - b, r, b, aw - r, ah - b, r, b);
    tile(l, 0, sw, t, l, 0, dw, t); tile(l, ih - b, sw, b, l, ah - b, dw, b);
    tile(0, t, l, sh, 0, t, l, dh); tile(iw - r, t, r, sh, aw - r, t, r, dh);
    tile(l, t, sw, sh, l, t, dw, dh);
    return cv;
  }
  /** Draws a look of the kit over a box. False when its image is not there (the caller draws the flat look). */
  function nine(look, x, y, w, h) {
    const id = 'ui.' + look;
    if (!ready(id)) return false;
    const aw = Math.max(2, Math.round(w / PX)), ah = Math.max(2, Math.round(h / PX)), key = look + ' ' + aw + 'x' + ah;
    const src = Art.get(id);
    let e = slices.get(key);
    if (!e || e.src !== src) { if (slices.size > 500) slices.clear(); e = { src, cv: paintNine(src, SKIN[look.split('_')[0]], aw, ah) }; slices.set(key, e); }
    blit(e.cv, x + (w - aw * PX) / 2, y + (h - ah * PX) / 2);
    return true;
  }
  /** An icon centred on a point, `size` logical pixels wide: 32 (the world's pixel size) or 16. */
  function icon(id, cx, cy, size = 16) {
    if (!ready(id)) return;
    ctx.drawImage(Art.get(id), snap(cx - size / 2), snap(cy - size / 2), size, size);
  }
  let regions = [], tip = null, clipR = null, areas = [], boxNow = null; // boxNow: the scrolling box being drawn, { st, y, h }
  const scrolls = {}; // a scrolling box's id -> { y: how far it is scrolled, max: how far it can go }

  function begin() { regions = []; tip = null; areas = []; clipR = null; }
  function over(x, y, w, h) { return mouse.x >= x && mouse.x < x + w && mouse.y >= y && mouse.y < y + h; }
  /** A clickable area. Later regions sit on top. Returns true while the pointer is over it. Inside a scrolling box, only its visible part counts. */
  function region(x, y, w, h, onClick, tipText) {
    if (clipR) { // cut to the box: a button scrolled out of sight is never clicked
      const x0 = Math.max(x, clipR.x), y0 = Math.max(y, clipR.y), x1 = Math.min(x + w, clipR.x + clipR.w), y1 = Math.min(y + h, clipR.y + clipR.h);
      if (x1 <= x0 || y1 <= y0) return false;
      x = x0; y = y0; w = x1 - x0; h = y1 - y0;
    }
    regions.push({ x, y, w, h, onClick });
    const hov = over(x, y, w, h);
    if (hov && tipText) tip = tipText;
    return hov;
  }
  /** The part of a box that shows: the box itself, or what a scrolling box leaves of it; null when nothing does. */
  function visible(x, y, w, h) {
    if (!clipR) return { x, y, w, h };
    const x0 = Math.max(x, clipR.x), y0 = Math.max(y, clipR.y), x1 = Math.min(x + w, clipR.x + clipR.w), y1 = Math.min(y + h, clipR.y + clipR.h);
    return x1 <= x0 || y1 <= y0 ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function hitAt(x, y) {
    for (let i = regions.length - 1; i >= 0; i--) { const r = regions[i]; if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r; }
    return null;
  }
  /**
   * A box whose content scrolls with the wheel when it is taller than the box. `draw(top)` draws
   * the content from the y it is given and returns the y under its last line. A scrollbar shows
   * when there is more than fits; buttons outside the box are neither drawn nor clicked.
   */
  function scrollBox(id, x, y, w, h, draw) {
    const st = scrolls[id] || (scrolls[id] = { y: 0, max: 0 });
    st.y = clamp(st.y, 0, st.max);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const prev = clipR, prevBox = boxNow; clipR = { x, y, w, h }; boxNow = { st, y, h };
    const bottom = draw(y - st.y);
    clipR = prev; boxNow = prevBox; ctx.restore();
    st.max = Math.max(0, Math.ceil(bottom + st.y - (y + h) + 10));
    st.y = clamp(st.y, 0, st.max);
    areas.push({ id, x, y, w, h });
    if (st.max > 0) { // the scrollbar: a brass thumb in a dark groove
      const th = Math.max(30, h * h / (h + st.max)), ty = y + (h - th) * st.y / st.max;
      ctx.fillStyle = 'rgba(20,13,8,0.7)'; ctx.fillRect(x + w + 4, y, 6, h);
      ctx.fillStyle = '#8f5f1c'; ctx.fillRect(x + w + 4, ty, 6, th); ctx.fillStyle = C.gold; ctx.fillRect(x + w + 5, ty + 1, 2, th - 2);
      if (st.y < st.max) { ctx.fillStyle = 'rgba(20,13,8,0.55)'; ctx.fillRect(x, y + h - 6, w, 6); } // more below
    }
    return st.max > 0;
  }
  /** Scrolls the box being drawn so that this rectangle shows from the next frame on (the tutorial's arrow on a button below the fold). */
  function reveal(x, y, w, h) {
    if (!boxNow) return;
    const b = boxNow;
    if (y < b.y) b.st.y = Math.max(0, b.st.y - (b.y - y) - 8);
    else if (y + h > b.y + b.h) b.st.y += y + h - (b.y + b.h) + 8;
  }
  /** Scrolls a box down to `y` pixels (as far as it goes): the page's ?bscroll= option, for screenshots. */
  function scrollTo(id, y) { scrolls[id] = { y, max: y }; }
  /** The wheel turned over a scrolling box: it scrolls. False when no box is under the pointer. */
  function scroll(x, y, notches) {
    for (let i = areas.length - 1; i >= 0; i--) {
      const a = areas[i];
      if (x < a.x || x >= a.x + a.w + 12 || y < a.y || y >= a.y + a.h) continue;
      const st = scrolls[a.id]; if (!st.max) return true; // nothing to scroll, but the wheel stays on the panel
      st.y = clamp(st.y + notches * 48, 0, st.max); return true;
    }
    return false;
  }
  /** Puts a scrolling box back at its top (a new building chosen, another tab). */
  function scrollTop(id) { if (scrolls[id]) scrolls[id].y = 0; }
  /** Sends a click to the topmost region under it. False when it fell on the world. */
  function click(x, y) { const r = hitAt(x, y); if (!r) return false; if (r.onClick) r.onClick(); return true; }

  function box(x, y, w, h, fill = C.bg, line = C.line) {
    ctx.fillStyle = line; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }
  /** Text with a one-pixel dark shadow under it, for text on wood. */
  function label(s, x, y, size, color, align = 'center', bold = true) {
    text(s, x + 1, y + 1, size, C.ink, align, bold); text(s, x, y, size, color, align, bold);
  }
  /** A small dark plate (tooltips, toasts, the quest and raid boxes). `tone` tints it: 'bad' for danger. */
  function plate(x, y, w, h, tone) {
    if (!nine('plate', x, y, w, h)) box(x, y, w, h, 'rgba(42,26,16,0.94)', C.lineL);
    if (tone === 'bad') { ctx.fillStyle = 'rgba(190,40,28,0.6)'; ctx.fillRect(x + 8, y + 8, w - 16, h - 16); }
  }
  function panel(x, y, w, h, title, onClose) {
    region(x, y, w, h, null);
    if (!nine('panel', x, y, w, h)) box(x, y, w, h, C.bg, C.lineL);
    if (title) {
      label(title, x + 26, y + 30, 20, C.gold, 'left');
      ctx.fillStyle = C.lineL; ctx.fillRect(x + 22, y + 46, w - 44, 2); ctx.fillStyle = C.ink; ctx.fillRect(x + 22, y + 48, w - 44, 2);
      if (onClose) button(x + w - 54, y + 14, 34, 32, '×', onClose, { size: 22, tip: 'Fermer (Échap)' });
    }
  }
  /**
   * A button. o: disabled, primary (the call to act), on (chosen), size (text), tip, icon (an
   * icon id: drawn at 32 left of the label, or alone in the middle when the label is empty).
   */
  function button(x, y, w, h, lab, onClick, o = {}) {
    const hov = region(x, y, w, h, o.disabled ? () => sfx('error') : () => { sfx('click'); onClick(); }, o.tip);
    const press = hov && mouse.down && !o.disabled;
    const look = o.disabled ? 'button_disabled' : press ? 'button_pressed' : o.primary ? (hov ? 'button_primary_hover' : 'button_primary') : o.on ? 'button_on' : hov ? 'button_hover' : 'button';
    if (!nine(look, x, y, w, h)) {
      const fill = o.disabled ? C.dis : o.primary ? (hov ? C.btnPH : C.btnP) : o.on ? C.btnH : (hov ? C.btnH : C.btn);
      box(x, y, w, h, fill, o.disabled ? C.line : o.on ? C.gold : C.lineL);
    }
    const dy = press ? 2 : 0, col = o.disabled ? C.dim : o.on ? C.gold : C.text, size = o.size || 16;
    if (o.icon) {
      const isz = o.isz || (lab ? 16 : h >= 40 ? 32 : 16);
      if (!lab) { icon(o.icon, x + w / 2, y + h / 2 + dy, isz); return hov; }
      const tw = width(lab, size, true), x0 = x + w / 2 - (tw + isz + 6) / 2;
      ctx.globalAlpha = o.disabled ? 0.5 : 1; icon(o.icon, x0 + isz / 2, y + h / 2 + dy, isz); ctx.globalAlpha = 1;
      label(lab, x0 + isz + 6, y + h / 2 + 1 + dy, size, col, 'left');
      return hov;
    }
    label(lab, x + w / 2, y + h / 2 + 1 + dy, size, col, 'center');
    return hov;
  }
  /** A tab: a button with a rounded top, gold when it is the open one. */
  function tab(x, y, w, h, lab, onClick, on, o = {}) {
    const hov = region(x, y, w, h, () => { sfx('click'); onClick(); }, o.tip);
    if (!nine(on ? 'tab_on' : hov ? 'tab_hover' : 'tab', x, y, w, h)) box(x, y, w, h, on ? C.btnH : hov ? C.btnH : C.btn, on ? C.gold : C.lineL);
    const size = o.size || 14, col = on ? C.gold : C.text;
    if (o.icon) {
      const tw = width(lab, size, true), x0 = x + w / 2 - (tw + 22) / 2;
      icon(o.icon, x0 + 8, y + h / 2 + 1, 16); label(lab, x0 + 22, y + h / 2 + 1, size, col, 'left');
    } else label(lab, x + w / 2, y + h / 2 + 1, size, col, 'center');
    return hov;
  }
  /** Word-wrapped text. `align` 'center' makes x the middle of the block. Returns the y under the last line. */
  function wrap(str, x, y, maxW, size, color, lineH, bold, align = 'left') {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
    lineH = lineH || Math.round(size * 1.35);
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width > maxW && line) { text(line, x, y + lineH / 2, size, color, align, bold); y += lineH; line = word; }
        else line = t;
      }
      text(line, x, y + lineH / 2, size, color, align, bold); y += lineH;
    }
    return y;
  }
  function width(str, size, bold) { ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; return ctx.measureText(str).width; }
  /** A sprite with its top-left at a logical point. scale 2 is the world's pixel size (the usual). */
  function sprite(id, x, y, scale = 2, frame = 0) { blit(Art.get(id, frame), x, y, scale / 2); }
  /** A gauge in a dark wooden groove with a brass rim; `ghost` is a pale trail behind a falling value. */
  function bar(x, y, w, h, frac, color, ghost) {
    ctx.fillStyle = C.ink; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#8f5f1c'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    const iw = w - 6, ih = h - 6;
    if (ghost != null) { ctx.fillStyle = '#fff0b0'; ctx.fillRect(x + 3, y + 3, Math.round(iw * clamp(ghost, 0, 1)), ih); }
    const fw = Math.round(iw * clamp(frac, 0, 1));
    ctx.fillStyle = color; ctx.fillRect(x + 3, y + 3, fw, ih);
    if (fw > 0 && ih > 3) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x + 3, y + 3, fw, Math.max(1, Math.floor(ih / 3))); } // the shine on top
  }
  /** A price: icon and amount for each resource, red when the stock is short. Returns the x after it. */
  function cost(c, x, y, o = {}) {
    const size = o.size || 15, gap = o.gap || 10;
    for (const r in c) {
      icon(DATA.resources[r].icon, x + 8, y, 16);
      const ok = o.plain || state.res[r] >= c[r];
      text(fmt(c[r]), x + 20, y + 1, size, ok ? C.text : C.bad, 'left', true);
      x += 20 + width(fmt(c[r]), size, true) + gap;
    }
    return x;
  }
  function end() { // the tooltip, over everything
    if (!tip) return;
    ctx.font = `15px ${FONT}`;
    const lines = [];
    for (const para of tip.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width > 320 && line) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 32, h = lines.length * 21 + 24;
    const x = clamp(mouse.x + 16, 4, W - w - 4), y = clamp(mouse.y - h - 10, 4, H - h - 4);
    plate(x, y, w, h);
    lines.forEach((l, i) => text(l, x + 16, y + 23 + i * 21, 15, i === 0 ? C.gold : C.text, 'left', i === 0));
  }
  return { C, begin, end, region, visible, over, hitAt, click, box, plate, label, panel, button, tab, nine, icon, ready, wrap, width, sprite, bar, cost, scrollBox, scroll, scrollTop, scrollTo, reveal };
})();
