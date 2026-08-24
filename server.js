const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const EMPLOYER_PASSCODE = process.env.EMPLOYER_PASSCODE || '2014';
const sessions = new Set();

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return null; }
}
function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${STATE_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(state, null, 2));
  fs.renameSync(temp, STATE_FILE);
}
function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 8 * 1024 * 1024) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}
function safeState(state) {
  return state && Array.isArray(state.addresses) && Array.isArray(state.users) ? state : null;
}
function serveFile(req, res) {
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.resolve(ROOT, `.${requested}`);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
  send(res, 200, fs.readFileSync(file), types[path.extname(file)] || 'application/octet-stream');
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url.split('?')[0] === '/api/state') return send(res, 200, readState() || {});
    if (req.method === 'PUT' && req.url === '/api/state') {
      const state = safeState(await readBody(req));
      if (!state) return send(res, 400, { error: 'Invalid tracker state' });
      writeState(state);
      return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }
    if (req.method === 'POST' && req.url === '/api/employer/login') {
      const body = await readBody(req);
      if (String(body.passcode || '') !== EMPLOYER_PASSCODE) return send(res, 401, { error: 'Incorrect passcode' });
      const token = crypto.randomBytes(24).toString('hex');
      sessions.add(token);
      return send(res, 200, { token });
    }
    if (req.method === 'GET' && req.url === '/api/employer/report') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token || !sessions.has(token)) return send(res, 401, { error: 'Employer authentication required' });
      return send(res, 200, readState() || {});
    }
    if (req.method === 'GET') return serveFile(req, res);
    send(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`FlyerTrack running at http://localhost:${PORT}`));
