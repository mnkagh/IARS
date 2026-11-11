import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_TO_TEST = process.argv[2] || 'http://localhost:5173';
const profile = mkdtempSync(join(tmpdir(), 'iars-cdp-'));
const port = 9333 + Math.floor(Math.random() * 400);

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome CDP did not start');
}

let id = 0;
function cdp(ws, method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 25000);
    const onMsg = (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.id === msgId) {
        clearTimeout(timer);
        ws.off('message', onMsg);
        m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result);
      }
    };
    ws.on('message', onMsg);
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
}

const errors = [];
const consoleLogs = [];

try {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.on('open', res);
    ws.on('error', rej);
  });

  const { targetId } = await cdp(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp(ws, 'Target.attachToTarget', { targetId, flatten: true });

  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push(d.exception?.description || d.text || 'unknown exception');
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
      consoleLogs.push(`[${m.params.type}] ${text}`);
      if (m.params.type === 'error') errors.push(text);
    }
  });

  await cdp(ws, 'Runtime.enable', {}, sessionId);
  await cdp(ws, 'Log.enable', {}, sessionId);
  await cdp(ws, 'Page.enable', {}, sessionId);
  await cdp(ws, 'Page.navigate', { url: URL_TO_TEST }, sessionId);
  await sleep(4500);

  const { result } = await cdp(
    ws,
    'Runtime.evaluate',
    {
      expression: `JSON.stringify({
        title: document.title,
        rootChildren: document.getElementById('root')?.childElementCount ?? -1,
        text: (document.getElementById('root')?.innerText || '').slice(0, 400),
        h1: document.querySelector('h1')?.innerText ?? null,
        canvases: document.querySelectorAll('canvas').length,
        sliders: document.querySelectorAll('input[type=range]').length,
        buttons: document.querySelectorAll('button').length,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        hasErrorUI: (document.body.innerText||'').includes('Something broke')
      })`,
      returnByValue: true,
    },
    sessionId
  );

  const info = JSON.parse(result.value);
  console.log('--- RENDER REPORT ---');
  console.log(JSON.stringify(info, null, 2));
  console.log('--- CONSOLE ERRORS ---');
  console.log(errors.length ? errors.join('\n') : '(none)');
  ws.close();
} catch (e) {
  console.log('HARNESS ERROR:', e.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}