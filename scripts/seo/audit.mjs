// SEO quality gate for the static content pages. Any error fails the build.

// Editorial heuristics are warnings, not Google/Bing requirements.
const MIN_WORDS = 300;
const MIN_OUTBOUND = 1;
const MIN_INBOUND = 1;
const MAX_SIMILARITY = 0.25;


// Phrases requiring editorial review; quoted definitions and exclusions can be legitimate.
const BANNED = [
  /\bcertified\b/i,
  /\bthe best\b/i,
  /\bbest-in-class\b/i,
  /#1\b/,
  /\bnumber one\b/i,
  /\bguarantee(d)?\b/i,
  /\b(fully|state)[- ]licensed\b/i,
  /\blicensed,? (and|&) (insured|bonded)\b/i,
  /\baward-winning\b/i,
  /\bhospital-grade\b/i,
  /\bstrip(ping)? and wax/i,
  /\bsnow removal service/i,
  /\bpost-construction cleaning service/i
];

const words = (text) => text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

function shingles(text, n = 5) {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= tokens.length; i++) set.add(tokens.slice(i, i + n).join(' '));
  return set;
}

function jaccard(a, b) {
  let inter = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (large.has(s)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

function contentLinks(html) {
  const parts = [];
  const article = html.match(/<article class="prose">([\s\S]*?)<\/article>/);
  const related = html.match(/<section class="related">([\s\S]*?)<\/section>/);
  const crumbs = html.match(/<nav class="crumbs"[^>]*>([\s\S]*?)<\/nav>/);
  if (crumbs) parts.push(crumbs[1]);
  if (article) parts.push(article[1]);
  if (related) parts.push(related[1]);
  return [...parts.join('').matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]);
}

export function auditPages(pages, rendered, site) {
  const errors = [];
  const warn = [];
  const err = (page, msg) => errors.push(`${page.file}: ${msg}`);
  const known = new Set([...pages.map((p) => p.path), ...site.spaRoutes]);
  const inbound = new Map(pages.map((p) => [p.path, new Set()]));

  const seen = { path: new Map(), title: new Map(), description: new Map(), h1: new Map() };
  for (const page of pages) {
    for (const key of Object.keys(seen)) {
      const value = (page[key] || '').toLowerCase();
      if (!value) err(page, `missing ${key}`);
      else if (seen[key].has(value)) err(page, `duplicate ${key} (also in ${seen[key].get(value)})`);
      else seen[key].set(value, page.file);
    }
    if (!['company', 'hub', 'service', 'industry', 'location', 'guide', 'faq'].includes(page.type)) err(page, `unknown type ${page.type}`);
    if (!page.published) err(page, 'missing published date');
    if (page.title && (page.title.length < 30 || page.title.length > 60)) warn.push(`${page.file}: ` + `title length ${page.title.length} (30-60)`);
    if (page.description && (page.description.length < 120 || page.description.length > 160)) {
      warn.push(`${page.file}: ` + `description length ${page.description.length} (120-160)`);
    }

    const out = rendered.get(page.path);
    const wc = words(out.text);
    if (wc < MIN_WORDS) warn.push(`${page.file}: ` + `short page (${wc} words); review usefulness`);
    page._words = wc;

    if ((out.html.match(/<h1[\s>]/g) || []).length !== 1) err(page, 'must have exactly one <h1>');
    const ld = out.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    try {
      JSON.parse(ld[1]);
    } catch {
      err(page, 'invalid JSON-LD');
    }
    if (!out.html.includes(`<link rel="canonical" href="${site.url}${page.path}">`)) err(page, 'canonical mismatch');

    out.broken.forEach((b) => err(page, `broken internal link ${b}`));
    const links = new Set(contentLinks(out.html).filter((l) => l !== page.path));
    for (const l of links) {
      if (!known.has(l)) err(page, `link to unknown path ${l}`);
      if (inbound.has(l)) inbound.get(l).add(page.path);
    }
    const contentOut = [...links].filter((l) => !['/appointments', '/facility-walkthrough', '/contact'].includes(l));
    if (contentOut.length < MIN_OUTBOUND) err(page, `only ${contentOut.length} outbound content links (min ${MIN_OUTBOUND})`);

    if (page.type === 'guide' && (page.sources || []).length < 2) err(page, 'guides need at least 2 sources');
    for (const re of BANNED) {
      const m = out.text.match(re);
      if (m) warn.push(`${page.file}: review phrase "${m[0]}" in context`);
    }
  }

  for (const page of pages) {
    const count = inbound.get(page.path).size;
    if (count < MIN_INBOUND) err(page, `only ${count} inbound links (min ${MIN_INBOUND})`);
  }

  const sh = pages.map((p) => ({ p, s: shingles(rendered.get(p.path).text) }));
  let maxPair = { score: 0 };
  for (let i = 0; i < sh.length; i++) {
    for (let j = i + 1; j < sh.length; j++) {
      const score = jaccard(sh[i].s, sh[j].s);
      if (score > maxPair.score) maxPair = { score, a: sh[i].p.file, b: sh[j].p.file };
      if (score > MAX_SIMILARITY) errors.push(`${sh[i].p.file} ~ ${sh[j].p.file}: similarity ${score.toFixed(2)} (max ${MAX_SIMILARITY})`);
    }
  }

  const totalWords = pages.reduce((n, p) => n + p._words, 0);
  const minPage = pages.reduce((m, p) => (p._words < m._words ? p : m), pages[0]);
  console.log(
    `[seo-audit] ${pages.length} pages, ${totalWords.toLocaleString()} words, min ${minPage?._words} (${minPage?.file}), ` +
      `most similar pair ${maxPair.score.toFixed(3)}${maxPair.a ? ` (${maxPair.a} ~ ${maxPair.b})` : ''}`
  );
  warn.forEach((w) => console.warn(`[seo-audit] warn: ${w}`));
  if (errors.length) {
    console.error(`[seo-audit] ${errors.length} error(s):\n  ` + errors.join('\n  '));
    return false;
  }
  console.log('[seo-audit] passed');
  return true;
}
