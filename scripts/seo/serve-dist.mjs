// Local artifact server for QA. Production routing is supplied by vercel.json.
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };
createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = decodeURIComponent(url.pathname);
  if (route.endsWith('.html') || (route.length > 1 && route.endsWith('/'))) {
    res.writeHead(308, { Location: route.replace(/\.html$/, '').replace(/\/$/, '') + url.search }); return res.end();
  }
  const file = path.resolve(root, '.' + (route === '/' ? '/index.html' : route));
  if (!file.startsWith(root + path.sep)) { res.writeHead(400); return res.end(); }
  const resolved = [file, file + '.html'].find((name) => fs.existsSync(name) && fs.statSync(name).isFile());
  const target = resolved || path.join(root, '404.html');
  res.writeHead(resolved ? 200 : 404, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', ...(route === '/admin' ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) });
  res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(target));
}).listen(4173, '127.0.0.1', () => console.log('SEO artifact server: http://127.0.0.1:4173'));
