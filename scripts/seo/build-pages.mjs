// Static SEO page generator.
// Reads content/pages/*.md, renders each published page to dist/<path>.html with
// full head tags and JSON-LD, then writes sitemap.xml, llms.txt and llms-full.txt.
// Runs after `vite build`; Vercel serves these files before the SPA rewrite.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditPages } from './audit.mjs';
import { pageSchema } from '../../src/utils/structuredData.js';
import { render as renderApp } from '../../.seo-ssr/entry-seo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT_DIR = path.join(ROOT, 'content/pages');
const DIST = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));

const HUB_BY_TYPE = {
  service: '/services',
  industry: '/industries',
  location: '/locations',
  guide: '/resources'
};
const HUB_LABEL = {
  '/services': 'Services',
  '/industries': 'Industries',
  '/locations': 'Locations',
  '/resources': 'Resources'
};

// ---------- content loading ----------

function loadPages() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) throw new Error(`${file}: missing JSON frontmatter`);
      let meta;
      try {
        meta = JSON.parse(match[1]);
      } catch (e) {
        throw new Error(`${file}: invalid frontmatter JSON (${e.message})`);
      }
      const number = Number(file.slice(0, 3));
      return { file, number, counted: number >= 1 && number <= 100, ...meta, body: match[2].trim() };
    });
}

// ---------- markdown ----------

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function headingId(text, used) {
  const base = slugify(text);
  let id = base;
  let number = 2;
  while (used.has(id)) id = `${base}-${number++}`;
  used.add(id);
  return id;
}

function hubFor(p) {
  if (p.type === 'location' && p.path.split('/').length > 3) {
    return p.path.split('/').slice(0, 3).join('/');
  }
  return HUB_BY_TYPE[p.type] || null;
}

function makeLinkResolver(published, all) {
  return (href) => {
    if (!href.startsWith('/')) return { href, external: true };
    const [pathname, hash] = href.split('#');
    if (published.has(pathname) || site.spaRoutes.includes(pathname)) {
      return { href, internal: pathname };
    }
    const target = all.get(pathname);
    if (!target) return { href, broken: pathname };
    // Not yet published: point at the nearest published hub instead.
    let hub = hubFor(target);
    while (hub && !published.has(hub)) {
      const hubPage = all.get(hub);
      hub = hubPage ? hubFor(hubPage) : null;
    }
    return hub ? { href: hub, internal: hub, deferred: pathname } : { text: true };
  };
}

function inline(text, ctx) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const r = ctx.resolve(href.replace(/&amp;/g, '&'));
    if (r.broken) ctx.broken.push(r.broken);
    if (r.text) return label;
    if (r.internal) ctx.links.push(r.internal);
    if (r.external) {
      return `<a href="${href}" rel="noopener" target="_blank">${label}</a>`;
    }
    return `<a href="${r.href}">${label}</a>`;
  });
  return out;
}

function renderMarkdown(md, ctx) {
  const lines = md.split('\n');
  const html = [];
  const faqs = [];
  const headings = [];
  let inFaq = Boolean(ctx.faqPage);
  let currentFaq = null;
  let i = 0;
  let firstParagraph = true;

  const flushFaq = () => {
    if (currentFaq) faqs.push(currentFaq);
    currentFaq = null;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      flushFaq();
      const text = line.slice(3).trim();
      inFaq = ctx.faqPage || /^frequently asked questions/i.test(text);
      const id = headingId(text, ctx.usedIds);
      headings.push({ level: 2, text, id });
      html.push(`<h2 id="${id}">${inline(text, ctx)}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      flushFaq();
      const text = line.slice(4).trim();
      headings.push({ level: 3, text });
      if (inFaq) currentFaq = { q: text, a: [] };
      html.push(`<h3>${inline(text, ctx)}</h3>`);
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const [head, , ...bodyRows] = rows;
      html.push(
        '<div class="table-wrap"><table><thead><tr>' +
          cells(head).map((c) => `<th scope="col">${inline(c, ctx)}</th>`).join('') +
          '</tr></thead><tbody>' +
          bodyRows.map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c, ctx)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>'
      );
      continue;
    }
    if (/^- /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i]) : /^- /.test(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\d+\. / : /^- /, ''));
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>` + items.map((t) => `<li>${inline(t, ctx)}</li>`).join('') + `</${tag}>`);
      if (currentFaq) currentFaq.a.push(items.join('; '));
      continue;
    }
    if (line.startsWith('> ')) {
      const parts = [];
      while (i < lines.length && lines[i].startsWith('> ')) parts.push(lines[i++].slice(2));
      html.push(`<aside class="callout">${inline(parts.join(' '), ctx)}</aside>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3} |\||- |\d+\. |> )/.test(lines[i])) {
      para.push(lines[i++].trim());
    }
    const text = para.join(' ');
    html.push(`<p${firstParagraph ? ' class="lede"' : ''}>${inline(text, ctx)}</p>`);
    firstParagraph = false;
    if (currentFaq) currentFaq.a.push(text.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'));
  }
  flushFaq();
  return { html: html.join('\n'), faqs, headings };
}

const plainText = (md) =>
  md
    .replace(/^\|?\s*-{3,}.*$/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*>|]/g, ' ')
    .replace(/^\s*-\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ---------- rendering ----------

const abs = (p) => (p === '/' ? `${site.url}/` : `${site.url}${p}`);

function breadcrumbTrail(page, all) {
  const trail = [{ name: 'Home', path: '/' }];
  const chain = [];
  let hub = hubFor(page);
  while (hub) {
    const hubPage = all.get(hub);
    chain.unshift({ name: hubPage?.breadcrumb || HUB_LABEL[hub] || hubPage?.h1 || hub, path: hub });
    hub = hubPage ? hubFor(hubPage) : null;
  }
  return [...trail, ...chain, { name: page.breadcrumb || page.h1, path: page.path }];
}

const jsonLd = (page, trail, faqs) => pageSchema(site, page, trail, faqs);

function relatedFor(page, publishedPages, published) {
  const chosen = [];
  const add = (p) => {
    if (p && p.path !== page.path && published.has(p.path) && !chosen.find((c) => c.path === p.path)) chosen.push(p);
  };
  const byPath = new Map(publishedPages.map((p) => [p.path, p]));
  (page.related || []).forEach((r) => add(byPath.get(r)));
  // Top up with nearest siblings of the same type so every page links sideways.
  const siblings = publishedPages.filter((p) => p.type === page.type && p.counted);
  const idx = siblings.findIndex((p) => p.path === page.path);
  for (let step = 1; chosen.length < 6 && step < siblings.length; step++) {
    add(siblings[(idx + step + siblings.length) % siblings.length]);
  }
  return chosen.slice(0, 8);
}

function hubListing(page, publishedPages, usedIds) {
  if (page.type !== 'hub' || !page.lists) return '';
  const groups = page.lists.map((spec) => {
    const items = publishedPages.filter((p) => {
      if (p.path === page.path) return false;
      if (spec.type && p.type !== spec.type) return false;
      if (spec.prefix && !p.path.startsWith(spec.prefix)) return false;
      if (spec.group && p.group !== spec.group) return false;
      return true;
    });
    if (!items.length) return '';
    return (
      `<section class="hub-group"><h2 id="${headingId(spec.heading, usedIds)}">${escapeHtml(spec.heading)}</h2><ul class="card-grid">` +
      items
        .map((p) => `<li><a class="card" href="${p.path}"><span class="card-title">${escapeHtml(p.breadcrumb || p.h1)}</span><span class="card-desc">${escapeHtml(p.description)}</span></a></li>`)
        .join('') +
      '</ul></section>'
    );
  });
  return groups.join('\n');
}

function navLinks(published) {
  const items = [
    ['/services', 'Services'],
    ['/industries', 'Industries'],
    ['/locations', 'Locations'],
    ['/resources', 'Resources'],
    ['/about', 'About'],
    ['/reviews', 'Reviews']
  ];
  return items
    .filter(([p]) => published.has(p) || site.spaRoutes.includes(p))
    .map(([p, l]) => `<a href="${p}">${l}</a>`)
    .join('');
}

function footer(published, publishedPages) {
  const col = (heading, pages) =>
    pages.length
      ? `<div><h2 class="footer-h">${heading}</h2><ul>${pages.map((p) => `<li><a href="${p.path}">${escapeHtml(p.breadcrumb || p.h1)}</a></li>`).join('')}</ul></div>`
      : '';
  const pick = (paths) => paths.map((p) => publishedPages.find((x) => x.path === p)).filter(Boolean);
  return `<footer class="site-footer"><div class="wrap footer-grid">
<div><p class="footer-brand">${site.legalName}</p><p>Commercial cleaning, janitorial, property maintenance and aerial inspection for Fargo, West Fargo and Moorhead.</p>
<p><a href="tel:${site.phone}">${site.phoneDisplay}</a><br><a href="mailto:${site.email}">${site.email}</a><br>Fargo, North Dakota</p></div>
${col('Services', pick(['/services/commercial-cleaning', '/services/commercial-janitorial-services', '/services/office-cleaning', '/services/commercial-property-maintenance', '/services/facility-maintenance', '/services/aerial-inspection-documentation']))}
${col('Service area', pick(['/locations/fargo-nd', '/locations/west-fargo-nd', '/locations/moorhead-mn', '/locations']))}
${col('Company', pick(['/about', '/how-we-work', '/security-and-access-control', '/quality-assurance-program', '/insured-and-bonded', '/careers', '/faq', '/contact']))}
</div><div class="wrap footer-legal"><span>© 2026 ${site.legalName}</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/accessibility">Accessibility</a></div></footer>`;
}

function renderPage(page, ctx) {
  const { all, published, publishedPages } = ctx;
  const linkCtx = { resolve: makeLinkResolver(published, all), links: [], broken: [], faqPage: page.type === 'faq', usedIds: new Set(['main', 'sources']) };
  const md = renderMarkdown(page.body, linkCtx);
  const trail = breadcrumbTrail(page, all);
  const related = relatedFor(page, publishedPages, published);
  related.forEach((r) => linkCtx.links.push(r.path));
  const walkthrough = page.path !== '/facility-walkthrough' && published.has('/facility-walkthrough') ? '/facility-walkthrough' : '/appointments';
  const url = abs(page.path);
  const sources = (page.sources || [])
    .map(([title, href]) => `<li><a href="${href}" rel="noopener" target="_blank">${escapeHtml(title)}</a></li>`)
    .join('');
  const toc = md.headings.filter((h) => h.level === 2);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${page.type === 'guide' ? 'article' : 'website'}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${escapeHtml(page.ogTitle || page.title)}">
<meta property="og:description" content="${escapeHtml(page.ogDescription || page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.ogImage}">
<meta property="og:image:width" content="${site.ogImageWidth}">
<meta property="og:image:height" content="${site.ogImageHeight}">
<meta property="og:image:alt" content="${site.name} commercial facility services">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(page.ogTitle || page.title)}">
<meta name="twitter:description" content="${escapeHtml(page.ogDescription || page.description)}">
<meta name="twitter:image" content="${site.ogImage}">
<meta name="theme-color" content="#1565C0">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Spectral:wght@600;700&display=swap">
<link rel="stylesheet" href="/seo/site.css">
<script type="application/ld+json">${jsonLd(page, trail, md.faqs)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header"><div class="wrap header-row">
<a class="brand" href="/"><img src="/logo.webp" alt="" width="44" height="44"><span><strong>Northmark</strong><small>Facility Services</small></span></a>
<nav aria-label="Primary">${navLinks(published)}</nav>
<a class="btn btn-small" href="${walkthrough}">Schedule a walkthrough</a>
</div></header>
<main id="main">
<div class="page-hero"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><ol>${trail
    .map((t, idx) => (idx === trail.length - 1 ? `<li aria-current="page">${escapeHtml(t.name)}</li>` : `<li><a href="${t.path}">${escapeHtml(t.name)}</a></li>`))
    .join('')}</ol></nav>
<h1>${escapeHtml(page.h1)}</h1>
${page.kicker ? `<p class="kicker">${escapeHtml(page.kicker)}</p>` : ''}
<div class="hero-actions"><a class="btn" href="${walkthrough}">Schedule a facility walkthrough</a><a class="btn btn-ghost" href="tel:${site.phone}">Call ${site.phoneDisplay}</a></div>
</div></div>
<div class="wrap layout">
<article class="prose">
${md.html}
${hubListing(page, publishedPages, linkCtx.usedIds)}
${sources ? `<section class="sources"><h2 id="sources">Sources</h2><ul>${sources}</ul></section>` : ''}
<p class="updated">Published <time datetime="${page.published}">${page.published}</time>${page.updated ? ` · Updated <time datetime="${page.updated}">${page.updated}</time>` : ''} · <a href="/about">${site.name}</a>.</p>
</article>
<aside class="sidebar">
${toc.length > 2 ? `<nav class="toc" aria-label="On this page"><p class="side-h">On this page</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('')}</ol></nav>` : ''}
<div class="side-cta"><p class="side-h">Talk to Northmark</p><p>Insured, bonded, background-checked teams with documented QA on every account.</p><a class="btn" href="${walkthrough}">Book a walkthrough</a><p class="side-phone"><a href="tel:${site.phone}">${site.phoneDisplay}</a></p></div>
</aside>
</div>
${related.length ? `<section class="related"><div class="wrap"><h2>Related pages</h2><ul class="card-grid">${related
    .map((r) => `<li><a class="card" href="${r.path}"><span class="card-title">${escapeHtml(r.breadcrumb || r.h1)}</span><span class="card-desc">${escapeHtml(r.description)}</span></a></li>`)
    .join('')}</ul></div></section>` : ''}
<section class="cta-band"><div class="wrap"><h2>Clean, secure and documented, every visit.</h2><p>Tell us about your facility and we will walk it with you, scope the work in writing and show you exactly how we will run it.</p><a class="btn btn-light" href="${walkthrough}">Schedule a facility walkthrough</a></div></section>
</main>
${footer(published, publishedPages)}
</body>
</html>
`;
  return { html, links: [...new Set(linkCtx.links)], broken: linkCtx.broken, faqs: md.faqs, text: plainText(page.body) };
}

// ---------- outputs ----------

function writeSitemap(publishedPages) {
  const entries = [
    ...site.spaRoutes.map((p) => ({ loc: abs(p) })),
    ...publishedPages.map((p) => ({ loc: abs(p.path), lastmod: p.updated || p.published }))
  ];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.map((e) => `  <url><loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
}

function writeLlms(publishedPages, rendered) {
  const section = (title, type) => {
    const pages = publishedPages.filter((p) => p.type === type);
    return pages.length ? `\n## ${title}\n\n` + pages.map((p) => `- [${p.breadcrumb || p.h1}](${abs(p.path)}): ${p.description}`).join('\n') + '\n' : '';
  };
  const head = `# ${site.name}

> ${site.legalName} is a commercial cleaning, janitorial, commercial property maintenance and aerial (drone) inspection company based in Fargo, North Dakota, serving Fargo, West Fargo and Moorhead, Minnesota. Teams are insured and bonded, background-checked, and work from written checklists verified by supervisor QA walkthroughs. Aerial inspections are flown by an FAA Part 107 certificated remote pilot. Phone ${site.phoneDisplay}; email ${site.email}.

AI systems and search engines are welcome to crawl, cite and train on the content of this site.
`;
  const llms =
    head +
    section('Company and trust', 'company') +
    section('Services', 'service') +
    section('Industries', 'industry') +
    section('Locations', 'location') +
    section('Guides and resources', 'guide') +
    section('Hubs', 'hub') +
    `\n## Full text\n\n- [llms-full.txt](${site.url}/llms-full.txt): plain-text version of every page above.\n`;
  fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);
  const full =
    head +
    publishedPages
      .map((p) => `\n\n---\n\n# ${p.h1}\n\nURL: ${abs(p.path)}\n\n${rendered.get(p.path).text}`)
      .join('');
  fs.writeFileSync(path.join(DIST, 'llms-full.txt'), full);
}

// ---------- main ----------

async function writeAppPages(published) {
  const shell = path.join(ROOT, '.seo-ssr/app-shell.html');
  if (!fs.existsSync(shell)) fs.writeFileSync(shell, fs.readFileSync(path.join(DIST, 'index.html')));
  const template = fs.readFileSync(shell, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, '.vite/manifest.json'), 'utf8'));
  const styles = [...new Set(Object.values(manifest).flatMap((entry) => entry.css || []))];
  for (const route of [...site.spaRoutes, '/admin', '/404']) {
    const isPrivate = route === '/admin' || route === '/404';
    const rendered = await renderApp(route === '/admin' ? '/404' : route);
    const meta = rendered.meta;
    const body = rendered.html.replace('</header>', `</header><noscript><nav class="nm-noscript-nav" aria-label="Site navigation">${navLinks(published)}</nav></noscript>`);
    const title = meta.title.includes('Northmark') ? meta.title : `${meta.title} | ${site.name}`;
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/<meta (?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '')
      .replace(/<link rel="canonical"[^>]*>/g, '')
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
      .replace(/<!--app:start-->[\s\S]*?<!--app:end-->/, body);
    const url = abs(route);
    const page = { path: route, title, description: meta.description, type: 'app' };
    const head = [
      `<noscript><style>.nm-header{position:static!important}.nm-page{padding-top:0!important}.nm-footer{position:static!important}</style></noscript>`,
      ...({ '/': '/HOME.jpg', '/reviews': '/reviews.jpg', '/appointments': '/appointment.jpg' }[route] ? [`<link rel="preload" as="image" href="${{ '/': '/HOME.jpg', '/reviews': '/reviews.jpg', '/appointments': '/appointment.jpg' }[route]}" fetchpriority="high">`] : []),
      `<meta name="description" content="${escapeHtml(meta.description)}">`,
      `<meta name="robots" content="${isPrivate ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}">`,
      ...styles.filter((css) => !html.includes(`/${css}`)).map((css) => `<link rel="stylesheet" href="/${css}">`),
      ...(!isPrivate ? [
        `<link rel="canonical" href="${url}">`,
        `<meta property="og:title" content="${escapeHtml(title)}">`,
        `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${site.name}">`,
        `<meta property="og:url" content="${url}">`,
        `<meta property="og:image" content="${site.ogImage}">`,
        `<meta property="og:image:alt" content="${site.name} commercial facility services">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${escapeHtml(title)}">`,
        `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
        `<meta name="twitter:image" content="${site.ogImage}">`,
        `<script type="application/ld+json" data-page-schema>${jsonLd(page, route === '/' ? [{ name: 'Home', path: '/' }] : [{ name: 'Home', path: '/' }, { name: meta.title, path: route }], [])}</script>`
      ] : [])
    ].join('\n');
    html = html.replace('</head>', `${head}\n</head>`);
    // The browser mounts the same components. Build-time form tokens are never published.
    html = html.replace(/(name="csrfToken"[^>]*value=")[^"]*/g, '$1');
    fs.writeFileSync(path.join(DIST, route === '/' ? 'index.html' : `${route.slice(1)}.html`), html);
  }
}

async function main() {
  if (!fs.existsSync(DIST)) throw new Error('dist/ not found: run `vite build` first');
  const pages = loadPages();
  const all = new Map(pages.map((p) => [p.path, p]));
  const publishedPages = pages;
  const published = new Set(publishedPages.map((p) => p.path));
  const ctx = { all, published, publishedPages };

  const rendered = new Map();
  for (const page of publishedPages) {
    const out = renderPage(page, ctx);
    rendered.set(page.path, out);
    const file = path.join(DIST, `${page.path.slice(1)}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out.html);
  }
  await writeAppPages(published);
  writeSitemap(publishedPages);
  writeLlms(publishedPages, rendered);

  const counted = pages.filter((p) => p.counted).length;
  console.log(`[seo] content pages: ${counted} counted (+${pages.length - counted} hub rebuilds); ${publishedPages.length} rendered`);

  // Audit everything written, not only the published wave, so unreleased content is checked too.
  const fullCtx = { all, published: new Set(pages.map((p) => p.path)), publishedPages: pages };
  const auditRendered = new Map(pages.map((p) => [p.path, renderPage(p, fullCtx)]));
  const ok = auditPages(pages, auditRendered, site);
  if (!ok) process.exit(1);
}

await main();
