// Verify the deployable HTML, not just the content inputs. This is a build gate.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(root, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(root, 'content/site.json')));
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const all = walk(dist).filter((file) => !path.relative(dist, file).startsWith('.vite/'));
const errors = [];
const warnings = [];
const documents = new Map();
const fail = (route, message) => errors.push(`${route}: ${message}`);
const nodes = (node) => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const text = (node) => node.value || (node.childNodes || []).map(text).join('');
const seen = { title: new Map(), description: new Map(), h1: new Map() };
for (const file of all.filter((f) => f.endsWith('.html'))) {
  const route = file === path.join(dist, 'index.html') ? '/' : '/' + path.relative(dist, file).replaceAll(path.sep, '/').replace(/\.html$/, '');
  const html = fs.readFileSync(file, 'utf8');
  const tree = nodes(parse(html));
  const find = (tag) => tree.filter((n) => n.tagName === tag);
  const meta = (name) => find('meta').filter((n) => attr(n, 'name') === name || attr(n, 'property') === name);
  const noindex = meta('robots').some((n) => /\bnoindex\b/.test(attr(n, 'content')));
  const canonicals = find('link').filter((n) => attr(n, 'rel') === 'canonical');
  const expected = site.url + route;
  const ids = new Set();
  for (const node of tree) {
    const id = attr(node, 'id');
    if (id) { if (ids.has(id)) fail(route, `duplicate id #${id}`); ids.add(id); }
  }
  const h1 = find('h1');
  if (/<!--app:start-->/.test(html)) fail(route, 'app content was not rendered');
  if (h1.length !== 1) fail(route, `expected one H1, found ${h1.length}`);
  if (!find('main').length && !tree.some((n) => attr(n, 'role') === 'main')) fail(route, 'missing main landmark');
  if (attr(find('html')[0], 'lang') !== 'en') fail(route, 'missing English document language');
  if (find('title').length !== 1) fail(route, 'expected one title');
  if (meta('description').length !== 1) fail(route, 'expected one description');
  if (!meta('viewport').length) fail(route, 'missing responsive viewport');
  if (!meta('robots').length) fail(route, 'missing robots directive');
  if (noindex) {
    if (canonicals.length) fail(route, 'excluded route must not advertise an indexable canonical');
  } else {
    if (canonicals.length !== 1 || attr(canonicals[0], 'href') !== expected) fail(route, 'canonical must equal the production URL');
    const title = text(find('title')[0]);
    const description = attr(meta('description')[0], 'content');
    for (const [kind, value] of Object.entries({ title, description, h1: h1[0] ? text(h1[0]).trim().replace(/\s+/g, ' ') : '' })) {
      if (!value) fail(route, `missing ${kind}`);
      if (seen[kind].has(value)) fail(route, `duplicate ${kind} with ${seen[kind].get(value)}`);
      seen[kind].set(value, route);
    }
    for (const [name, expectedValue] of [['og:url', expected], ['og:title', title], ['og:description', description], ['twitter:title', title], ['twitter:description', description]]) {
      if (meta(name).length !== 1 || attr(meta(name)[0], 'content') !== expectedValue) fail(route, `${name} inconsistent with page`);
    }
    const scripts = find('script').filter((n) => attr(n, 'type') === 'application/ld+json');
    if (scripts.length !== 1) fail(route, 'expected one JSON-LD graph');
    for (const script of scripts) {
      try {
        const schema = JSON.parse(text(script));
        if (schema['@context'] !== 'https://schema.org' || !Array.isArray(schema['@graph'])) throw new Error('missing schema.org graph');
        const graph = schema['@graph'];
        const ids = new Set(graph.map((n) => n['@id']));
        if (ids.size !== graph.length) fail(route, 'schema node IDs must be unique');
        const page = graph.find((n) => n['@id'] === `${expected}#webpage`);
        if (!page || page.url !== expected || page.name !== title || page.description !== description) fail(route, 'WebPage schema does not match visible page metadata');
        for (const node of graph) {
          if (node['@type'] === 'FAQPage' && !node.mainEntity?.length) fail(route, 'FAQPage has no questions');
          for (const question of node.mainEntity || []) {
            if (!question.name || !question.acceptedAnswer?.text) fail(route, 'FAQ answer is empty');
          }
          for (const key of ['datePublished', 'dateModified']) {
            if (node[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(node[key]) || Date.parse(node[key]) > Date.now())) fail(route, `invalid ${key}`);
          }
          if (node['@type'] === 'BreadcrumbList') {
            if (node.itemListElement.at(-1)?.item !== expected) fail(route, 'breadcrumb does not end at canonical URL');
            node.itemListElement.forEach((item, i) => { if (item.position !== i + 1) fail(route, 'breadcrumb positions are not sequential'); });
          }
        }
      } catch (error) { fail(route, `invalid JSON-LD: ${error.message}`); }
    }
  }
  for (const image of find('img')) if (attr(image, 'alt') === undefined) fail(route, 'image missing alt attribute');
  documents.set(route, { file, tree, noindex, ids, links: find('a').map((n) => attr(n, 'href')).filter(Boolean) });
}
const graph = new Map();
for (const [route, doc] of documents) {
  const outgoing = new Set();
  for (const node of doc.tree) {
    const values = node.tagName === 'a' || node.tagName === 'link' ? [attr(node, 'href')] : ['img', 'script'].includes(node.tagName) ? [attr(node, 'src')] : [];
    for (const value of values.filter(Boolean)) {
      const url = new URL(value, site.url + route);
      if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) fail(route, `unsupported link protocol ${value}`);
      if (url.origin !== site.url) continue;
      const target = documents.get(url.pathname);
      if (target) {
        if (node.tagName === 'a' && !target.noindex) outgoing.add(url.pathname);
        if (url.hash && !target.ids.has(decodeURIComponent(url.hash.slice(1)))) fail(route, `broken fragment ${value}`);
      } else if (!fs.existsSync(path.join(dist, decodeURIComponent(url.pathname))) && !url.pathname.startsWith('/exploring/')) fail(route, `missing local target ${value}`);
    }
  }
  graph.set(route, outgoing);
}
const depths = new Map([['/', 0]]);
const queue = ['/'];
for (const current of queue) for (const next of graph.get(current) || []) if (!depths.has(next)) { depths.set(next, depths.get(current) + 1); queue.push(next); }
for (const [route, doc] of documents) if (!doc.noindex) {
  if (!depths.has(route)) fail(route, 'unreachable from homepage through HTML links');
  else if (depths.get(route) > 4) warnings.push(`${route}: ${depths.get(route)} clicks from homepage`);
}
const xml = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
for (const match of xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)) if (!/^\d{4}-\d{2}-\d{2}$/.test(match[1]) || Date.parse(match[1]) > Date.now()) errors.push(`sitemap has invalid lastmod ${match[1]}`);
const sitemap = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const expected = [...documents].filter(([, doc]) => !doc.noindex).map(([route]) => site.url + route);
if (new Set(sitemap).size !== sitemap.length) errors.push('sitemap contains duplicate URLs');
for (const url of expected) if (!sitemap.includes(url)) errors.push(`sitemap missing ${url}`);
for (const url of sitemap) if (!expected.includes(url)) errors.push(`sitemap contains noncanonical or excluded URL ${url}`);
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${site.url}/sitemap.xml`)) errors.push('robots.txt is missing the canonical sitemap');
if (!/^Disallow: \/admin/m.test(robots)) errors.push('robots.txt does not exclude admin');
if (config.rewrites.some((r) => r.source === '/(.*)' || r.source === '/:path*')) errors.push('catch-all SPA rewrite causes soft 404s');
if (!documents.get('/404')?.noindex || !documents.get('/admin')?.noindex) errors.push('404/admin HTML must be excluded from indexing');
const report = { indexablePages: expected.length, sitemapUrls: sitemap.length, maxClickDepth: Math.max(...depths.values()), errors, warnings };
fs.writeFileSync(path.join(dist, 'seo-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`[seo-dist] ${expected.length} indexable pages; ${sitemap.length} sitemap URLs; max click depth ${report.maxClickDepth}; ${errors.length} errors`);
if (warnings.length) console.warn(warnings.join('\n'));
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
