// Records a scripted battle, frame by frame, for docs/combat.gif: node tools/record-combat.js <frames-dir>
// (python tools/make_combat_gif.py runs this, then builds the GIF.)
// Headless Chrome opens the game in its manual mode (?manual=1: the loop stops, window.game.step() advances it a
// step at a time), so the recording is deterministic and runs as fast as the machine can draw. The hero plays a
// couple of cards, ends the turn, and parries every blow dead on (Space the instant the ring touches the circle).
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'aubeval-combat'));
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found: set CHROME to its path');

const STEPS_PER_FRAME = 4;  // 60 steps a second / 4 = 15 frames a second
const QUERY = 'scene=battle&demo=1&manual=1&render=cheap&music=0';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'aubeval-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,720',
    '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1', '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  try {
    let targets;
    for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
    const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
    let id = 0; const wait = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
    const send = (method, params = {}) => new Promise(r => { wait.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
    const run = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception || r.result.exceptionDetails));
      return r.result.result.value;
    };

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${base}/index.html?${QUERY}` });
    for (let i = 0; i < 120 && !(await run('typeof Battle !== "undefined" && !!Battle.peek && !!window.game')); i++) await sleep(250);
    await sleep(1500); // the images load by themselves; let them arrive

    // In the page: advance n steps, pressing Space on the blow the moment it lands (a perfect parry), then draw once.
    await run(`window.adv = n => {
      for (let i = 0; i < n; i++) { const b = Battle.peek.blow; if (b && !b.res && b.t >= -0.02) game.press('Space'); game.step(1, false); }
      game.step(0, true);
      const b = Battle.peek; return { phase: b.phase, energy: b.energy, hand: b.hand.length, round: b.round };
    };
    window.shot = () => document.getElementById('game').toDataURL('image/png');`);

    fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
    let n = 0;
    const grab = async () => {
      const url = await run('shot()');
      fs.writeFileSync(path.join(OUT, `f${String(n++).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    };

    // Play through to the hero's turn.
    let s = await run('adv(0)');
    for (let i = 0; i < 600 && s.phase !== 'play'; i++) s = await run(`adv(${STEPS_PER_FRAME})`);
    for (let i = 0; i < 10; i++) { s = await run(`adv(${STEPS_PER_FRAME})`); await grab(); } // the hand, as the turn opens

    // Cards: play the first playable ones (a card that does not spend Souffle was refused: try the next).
    let idx = 0, played = 0;
    while (s.phase === 'play' && s.energy > 0 && played < 2 && idx < s.hand) {
      const before = s.energy;
      await run(`game.press('Digit${idx + 1}')`);
      for (let i = 0; i < 12; i++) { s = await run(`adv(${STEPS_PER_FRAME})`); await grab(); }
      if (s.energy < before) played++; else idx++;
    }
    for (let i = 0; i < 6; i++) { s = await run(`adv(${STEPS_PER_FRAME})`); await grab(); }
    await run(`game.press('Enter')`);

    // The enemies' turn, every blow parried; stop on the next turn's opening.
    for (let i = 0; i < 900 && s.round === 1; i++) { s = await run(`adv(${STEPS_PER_FRAME})`); await grab(); }
    for (let i = 0; i < 12; i++) { s = await run(`adv(${STEPS_PER_FRAME})`); await grab(); }
    console.log(`${n} frames in ${OUT}`);
    ws.close();
  } finally {
    chrome.kill(); server.close();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold it */ }
  }
}
main().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
