# Design system reference

Tokens and component recipes for the SaaS redesign. Adapt values to the project's existing palette and rules; keep the structure.

## Contents

1. Tokens
2. App shell (layout CSS, sidebar component, top bar)
3. Icons
4. Component recipes: page header, cards, KPI tiles, tables, badges, buttons, inputs, modals
5. Polish checklist

---

## 1. Tokens

Put this in the global (unscoped) stylesheet. The values are a neutral slate base that suits most dashboards. If the project defines a palette (e.g. in CLAUDE.md), map its colors onto these names rather than introducing new ones.

```css
:root {
  /* Spacing: 4px scale. Use these for every margin, padding and gap. */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Neutrals */
  --color-bg: #f8fafc;          /* app background */
  --color-surface: #ffffff;     /* cards, sidebar, top bar */
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;

  /* Accent (one, used sparingly: active nav, primary buttons, focus, links) */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-soft: #eff6ff;

  /* Status: text color + soft background pairs */
  --color-success: #15803d; --color-success-soft: #f0fdf4;
  --color-info:    #1d4ed8; --color-info-soft:    #eff6ff;
  --color-warning: #a16207; --color-warning-soft: #fefce8;
  --color-danger:  #b91c1c; --color-danger-soft:  #fef2f2;

  /* Shape and depth: subtle. Borders do most of the work; shadows are for overlays. */
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.05);
  --shadow-md: 0 4px 12px rgb(15 23 42 / 0.08);
  --shadow-lg: 0 12px 32px rgb(15 23 42 / 0.14);

  /* Type */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 0.9375rem;
  --text-lg: 1.125rem; --text-xl: 1.375rem; --text-2xl: 1.75rem;
  --weight-normal: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;

  /* Layout */
  --sidebar-width: 248px;
  --sidebar-width-collapsed: 68px;
  --topbar-height: 60px;
  --content-max-width: 1440px;
  --transition: 150ms ease;
}
```

Why these choices: a 4px scale gives enough steps for dense dashboards while keeping rhythm; one accent color keeps the UI calm (status colors carry meaning, so they shouldn't double as decoration); borders instead of heavy shadows are what makes modern SaaS UIs look "flat but layered".

---

## 2. App shell

### Layout CSS (global)

```css
body { margin: 0; background: var(--color-bg); color: var(--color-text);
       font-family: var(--font-sans); font-size: var(--text-base); line-height: 1.5;
       -webkit-font-smoothing: antialiased; }

.app-shell { display: flex; min-height: 100vh; }

.app-main {
  flex: 1;
  min-width: 0;                       /* lets wide tables scroll instead of pushing the layout */
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition);
  display: flex; flex-direction: column;
}
.app-shell.is-collapsed .app-main { margin-left: var(--sidebar-width-collapsed); }

.app-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-6) var(--space-8) var(--space-12);
  box-sizing: border-box;
}

@media (max-width: 1023px) {
  .app-main, .app-shell.is-collapsed .app-main { margin-left: 0; }
  .app-content { padding: var(--space-4) var(--space-4) var(--space-10); }
}
```

### Sidebar component (reference — adapt names, routes, i18n and icons)

```vue
<template>
  <div v-if="mobileOpen" class="sidebar-backdrop" @click="$emit('close')" />
  <aside :class="['sidebar', { 'is-collapsed': collapsed, 'is-open': mobileOpen }]">
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">IM</span>
      <div v-if="!collapsed" class="brand-text">
        <span class="brand-name">{{ t('nav.companyName') }}</span>
        <span class="brand-sub">{{ t('nav.subtitle') }}</span>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Main">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :exact-active-class="item.exact ? 'is-active' : ''"
        :active-class="item.exact ? '' : 'is-active'"
        :title="collapsed ? item.label : undefined"
        @click="$emit('navigate')"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="item.icon" />
        <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <button class="sidebar-collapse" type="button"
            :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="$emit('toggle-collapse')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/></svg>
    </button>
  </aside>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'   // or the project's i18n

export default {
  name: 'AppSidebar',
  props: { collapsed: Boolean, mobileOpen: Boolean },
  emits: ['close', 'navigate', 'toggle-collapse'],
  setup() {
    const { t } = useI18n()
    // Labels are computed so they react to language changes.
    const items = computed(() => [
      { to: '/', label: t('nav.overview'), icon: ICONS.dashboard, exact: true },
      // …one entry per route, same i18n keys the old nav used
    ])
    return { t, items }
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed; inset: 0 auto 0 0; z-index: 40;
  width: var(--sidebar-width);
  display: flex; flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition), transform var(--transition);
}
.sidebar.is-collapsed { width: var(--sidebar-width-collapsed); }

.sidebar-brand { display: flex; align-items: center; gap: var(--space-3);
  height: var(--topbar-height); padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border); }
.brand-mark { display: grid; place-items: center; flex: none; width: 32px; height: 32px;
  border-radius: var(--radius-md); background: var(--color-text); color: var(--color-surface);
  font-size: var(--text-xs); font-weight: var(--weight-bold); }
.brand-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
.brand-name { font-weight: var(--weight-semibold); font-size: var(--text-sm);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand-sub { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; }

.sidebar-nav { flex: 1; overflow-y: auto; padding: var(--space-3); display: flex;
  flex-direction: column; gap: var(--space-1); }
.nav-item { display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
  color: var(--color-text-muted); text-decoration: none;
  font-size: var(--text-sm); font-weight: var(--weight-medium);
  transition: background var(--transition), color var(--transition); }
.nav-item:hover { background: var(--color-surface-muted); color: var(--color-text); }
.nav-item.is-active { background: var(--color-accent-soft); color: var(--color-accent); }
.nav-item:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.nav-icon { flex: none; width: 20px; height: 20px; fill: none; stroke: currentColor;
  stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.sidebar.is-collapsed .nav-item { justify-content: center; padding: var(--space-2); }

.sidebar-collapse { margin: var(--space-3); padding: var(--space-2); border: 0; border-radius: var(--radius-md);
  background: transparent; color: var(--color-text-muted); cursor: pointer; }
.sidebar-collapse svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.75; }
.sidebar.is-collapsed .sidebar-collapse svg { transform: rotate(180deg); }

.sidebar-backdrop { position: fixed; inset: 0; z-index: 39; background: rgb(15 23 42 / 0.4); }

@media (max-width: 1023px) {
  .sidebar, .sidebar.is-collapsed { width: var(--sidebar-width); transform: translateX(-100%);
    box-shadow: var(--shadow-lg); }
  .sidebar.is-open { transform: translateX(0); }
  .sidebar-collapse { display: none; }
}
@media (min-width: 1024px) { .sidebar-backdrop { display: none; } }
</style>
```

`v-html` on the icon is safe here because the SVG strings are constants in the component, never user data. If the project's lint rules forbid `v-html`, render icons as small components instead.

### Shell wiring (in App.vue or a layout component)

- State: `collapsed` (persisted: read/write `localStorage` inside try/catch) and `mobileOpen`.
- Close the drawer on route change (`watch(() => route.fullPath, () => mobileOpen.value = false)`) and on Escape (`keydown` listener added in `onMounted`, removed in `onUnmounted`).
- Root element gets `class="app-shell"` plus `is-collapsed` when collapsed.

### Top bar

```css
.topbar { position: sticky; top: 0; z-index: 30; height: var(--topbar-height);
  display: flex; align-items: center; gap: var(--space-4); padding: 0 var(--space-8);
  background: rgb(255 255 255 / 0.85); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border); }
.topbar-title { font-size: var(--text-lg); font-weight: var(--weight-semibold); margin: 0; }
.topbar-actions { margin-left: auto; display: flex; align-items: center; gap: var(--space-3); }
.topbar-menu { display: none; }   /* hamburger, shown < 1024px */
@media (max-width: 1023px) {
  .topbar { padding: 0 var(--space-4); }
  .topbar-menu { display: inline-grid; place-items: center; width: 36px; height: 36px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
}
```

The page title can come from a route `meta.title`/i18n key or from the active nav item's label — reuse the sidebar items array so there is one source of truth.

A global filter bar becomes a compact toolbar directly under the top bar (same horizontal padding as the content, `--space-3` vertical, white surface, bottom border), or its selects move into `.topbar-actions` if there are only one or two.

---

## 3. Icons

Stroke icons on a 24×24 grid (Lucide-style, ISC license), drawn with `currentColor`. Pass the inner markup as a string:

```js
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  package:   '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.7 4.73a2 2 0 0 0 2 0L20.7 7"/>',
  cart:      '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  wallet:    '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  trending:  '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  chart:     '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  list:      '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  users:     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  settings:  '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  menu:      '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:     '<path d="M18 6 6 18M6 6l12 12"/>'
}
```

Pick the icon by meaning (inventory → package, orders → cart, finance/spending → wallet, forecast → trending, reports → chart, backlog/tasks → list, people → users, settings → settings).

---

## 4. Component recipes

Apply these to the project's existing class names where possible (e.g. restyle `.card` rather than inventing `.ui-card`), because views already use them.

```css
/* Page header: same on every page */
.page-header { display: flex; align-items: flex-end; justify-content: space-between;
  gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6); }
.page-header h2 { margin: 0; font-size: var(--text-2xl); font-weight: var(--weight-semibold);
  letter-spacing: -0.01em; }
.page-header p { margin: var(--space-1) 0 0; color: var(--color-text-muted); font-size: var(--text-sm); }

/* Card */
.card { background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm); }
.card + .card, .card-grid + .card { margin-top: var(--space-6); }
.card-header { display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-3); margin-bottom: var(--space-4); }
.card-title { margin: 0; font-size: var(--text-base); font-weight: var(--weight-semibold); }

/* KPI / stat tiles */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: var(--space-5); }
.stat-label { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { margin-top: var(--space-2); font-size: var(--text-2xl); font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums; }

/* Tables: always wrapped so they scroll on small screens */
.table-container { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
  background: var(--color-surface); }
table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
th { text-align: left; padding: var(--space-3) var(--space-4); background: var(--color-surface-muted);
  color: var(--color-text-muted); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--color-border);
  white-space: nowrap; }
td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--color-surface-muted); }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }

/* Badges */
.badge { display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-2);
  border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--weight-medium); }
.badge.success { background: var(--color-success-soft); color: var(--color-success); }
.badge.info    { background: var(--color-info-soft);    color: var(--color-info); }
.badge.warning { background: var(--color-warning-soft); color: var(--color-warning); }
.badge.danger  { background: var(--color-danger-soft);  color: var(--color-danger); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); height: 36px; padding: 0 var(--space-4);
  border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface);
  color: var(--color-text); font: inherit; font-size: var(--text-sm); font-weight: var(--weight-medium);
  cursor: pointer; transition: background var(--transition), border-color var(--transition); }
.btn:hover { background: var(--color-surface-muted); }
.btn-primary { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.btn-primary:hover { background: var(--color-accent-hover); }
.btn:focus-visible, select:focus-visible, input:focus-visible {
  outline: 2px solid var(--color-accent); outline-offset: 2px; }

/* Inputs and selects */
input, select, textarea { height: 36px; padding: 0 var(--space-3); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text);
  font: inherit; font-size: var(--text-sm); }
textarea { height: auto; padding: var(--space-2) var(--space-3); }

/* Modals */
.modal-overlay { background: rgb(15 23 42 / 0.45); backdrop-filter: blur(2px); }
.modal { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border); max-width: min(640px, calc(100vw - 2 * var(--space-4))); }
.modal-header, .modal-body, .modal-footer { padding: var(--space-5) var(--space-6); }
.modal-header { border-bottom: 1px solid var(--color-border); }
.modal-footer { border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: var(--space-3); }
```

---

## 5. Polish checklist

The details that separate "restyled" from "professional":

- One accent color; status colors only for status.
- Numbers right-aligned with `tabular-nums` in tables and KPI tiles.
- Consistent vertical rhythm: `--space-6` between page sections, `--space-4` inside grids, `--space-6` card padding (`--space-5` for tiles).
- Text hierarchy through size and weight, not color variety: titles `--color-text`, secondary `--color-text-muted`, hints `--color-text-subtle`.
- Hover and focus states on everything clickable; `cursor: pointer` on clickable rows and cards.
- Empty, loading and error states styled like the rest (muted text, centered, inside the card).
- No emojis as icons. No gradients or heavy shadows on cards.
- Charts: muted gridlines (`--color-border`), axis labels `--color-text-muted` at `--text-xs`, series colors from the accent/status palette.
