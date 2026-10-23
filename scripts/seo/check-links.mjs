// Opt-in network checks; blocked bots/timeouts are reported separately from dead links.
import fs from 'node:fs';
import { parse } from 'parse5';
const site = JSON.parse(fs.readFileSync('content/site.json'));
const refs = new Map();
for (const file of fs.readdirSync('content/pages')) {
  if (!file.endsWith('.md')) continue;
  const raw = fs.readFileSync('content/pages/' + file, 'utf8');
  for (const match of raw.matchAll(/https?:\/\/[^\s"<>)]+/g)) {
    const url = match[0];
    if (new URL(url).origin === site.url) continue;
    if (!refs.has(url)) refs.set(url, []);
    refs.get(url).push(file);
  }
}
const results = [];
const queue = [...refs];
async function worker() {
  while (queue.length) {
    const [url, files] = queue.shift();
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Northmark SEO link audit (public website reference check)' } });
      const html = await response.text();
      const tree = parse(html);
      const nodes = (n) => [n, ...(n.childNodes || []).flatMap(nodes)];
      const title = nodes(tree).find((n) => n.tagName === 'title');
      const text = (n) => n?.value || (n?.childNodes || []).map(text).join('');
      results.push({ url, status: response.status, finalUrl: response.url, title: text(title).trim(), files: [...new Set(files)] });
    } catch (error) { results.push({ url, status: null, error: error.message, files: [...new Set(files)] }); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
results.sort((a, b) => a.url.localeCompare(b.url));
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/external-links.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(JSON.stringify({ checked: results.length, issues: results.filter((r) => !r.status || r.status >= 400 || r.finalUrl !== r.url) }, null, 2));
if (results.some((r) => r.status === 404 || r.status === 410)) process.exitCode = 1;
