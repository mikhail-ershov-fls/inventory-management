#!/usr/bin/env node
/*
 * capture.cjs: screenshot every route of a running web app and record health signals.
 *
 * Usage:
 *   node capture.cjs --base http://localhost:3000 --routes /,/orders,/settings --out ./before
 *     [--nav "nav a[href]"]      click every matching link (desktop) and record where it lands
 *     [--widths 1440,390]        viewport widths (default 1440 desktop, 390 mobile)
 *     [--wait 800]               extra ms to wait after load for data/charts to render
 *
 * Output (in --out):
 *   <route>-<width>.png          full-page screenshots ("root" for /)
 *   report.json                  per-route console errors, failed requests, horizontal overflow,
 *                                and nav click results
 *
 * Requires the `playwright` package. If it isn't resolvable, install it outside the project:
 *   npm i --prefix /tmp/pw playwright && npx --prefix /tmp/pw playwright install chromium
 *   NODE_PATH=/tmp/pw/node_modules node capture.cjs ...
 */
const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Cannot load "playwright". See the install note at the top of this file.');
  process.exit(2);
}

function parseArgs(argv) {
  const args = { widths: '1440,390', wait: '800' };
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  if (!args.base || !args.routes || !args.out) {
    console.error('Required: --base <url> --routes </a,/b> --out <dir>');
    process.exit(2);
  }
  return {
    base: args.base.replace(/\/$/, ''),
    routes: args.routes.split(',').map((r) => r.trim()).filter(Boolean),
    out: args.out,
    nav: args.nav || null,
    widths: args.widths.split(',').map(Number),
    wait: Number(args.wait),
  };
}

const slug = (route) => (route === '/' ? 'root' : route.replace(/^\//, '').replace(/[^\w-]+/g, '_'));

async function visit(browser, opts, route, width) {
  const isMobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: isMobile ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
  page.on('requestfailed', (r) => failedRequests.push(`FAILED ${r.method()} ${r.url()}`));

  let loadError = null;
  try {
    await page.goto(opts.base + route, { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    loadError = e.message.split('\n')[0];
  }
  await page.waitForTimeout(opts.wait);

  // Horizontal overflow: the page is wider than the viewport, so users get a sideways scroll.
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyTextLength: (document.body.innerText || '').trim().length,
  })).catch(() => ({ scrollWidth: 0, clientWidth: 0, bodyTextLength: 0 }));

  const file = `${slug(route)}-${width}.png`;
  await page.screenshot({ path: path.join(opts.out, file), fullPage: true }).catch(() => {});
  await context.close();

  return {
    route, width, screenshot: file, loadError,
    horizontalOverflowPx: Math.max(0, metrics.scrollWidth - metrics.clientWidth),
    rendered: metrics.bodyTextLength > 20,
    consoleErrors, failedRequests,
  };
}

async function clickNav(browser, opts) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(opts.base + opts.routes[0], { waitUntil: 'networkidle', timeout: 20000 });
  const hrefs = await page.$$eval(opts.nav, (els) => els.map((a) => a.getAttribute('href')));
  const results = [];
  for (const href of [...new Set(hrefs)]) {
    const link = page.locator(`${opts.nav}[href="${href}"]`).first();
    try {
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      const landed = new URL(page.url()).pathname;
      results.push({ href, landed, ok: landed === href });
    } catch (e) {
      results.push({ href, landed: null, ok: false, error: e.message.split('\n')[0] });
    }
  }
  await context.close();
  return { selector: opts.nav, links: results };
}

(async () => {
  const opts = parseArgs(process.argv);
  fs.mkdirSync(opts.out, { recursive: true });
  const browser = await chromium.launch();
  const pages = [];
  for (const route of opts.routes) {
    for (const width of opts.widths) {
      const r = await visit(browser, opts, route, width);
      pages.push(r);
      const flags = [
        r.loadError && 'LOAD ERROR',
        !r.rendered && 'EMPTY',
        r.horizontalOverflowPx > 0 && `overflow ${r.horizontalOverflowPx}px`,
        r.consoleErrors.length && `${r.consoleErrors.length} console errors`,
      ].filter(Boolean).join(', ');
      console.log(`${route} @${width}: ${flags || 'ok'}`);
    }
  }
  const report = { base: opts.base, capturedAt: new Date().toISOString(), pages };
  if (opts.nav) {
    report.nav = await clickNav(browser, opts);
    const bad = report.nav.links.filter((l) => !l.ok);
    console.log(`nav: ${report.nav.links.length} links, ${bad.length} failed${bad.length ? ': ' + bad.map((b) => b.href).join(', ') : ''}`);
  }
  await browser.close();
  fs.writeFileSync(path.join(opts.out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`report: ${path.join(opts.out, 'report.json')}`);
})().catch((e) => { console.error(e); process.exit(1); });
