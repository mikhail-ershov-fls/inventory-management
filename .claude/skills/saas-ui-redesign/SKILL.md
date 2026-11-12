---
name: saas-ui-redesign
description: Redesign a Vue 3 application's UI into a modern, professional SaaS-style interface — left vertical navigation sidebar instead of a top nav bar, a slim top bar, a token-based spacing/color/typography system, and consistent cards, tables, badges and forms across every page — while keeping all existing behavior, data loading and i18n intact, and verifying the result with before/after screenshots. Use this skill whenever the user wants to modernize, restyle, refresh, polish or "make professional" a Vue app, move navigation into a sidebar, fix inconsistent spacing or a dated look, or make a Vue dashboard/admin panel look like a modern SaaS product (Linear, Stripe, Vercel style), even if they don't say "redesign" or "sidebar" explicitly.
---

# SaaS UI Redesign for Vue 3

Turn a Vue 3 app with a dated or inconsistent UI into a calm, modern SaaS interface: a fixed left sidebar for navigation, a slim top bar for page-level controls, and one shared set of design tokens that every page uses.

The job is **visual and structural only**. Users of the app should find every feature where they expect it, just better presented. Data loading, API calls, filters, i18n, emitted events and business logic stay exactly as they are — a redesign that breaks a filter or drops a menu item is a regression, no matter how good it looks.

## Workflow

Work through these phases in order. Each one feeds the next, and skipping the survey or the baseline is the most common way to ship a redesign that silently loses functionality.

### 1. Survey the app (read before you touch anything)

Build a short inventory, in your head or a scratch file:

- **Project rules.** Read `CLAUDE.md` files at the repo root and in the client folder. They often specify a palette, "no emojis", component conventions, or that `.vue` edits must go through a particular agent. Project rules override this skill's defaults. If a rule says to delegate `.vue` changes to a named agent and you have the Agent tool, delegate the implementation phases to it with a precise brief (tokens, file list, the rules below); if you can't delegate (e.g. you are already a subagent without that tool), do the work yourself and mention the rule in your report.
- **Shell and navigation.** Find where the current nav lives (usually `App.vue` or a `NavBar`/`Header` component) and list *every* item in it: route links, logo/brand text, language switcher, profile menu, notifications, search, buttons. Each one needs a new home.
- **Routes.** Read the router config. List every route and its label (find the i18n key if labels are translated). Note views that exist but aren't routed — don't add them unless the user asks.
- **Global styles.** Find where shared classes (`.card`, `.stat-card`, `.page-header`, tables, badges) are defined — often an unscoped `<style>` in `App.vue` or a `style.css`. These are your highest-leverage edit points.
- **Page-level controls.** Filter bars, toolbars, tabs. Decide whether each belongs in the top bar or stays in the page.
- **Existing visual language.** Colors, fonts, status colors, chart colors. Keep the brand recognizable; the goal is polish, not a new brand.

### 2. Capture a baseline

Start the dev server (or use one already running — check the port first) and capture every route before changing anything:

```bash
node <skill-dir>/scripts/capture.cjs --base http://localhost:<port> \
  --routes /,/orders,/settings --out <dir>/before
```

The script saves desktop (1440px) and mobile (390px) screenshots per route and writes `report.json` with console errors, failed requests and horizontal overflow. It needs the `playwright` package: if `require('playwright')` fails, install it outside the project (`npm i --prefix /tmp/pw playwright && npx --prefix /tmp/pw playwright install chromium`) and run with `NODE_PATH=/tmp/pw/node_modules`. If Playwright MCP tools are available you can use them instead, but the script gives you a comparable before/after record in one command.

The baseline matters for two reasons: you can compare visually at the end, and **errors present before you started are not yours** — record them so you neither panic about them nor hide new ones behind them.

### 3. Establish design tokens

Add one `:root` block of CSS custom properties in the global stylesheet. Read `references/design-system.md` for the full token set and rationale; the essentials are:

- a 4px-based spacing scale (`--space-1` … `--space-12`) — this is what makes spacing *consistent*, so use it everywhere instead of ad-hoc pixel values;
- neutral surface/border/text colors plus one accent and the four status colors (keep the project's existing palette if it has one);
- radius, shadow, font-size and font-weight scales;
- layout values: `--sidebar-width`, `--sidebar-width-collapsed`, `--topbar-height`, `--content-max-width`.

Define tokens first, then build with them. Retro-fitting tokens after styling is twice the work.

### 4. Build the app shell

Replace the top nav with a sidebar + top bar layout. Recipes and a reference component are in `references/design-system.md` ("App shell"). Key decisions:

- **Sidebar (left, full height, fixed).** Brand at the top, nav links with icons and labels, optional section headings when there are more than ~6 items, user/profile area pinned at the bottom if the old nav had one. Use `<router-link>` and Vue Router's `router-link-active` / `router-link-exact-active` classes for the active state (use exact matching for `/` so the home item isn't always active). Icons: inline SVG (stroke style, 20px, `currentColor`) — no emoji, no new icon dependency unless the project already has one.
- **Top bar (slim, sticky).** Current page title on the left; page-level controls (filters, language switcher, profile menu) on the right. If the app has a filter bar that applies to all pages, it can live in the top bar or directly under it as a compact toolbar — keep it visible, users rely on it.
- **Responsive.** Below ~1024px the sidebar becomes an off-canvas drawer opened by a menu button in the top bar, with a backdrop, closes on navigation and on Escape. Optionally offer a collapse-to-icons toggle on desktop; persist it in `localStorage` (guarded with try/catch).
- **Main area.** Offset by the sidebar width, padded with spacing tokens, content constrained by `--content-max-width`, own scroll.
- **Accessibility.** `<nav aria-label="Main">`, `aria-current="page"` on the active link (router-link does this), visible focus rings, the drawer toggle has `aria-expanded` and an accessible label, and every icon-only button has `aria-label`.

Move each item from your survey into the new shell. Preserve every component, prop, emitted event, and `t('…')` call — re-parent components rather than rewriting them. Keep translated labels translated; don't hard-code English where the old nav used i18n keys.

### 5. Consistency pass across pages

With the shell in place, walk through every view and the shared global classes:

- Replace hard-coded margins/paddings/gaps with spacing tokens; give every page the same page-header pattern (title, optional description, optional actions) and the same gap between sections.
- Unify cards, stat/KPI tiles, tables, badges, buttons, inputs and modals on the recipes in `references/design-system.md`. Prefer fixing the shared class once over patching each page.
- Keep charts' data logic untouched; restyle only colors, fonts, gridlines and containers.
- Don't add features, rename things, or change copy unless needed for the layout. Template changes should be wrappers and classes, not logic.

Edit scoped styles in place; keep each component's existing script untouched unless the shell requires it (e.g. drawer state).

### 6. Verify

1. **Build.** Run the production build (`npm run build` or the project's equivalent). It must pass.
2. **Capture after.** Run `capture.cjs` again into `<dir>/after` with the same routes, plus `--nav "nav a[href]"` (or a more specific selector) so the script clicks every sidebar link and confirms it navigates.
3. **Compare against baseline.** In `after/report.json`: every route rendered, no console errors that weren't in the baseline, no horizontal overflow at 390px, every nav link reached its route. Look at the screenshots yourself — tokens can be applied perfectly and the page can still look wrong.
4. **Exercise the preserved controls.** Change a filter, switch language (if there is one), open the profile menu and a modal, open and close the mobile drawer. If the Playwright MCP tools are available, use them; otherwise a short ad-hoc Playwright script is fine.

Fix what you find and re-run until clean.

### 7. Report

Finish with a short report for the user:

- what changed (shell, tokens, which shared classes and views were restyled);
- where each old nav item lives now;
- verification results (build, routes, nav clicks, overflow, console errors) and where the before/after screenshots are;
- pre-existing problems you noticed but deliberately left alone (e.g. API calls that 404, unrouted views), so they aren't mistaken for regressions.

## Things that commonly go wrong

- **Lost controls.** The old header held a language switcher or profile menu that never made it into the new shell. The survey list is your checklist.
- **Always-active home link.** `/` matches every route unless you use exact-active.
- **Double scrollbars / content under the sidebar.** The main area must be offset by the sidebar width and only the main area should scroll.
- **Mobile overflow.** Wide tables need their own `overflow-x: auto` wrapper; fixed-width grids need `minmax()`/`auto-fit`.
- **Breaking global classes.** Classes like `.card` or `.badge` in an unscoped stylesheet are used by many views — check usages (`grep`) before renaming one.
- **Hard-coded English.** Sidebar labels must use the same i18n keys the old nav used.
