// PROTOTYPE - NOT FOR PRODUCTION
// Question: Faire tourner les chaînes du village pour armer le héros, puis le voir gagner ses combats et repousser un raid, donne-t-il envie de revenir pendant vingt minutes ?
// Date: 2026-11-21
// The game's languages. French is the source: it is written in data/*.js and data/strings.js and
// never moves. Another language is a set of layers, data/i18n/<lang>/<file>.js, each one a list of
// I18N.add('en', { '<path>': '<text>' }): the path names one text of DATA, the text replaces it.
//
// A path is DATA's keys joined by dots; in an array, [x] is the element whose id is x, or else the
// element at index x: 'chapters[ch0].quests[p1].title', 'venues.cafe.chat[2]'. So adding a quest
// or a lesson shifts nothing. A text that holds the hero's name in French (a getter) stays a
// getter: its translation writes {hero} where the name goes.
//
// A text can also agree with the hero's gender: {g:masculine|feminine} is a hole filled by gendered()
// (js/ui.js) from the chosen hero; I18N.gender does the cutting, and a layer writes its own two forms.
//
// Only words change: ids, rules, numbers and the save are the same in every language. The choice
// is kept apart from the save (localStorage 'aubeval.lang'); ?lang=en in the address imposes one.
// This file loads after config.js and before data/: it picks the language, writes the <script>
// tags of its layers, and I18N.apply() (index.html, after the last data file) lays them on DATA.
// tools/i18n.js extracts the paths and checks the layers: node tools/i18n.js check.
'use strict';

(function (root) {
  const LANGS = ['fr', 'en', 'es'], KEY = 'aubeval.lang';
  // The data files that have a layer, in the order of index.html.
  const FILES = ['world', 'buildings', 'people', 'items', 'cards', 'enemies', 'quests', 'tutorial', 'strings', 'city', 'venues', 'explore'];
  const layers = {};

  /** 'a.b[c][2].d' -> ['a', 'b', '[c]', '[2]', 'd']: a bracketed step looks in an array. */
  function parse(path) {
    const out = [], re = /([^.[\]]+)|\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(path))) out.push(m[1] !== undefined ? m[1] : '[' + m[2] + ']');
    return out;
  }
  /** The key of a step in its parent: an index found by id or by number in an array, else the name. */
  function keyIn(obj, step) {
    if (step[0] !== '[') return step;
    const x = step.slice(1, -1);
    if (!Array.isArray(obj)) return x;
    const i = obj.findIndex(e => e && typeof e === 'object' && e.id === x);
    if (i >= 0) return i;
    return /^\d+$/.test(x) && +x < obj.length ? +x : undefined;
  }
  /** The object that holds the last step of a path, and that step's key; null if the path leads nowhere. */
  function locate(data, path) {
    const steps = parse(path);
    let obj = data;
    for (let i = 0; i < steps.length - 1; i++) {
      const k = keyIn(obj, steps[i]);
      if (k === undefined || obj == null || typeof obj[k] !== 'object' || obj[k] === null) return null;
      obj = obj[k];
    }
    const k = keyIn(obj, steps[steps.length - 1]);
    return k === undefined || obj == null || !(k in obj) ? null : { obj, key: k };
  }
  function get(data, path) { const at = locate(data, path); return at ? at.obj[at.key] : undefined; }
  /** Lays one text on its path. A getter stays a getter, with the hero's name filled in when read. Returns false if the path leads nowhere. */
  function put(data, path, text) {
    const at = locate(data, path);
    if (!at) return false;
    const d = Object.getOwnPropertyDescriptor(at.obj, at.key);
    if (d && d.get) {
      Object.defineProperty(at.obj, at.key, { get() { return typeof root.withHero === 'function' ? root.withHero(text) : text; }, configurable: true, enumerable: true });
    } else at.obj[at.key] = text;
    return true;
  }

  /** Resolves each {g:masculine|feminine} for g 'm' or 'f'; anything else, a malformed hole too, is left as written. */
  function gender(s, g) { return String(s).replace(/\{g:([^|{}]*)\|([^|{}]*)\}/g, (m, a, b) => (g === 'f' ? b : a)); }
  /** True if a {g: is left once the well-formed holes are resolved: a typo in a text. */
  function genderBad(s) { return gender(s, 'm').indexOf('{g:') >= 0; }

  /** The language: the address (?lang=), then the stored choice, then the browser's, else French. */
  function pick(env) {
    env = env || {};
    const search = env.search !== undefined ? env.search : (root.location ? root.location.search : '');
    const ok = l => (l && LANGS.indexOf(l) >= 0 ? l : null);
    const asked = ok(new URLSearchParams(search).get('lang'));
    if (asked) return asked;
    let stored = null;
    try { stored = env.stored ? env.stored() : root.localStorage.getItem(KEY); } catch (e) { stored = null; } // storage blocked: the browser decides
    if (ok(stored)) return stored;
    const nav = env.nav || (root.navigator ? root.navigator.languages || [root.navigator.language] : []);
    for (const l of nav) { const p = ok(String(l || '').slice(0, 2).toLowerCase()); if (p) return p; }
    return 'fr';
  }

  const I18N = {
    langs: LANGS, files: FILES, lang: 'fr', layers,
    parse, get, put, pick, gender, genderBad,
    /** Called by the layer files: adds texts to a language. A null text is one still to translate. */
    add(lang, map) { Object.assign(layers[lang] || (layers[lang] = {}), map); },
    /** Each language's name, in itself: what the language buttons say. */
    names: { fr: 'Français', en: 'English', es: 'Español' },
    /** Lays the chosen language's texts on DATA, and names the page in it. Paths that lead nowhere are listed in the console. */
    apply(data, doc) {
      data = data || root.DATA; doc = doc || root.document;
      const map = layers[I18N.lang];
      if (!map || I18N.lang === 'fr') return 0;
      let n = 0;
      const lost = [];
      for (const p in map) if (map[p] != null) { if (put(data, p, map[p])) n++; else lost.push(p); }
      if (lost.length && root.console) root.console.warn('i18n: ' + lost.length + ' path(s) lead nowhere', lost.slice(0, 10));
      if (doc) { doc.documentElement.lang = I18N.lang; if (data.strings && data.strings.page_title) doc.title = data.strings.page_title; }
      return n;
    },
    /** Switches language: saves the village, keeps the choice, and reloads the page in it. */
    set(lang) {
      if (LANGS.indexOf(lang) < 0 || lang === I18N.lang) return;
      try { if (root.Save) root.Save.persist(); } catch (e) { /* the page saves on hiding too */ }
      try { root.localStorage.setItem(KEY, lang); } catch (e) { /* not kept: the address carries it */ }
      const u = new URL(root.location.href);
      u.searchParams.set('lang', lang);
      root.location.replace(u.toString());
    },
  };
  root.I18N = I18N;

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    I18N.lang = pick();
    document.documentElement.lang = I18N.lang;
    if (I18N.lang !== 'fr') for (const f of FILES) document.write('<script src="data/i18n/' + I18N.lang + '/' + f + '.js"><\/script>');
  }
})(typeof window !== 'undefined' ? window : globalThis);
