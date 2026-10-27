// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js
// Exits non-zero on any failed assertion; fails on page console errors.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9343;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?test=1';
let failures = 0;
let count = 0;
const pageErrors = [];
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/dhadha-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };

  check('page title contains Dhadha', (await ev('document.title'))?.includes('Dhadha'));
  check('riddle card renders with a question', (await ev(`document.getElementById('question').textContent.trim().length`)) > 10);
  check('category badge non-empty', (await ev(`document.getElementById('catBadge').textContent.trim().length`)) > 0);
  check('test hooks present', (await ev(`typeof window.__dhadha.setRiddle`)) === 'function');

  // Correct answer via test hook -> score increases + correct message.
  await ev(`window.__dhadha.setRiddle('animal-01')`);
  const scoreBefore = await ev(`window.__dhadha.state().score`);
  const answer = await ev(`window.__dhadha.state().answer`);
  check('hook exposes an answer', typeof answer === 'string' && answer.length > 0, String(answer));
  await ev(`window.__dhadha.submit(${JSON.stringify(answer)})`);
  check('correct answer increases score', (await ev(`window.__dhadha.state().score`)) > scoreBefore);
  check('correct answer shows a success message', await poll(async () => {
    const msg = await ev(`document.getElementById('message').textContent`);
    return /Correct/.test(msg);
  }, 3000));
  check('correct answer counts as played + correct', (await ev(`window.__dhadha.state().played`)) >= 1 &&
    (await ev(`window.__dhadha.state().correct`)) >= 1);

  // Wrong answer -> tries message + attempts increment.
  await ev(`window.__dhadha.setRiddle('food-01')`);
  const attemptsBefore = await ev(`window.__dhadha.state().attempts`);
  await ev(`window.__dhadha.submit('zzzz-not-an-answer')`);
  check('wrong answer increments attempts', (await ev(`window.__dhadha.state().attempts`)) === attemptsBefore + 1);
  check('wrong answer shows a try-again message', await poll(async () => {
    const msg = await ev(`document.getElementById('message').textContent`);
    return /try again/i.test(msg);
  }, 3000));

  // Hint reveals hint text; reveal shows the answer.
  await ev(`document.getElementById('hintBtn').click()`);
  check('hint button reveals hint text', await poll(async () =>
    (await ev(`document.getElementById('hintText').textContent.trim().length`)) > 3, 3000));
  check('hint button disabled after use', (await ev(`document.getElementById('hintBtn').disabled`)) === true);
  await ev(`document.getElementById('revealBtn').click()`);
  check('reveal shows the answer', await poll(async () =>
    (await ev(`document.getElementById('answerText').textContent.trim().length`)) > 0, 3000));
  check('reveal marks riddle resolved', (await ev(`window.__dhadha.state().resolved`)) === true);

  // Category filter narrows: animals only.
  await ev(`document.getElementById('category').value = 'animals'`);
  await ev(`document.getElementById('category').dispatchEvent(new Event('change'))`);
  await wait(400);
  check('category filter narrows to animals', (await ev(`window.__dhadha.state().category`)) === 'animals');

  // Empty state: body + hard has no riddles.
  await ev(`document.getElementById('category').value = 'body'`);
  await ev(`document.getElementById('category').dispatchEvent(new Event('change'))`);
  await ev(`document.getElementById('difficulty').value = 'hard'`);
  await ev(`document.getElementById('difficulty').dispatchEvent(new Event('change'))`);
  await wait(400);
  check('empty filter shows empty state', (await ev(`document.getElementById('emptyState').hidden`)) === false &&
    (await ev(`document.getElementById('riddleCard').hidden`)) === true);

  // Back to all/all, then language toggle -> lang=bn + Bengali digits in a stat.
  await ev(`document.getElementById('category').value = 'all'`);
  await ev(`document.getElementById('category').dispatchEvent(new Event('change'))`);
  await ev(`document.getElementById('difficulty').value = 'all'`);
  await ev(`document.getElementById('difficulty').dispatchEvent(new Event('change'))`);
  await ev(`document.getElementById('langBtn').click()`);
  check('html lang switches to bn', (await ev(`document.documentElement.lang`)) === 'bn');
  check('lang button now reads English', (await ev(`document.getElementById('langBtn').textContent`)) === 'English');
  check('score stat uses Bengali digits', /[\u09e6-\u09ef]/.test(String(await ev(`document.getElementById('statScore').textContent`))), String(await ev(`document.getElementById('statScore').textContent`)));
  check('question re-rendered in BN mode', (await ev(`document.getElementById('question').textContent.trim().length`)) > 10);
  check('stats persist in localStorage', typeof (await ev(`localStorage.getItem('dhadha-bd-v1')`)) === 'string');

  // 390px mobile check via emulation.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(600);
  const overflow = await ev(`document.documentElement.scrollWidth > 390 + 5`);
  check('390px viewport: no horizontal overflow', overflow === false, 'scrollWidth exceeded');
  check('no page console/exception errors', pageErrors.length === 0, pageErrors.join(' | '));

  ws.close(); chrome.kill();
  console.log('SMOKE CHECKS: ' + count + ', FAILURES: ' + failures);
  console.log(failures === 0 ? 'SMOKE GREEN' : 'SMOKE FAILURES: ' + failures);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('SMOKE HARNESS ERROR', e); process.exit(2); });
