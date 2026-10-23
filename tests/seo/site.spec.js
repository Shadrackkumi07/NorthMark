import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const origin = 'https://northmarkfacilityservices.com';
const routes = [...fs.readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

test('every sitemap URL serves its own HTML before JavaScript', async ({ request }) => {
  for (const route of routes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    expect(html, route).toContain(`rel="canonical" href="${origin}${route}"`);
    expect(html.match(/<h1[ >]/g), route).toHaveLength(1);
    expect(html, route).not.toContain('<!--app:start-->');
  }
  const missing = await request.get('/missing-seo-regression-test');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('noindex,follow');
});

test('client navigation keeps canonicals and schema aligned', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?utm_source=seo-test');
  await expect(page.locator('h1')).toContainText('Fargo');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', origin + '/');
  await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Privacy Policy');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', origin + '/privacy');
  expect(await page.locator('meta[property="og:title"]').getAttribute('content')).toBe(await page.title());
  const schema = JSON.parse(await page.locator('script[data-page-schema]').textContent());
  expect(schema['@graph'].find((n) => n['@type'] === 'WebPage').url).toBe(origin + '/privacy');
  await page.getByRole('link', { name: 'Services', exact: true }).first().click();
  await expect(page.locator('h1')).toContainText('Services');
  await expect(page.locator('article.prose')).toBeVisible();
  expect(errors).toEqual([]);
});

test('public app pages work on direct loads', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/reviews', '/appointments', '/privacy', '/terms', '/accessibility']) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', origin + route);
    await expect(page.locator('meta[name=robots]')).not.toHaveAttribute('content', /noindex/);
  }
  expect(errors).toEqual([]);
});

test('all content pages fit mobile screens with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  // External fonts are optional; fallback fonts must preserve a usable layout.
  await page.route('https://**', (route) => route.abort());
  for (const route of routes) {
    await page.goto('http://127.0.0.1:4173' + route);
    await expect(page.locator('h1'), route).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBe(true);
  }
  await page.goto('http://127.0.0.1:4173/services');
  await page.screenshot({ path: 'test-results/services-mobile.png', fullPage: false });
  await page.goto('http://127.0.0.1:4173/');
  await page.screenshot({ path: 'test-results/home-mobile-nojs.png' });
  await context.close();
});


test('missing routes stay excluded and recover cleanly through app navigation', async ({ page }) => {
  const response = await page.goto('/missing-seo-regression-test');
  expect(response.status()).toBe(404);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel=canonical]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to Home', exact: true }).click();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', origin + '/');
  await expect(page.locator('meta[name=robots]')).not.toHaveAttribute('content', /noindex/);
  const schema = JSON.parse(await page.locator('script[data-page-schema]').textContent());
  expect(schema['@graph'].find((n) => n['@type'] === 'WebPage').url).toBe(origin + '/');
  expect(schema['@graph'].filter((n) => n['@type'] === 'BreadcrumbList')).toHaveLength(0);
});


test('app navigation fits tablet and desktop widths', async ({ page }) => {
  for (const width of [768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    if (width >= 1024) expect(await page.locator('.q-toolbar__title').evaluate((el) => el.clientWidth)).toBeGreaterThan(400);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${width}px`).toBe(true);
  }
  await page.screenshot({ path: 'test-results/home-desktop.png' });
});
