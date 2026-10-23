// Read-only post-deployment audit. A sitemap submission does not prove indexing.
import fs from 'node:fs';
import { parse } from 'parse5';
const origin = 'https://northmarkfacilityservices.com';
const base = process.env.SEO_BASE_URL || origin;
const paths = [...fs.readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const results = [];
const queue = [...paths];
const nodes = (n) => [n, ...(n.childNodes || []).flatMap(nodes)];
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
async function check(route) {
  try {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    const tree = nodes(parse(html));
    const canonical = tree.filter((n) => n.tagName === 'link' && attr(n, 'rel') === 'canonical').map((n) => attr(n, 'href'));
    const h1s = tree.filter((n) => n.tagName === 'h1').length;
    const noindex = tree.some((n) => n.tagName === 'meta' && attr(n, 'name') === 'robots' && /noindex/.test(attr(n, 'content'))) || /noindex/.test(response.headers.get('x-robots-tag') || '');
    const ok = response.status === 200 && canonical.length === 1 && canonical[0] === origin + route && h1s === 1 && !noindex;
    results.push({ route, status: response.status, canonical, h1s, noindex, ok });
  } catch (error) { results.push({ route, ok: false, error: error.message }); }
}
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await check(queue.shift()); }));
const resources = [];
for (const route of ['/sitemap.xml', '/robots.txt', '/exploring', '/exploring/sitemap.xml', '/nonexistent-seo-audit-check']) {
  try {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
    const body = await response.text();
    resources.push({ route, status: response.status, contentType: response.headers.get('content-type'), ...(route.includes('sitemap') ? { urls: (body.match(/<loc>/g) || []).length } : {}), ...(body.includes('Invalid proxy proof') ? { issue: 'Invalid proxy proof' } : {}) });
  } catch (error) { resources.push({ route, error: error.message }); }
}
results.sort((a, b) => a.route.localeCompare(b.route));
const report = { checkedAt: new Date().toISOString(), base, routes: results.length, passed: results.filter((r) => r.ok).length, results, resources, indexingVerified: false };
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/live-seo.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ routes: report.routes, passed: report.passed, resources }, null, 2));
if (report.passed !== report.routes || resources.find((r) => r.route === '/nonexistent-seo-audit-check')?.status !== 404) process.exitCode = 1;
