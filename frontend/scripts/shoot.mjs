import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs';
import WebSocket from 'ws';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_TO_TEST = process.argv[2] || 'http://localhost:5173';
const OUT = process.argv[3] || '/tmp/iars_shot.png';
const profile = mkdtempSync(join(tmpdir(), 'iars-shot-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  '--remote-debugging-port=9345',
  '--user-data-dir=' + profile,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1440,900',
  'about:blank',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9345/json/version');
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome CDP did not start');
}

let id = 0;
function cdp(ws, method, params, sessionId) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout ' + method)), 30000);
    const onMsg = (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.id === msgId) {
        clearTimeout(timer);
        ws.off('message', onMsg);
        if (m.error) reject(new Error(method + ': ' + m.error.message));
        else resolve(m.result);
      }
    };
    ws.on('message', onMsg);
    ws.send(JSON.stringify({ id: msgId, method: method, params: params, sessionId: sessionId }));
  });
}

const errors = [];
try {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
  const { targetId } = await cdp(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp(ws, 'Target.attachToTarget', { targetId: targetId, flatten: true });
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push(d.exception?.description || d.text || 'unknown exception');
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
      if (m.params.type === 'error') errors.push(text);
    }
  });
  await cdp(ws, 'Runtime.enable', {}, sessionId);
  await cdp(ws, 'Page.enable', {}, sessionId);
  await cdp(ws, 'Page.navigate', { url: URL_TO_TEST }, sessionId);
  await sleep(5000);
  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('SHOT_SAVED ' + OUT);
  ws.close();
} catch (e) {
  console.log('HARNESS_ERROR ' + e.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
