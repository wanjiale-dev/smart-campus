/**
 * 零依赖 Mock 后端（Node 自带 http，无需 npm install）
 * 启动：node server/app.js  或  npm start
 * 同时做两件事：
 * 1. 提供 /api/* 接口，返回结构与前端本地 mock 完全一致
 * 2. 静态托管 ../frontend，浏览器访问 http://localhost:3000 即可看到界面
 *
 * 数据持久化到 server/data/db.json，删除该文件即恢复 seed 数据。
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('../frontend/js/mock/core.js');

const ROOT = path.join(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT || 3000);

function loadSeed() {
  const code = fs.readFileSync(path.join(FRONTEND, 'js', 'mock', 'seed.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: 'seed.js' });
  return sandbox.window.MOCK_SEED;
}

function createStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return Core.createStore(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    } catch (error) {
      console.warn('[warn] db.json 解析失败，使用 seed 数据：', error.message);
    }
  }
  return Core.createStore(loadSeed());
}

let store = createStore();

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store.getState(), null, 2), 'utf8');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (error) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function serveStatic(res, pathname) {
  let relative = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(FRONTEND, relative));
  if (!filePath.startsWith(FRONTEND)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + relative);
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  let pathname = url.pathname;
  try { pathname = decodeURIComponent(pathname); } catch (error) { /* 保持原样 */ }

  if (!pathname.startsWith('/api/')) {
    return serveStatic(res, pathname);
  }

  const apiPath = pathname.slice(4); // '/students'、'/messages/read-all'
  if (apiPath === '/health') {
    return sendJson(res, 200, { code: 0, data: { status: 'up', mode: 'remote' }, message: 'ok' });
  }

  const auth = req.headers.authorization || '';
  if (apiPath !== '/auth/login' && !auth.startsWith('Bearer ')) {
    return sendJson(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
  }

  const method = req.method.toUpperCase();
  let payload;
  if (method === 'GET') {
    payload = {};
    url.searchParams.forEach((value, key) => { payload[key] = value; });
  } else {
    payload = await readBody(req);
  }

  try {
    const result = store.handle(method, apiPath, payload);
    if (method !== 'GET') persist();
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('[api error]', method, apiPath, error);
    return sendJson(res, 500, { code: 500, data: null, message: '服务器内部错误：' + error.message });
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  智慧校园综合管理平台 · Mock 后端已启动');
  console.log('  页面地址：http://localhost:' + PORT);
  console.log('  接口地址：http://localhost:' + PORT + '/api/health');
  console.log('  数据文件：' + DATA_FILE);
  console.log('');
});
