# Northmark Facility Services

Vue 3 and Quasar website with build-time HTML rendering for public app routes and Markdown content pages.

## Local development and verification

```sh
npm ci
npm run dev
npm run build
npm run test:seo
npm audit
```

Browser tests use installed Chrome on macOS. On other machines install the test browser with `npx playwright install chromium` (CI may need `--with-deps`). Production builds require no browser.

`npm run build` builds the client, creates a temporary Vue server-rendering bundle, generates the content pages and app HTML, then audits the deployable output. Vercel explicitly uses this command and serves `dist/`. Do not deploy only the intermediate output of `vite build`.

The test server models static clean URLs for local QA. Browser tests do not establish production Vercel routing behavior or search-engine indexing.

## SEO architecture

- `content/site.json`: canonical production origin and business details.
- `content/pages/*.md`: 101 content pages, with JSON frontmatter, substantive page text, related links and public sources.
- `src/router/index.js`: six public app routes, plus excluded administration and not-found routes.
- `src/entry-seo.js`: renders the actual app components at build time so content is available without JavaScript.
- `src/utils/structuredData.js`: shared schema generator for initial HTML and client navigation.
- `scripts/seo/build-pages.mjs`: content rendering, breadcrumbs, page metadata, app rendering, sitemap and text exports.
- `scripts/seo/verify-dist.mjs`: audits actual HTML, links, fragments, assets, schema, sitemap coverage and reachability.
- `vercel.json`: canonical-host redirect, clean URLs, proxy routes, indexing headers and build settings. Unknown routes use `404.html`; there is no catch-all rewrite to the homepage.

The current build has **107 indexable pages**, **107 sitemap URLs**, and a **maximum of two links from the homepage**. `/admin` and `/404` are excluded. The sitemap includes appointments, uses the production origin and omits invented build-time modification dates. Add `updated` to content frontmatter only after a substantive edit.

Titles, descriptions and H1s must be unique. The artifact gate checks one H1, a main landmark, canonical and social metadata consistency, valid JSON-LD, nonempty FAQ answers, sequential breadcrumbs, internal URL and fragment targets, local assets, unsupported link protocols, sitemap inclusion and homepage reachability. Word count and metadata-length ranges are editorial heuristics, not Google or Bing requirements.

## Corrections completed on October 23, 2026

- Rendered unique HTML for the homepage, reviews, appointments and policy pages instead of serving homepage metadata for every app route.
- Pinned browser canonicals to the production origin, removed entity double-encoding in DOM metadata and kept schema aligned during client navigation, including recovery from a not-found page.
- Corrected H1/H2 semantics and contact email addresses on policy pages; added Resources to app navigation.
- Fixed FAQ extraction for the categorized FAQ page and duplicate heading IDs in the services hub. Removed a one-item homepage breadcrumb.
- Made walkthrough-page booking CTAs lead to appointments instead of linking back to the same page. Estimate CTAs are crawlable links.
- Fixed mobile email overflow, desktop brand clipping, repeated homepage background imagery, initial hero visibility, reduced-motion support and no-JavaScript navigation/layout.
- Removed the empty `0 average rating` display and added honest reviews and booking fallbacks.
- Fixed the estimate form's missing phone-formatting import. An unconfigured form now offers booking, phone and email instead of pretending to send a request. Successful delivery is required before a success message; lead details are no longer silently archived in browser storage.
- Corrected Fargo permit figures to their **January–September 2025** comparison period, replaced moved citations, distinguished occupations from industries and establishments from buildings, and removed an unsupported historical population series and blanket outsourcing savings claim.
- Replaced implied team review dates with explicit publication/update dates. Business claims about insurance, bonding, screening, supervision and the FAA pilot were confirmed by the owner in this review.
- Updated vulnerable dependencies within their existing major versions; `npm audit` reports no known vulnerabilities at verification time.

Source examples: [Fargo comparative permit totals](https://fargond.gov/city-government/departments/inspections/permits-issued/comparative-totals), [BLS Fargo wages](https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_fargo.htm), [Cass County QuickFacts](https://www.census.gov/quickfacts/casscountynorthdakota), [Clay County QuickFacts](https://www.census.gov/quickfacts/claycountyminnesota).

## Optional checks and limits

```sh
npm run seo:verify  # Recheck the existing dist output
npm run seo:links   # Check public source links; writes reports/external-links.json
npm run seo:live    # Explicitly requested live checks only; writes reports/live-seo.json
```

The source-link audit distinguishes HTTP errors from redirects and does not call anti-bot responses dead links. Some government/regulatory sources block automated access and require manual verification. Lexical similarity and syntactically valid schema do not establish factual accuracy, original expertise, rich-result eligibility or overall editorial quality. No ranking or indexing guarantee is made. Real-world Core Web Vitals require field measurements; local viewport tests do not establish them.

Google/Bing account checks and production deployment were excluded from the final scope at the owner's request. The changes remain local and have not been published.

The pre-existing `/exploring` integration currently returns `403 Invalid proxy proof` from its upstream. Its rewrite is preserved; signing credentials were not guessed or changed. Its failing sitemap was removed from the new robots file. Restore the extra sitemap declaration only after that integration serves a valid public XML sitemap. This integration is separate from the 107 locally generated pages. `reports/live-seo.json` records the earlier read-only observation and is not evidence of the corrected build being live.

For future external validation, the implementation follows [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), and [Bing's webmaster guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a). Search engines choose what to crawl, index and display.
