# Vue 3 optimization checklist

Each entry: **what to look for**, why it matters, and the fix. `[scan]` means `scripts/scan.mjs` reports leads for it; the rest you find by reading. Entries are roughly ordered by how often they pay off.

Contents: 1. Rendering performance - 2. Code reuse - 3. Component structure - 4. Bundle and loading

---

## 1. Rendering performance

Vue re-runs a component's render function whenever any reactive value it read changes. Anything expensive inside the template runs on *every* re-render, for every row of every `v-for`. `computed` values are cached until their dependencies change, which is why most fixes here are "move it into a computed".

**Template calls that loop over data** `[scan: template-call-loops]`
- Look for: `{{ getItemsByStatus('x').length }}`, `v-for="item in filterThings(a)"`, `:style="{ height: barHeight(v) }"` where the function filters, sorts, maps or scans an array.
- Why: runs on every render; inside a `v-for` it becomes O(n²). Called several times for the same argument, it repeats identical work.
- Fix: one `computed` per argument, or one computed that groups everything (`const byStatus = computed(() => groupBy(orders.value, 'status'))`) and then `byStatus.value.shipped`. For per-row values that depend on a global (e.g. a max), compute the global once (`const maxRevenue = computed(...)`) and keep the per-row function trivial.
- Not an issue: cheap pure formatters (`formatCurrency(x)`), `t('key')` translations. A loop over a string's characters is not a loop over data.

**Index used as `:key`** `[scan: index-key]`
- Look for: `v-for="(x, i) in list" :key="i"`.
- Why: when the list is filtered, sorted or spliced, Vue reuses the wrong DOM nodes and component state (inputs, expanded rows, transitions) moves to the wrong item.
- Fix: a real id, or a natural unique field (`month`, `sku`, `quarter`). For child arrays without ids, combine parent id and a unique field (`` `${order.id}-${item.sku}` ``). Index keys are acceptable only for static lists that never reorder; say so if you leave one.

**`v-if` and `v-for` on the same element** `[scan: v-if-with-v-for]`
- Why: in Vue 3 `v-if` runs first and cannot see the loop variable; usually a bug, always unclear.
- Fix: filter in a computed, or move `v-if` to a wrapping `<template>`.

**Watchers that should be computed**
- Look for: `watch(a, () => { b.value = deriveFrom(a.value) })`.
- Why: an extra reactive write and render cycle; easy to get out of sync.
- Fix: `const b = computed(() => deriveFrom(a.value))`. Keep `watch` for side effects (fetching, storage, focus).

**Deep watchers** `[scan: deep-watch]`
- Why: `deep: true` traverses the whole object on every change.
- Fix: watch the specific fields (`() => [filters.a, filters.b]`) or a getter.

**Large static data made reactive**
- Look for: big constant arrays/objects (lookup tables, chart configs, translations) in `ref()`/`reactive()`/`data()`.
- Fix: plain module-level constants, or `shallowRef`/`markRaw` when a reference must be swapped.

**Inline objects and functions passed as props to heavy children**
- Look for: `<Chart :options="{ ... }">`, `:style="{...}"` on many rows of a child component.
- Why: a new object every render makes the child re-render even if nothing changed.
- Fix: hoist to a constant or a computed.

**`v-if` vs `v-show`**
- Toggled often and cheap to keep (tabs, dropdowns, modals reopened repeatedly) -> `v-show`. Rarely shown or expensive to build -> `v-if`. Modals with `<Teleport>` and `<Transition>` usually stay `v-if`; don't churn them.

**Event listeners and timers without cleanup** `[scan: listener-no-cleanup]`
- Fix: remove in `onUnmounted` / `onBeforeUnmount`. A leak grows each time the component remounts.

**Debug logging** `[scan: console-log]`
- `console.log` in render paths (formatters called per cell) is a real cost and floods the console. Remove; keep `console.error` in catch blocks.

**Long lists** (recommend, don't apply)
- Hundreds of rows with rich cells: suggest pagination or virtualization, since both change UX.

---

## 2. Code reuse

**Helpers copy-pasted across files** `[scan: Functions defined in 2+ files]`
- Look for: `formatDate`, `translateCategory`, `getStatusClass`, `close`, dropdown toggle/blur handlers in several components.
- Fix: one module in the project's existing location (`utils/`, `composables/`), imported everywhere. Pure functions -> `utils/x.js`; anything using refs, lifecycle or i18n -> `composables/useX.js`.
- Caution: same name is not the same behavior. The scanner shows how many body variants exist. Compare outputs per call site (date format, locale, fallback for empty values). Merge only identical behavior, or add an explicit option so each call site keeps its exact output.

**Repeated component shells** `[scan: Repeated scoped markup]`
- Look for: several components defining the same scoped classes (`.modal-overlay`, `.modal-header`, `.close-button`), the same `<Teleport><Transition>` wrapper, the same close/Escape handling.
- Fix: a base component (`BaseModal.vue`) with slots (`header`/default/`footer`), props for title/size, and the shared behavior (overlay click, Escape, focus) implemented once. Keep the existing class names on the rendered elements so global styles and tests still match. Migrate one consumer, verify, then the rest. If the shell differs in meaningful ways between consumers, support it through props/slots rather than forcing one look.
- Note in the report that consolidating behavior (e.g. Escape-to-close) also fixes inconsistencies, since only some copies had it.

**Data fetching outside the API client** `[scan: hardcoded-url]`
- Look for: `axios.get('http://localhost:8001/...')` in components.
- Fix: add a method to the existing API module and call that. The base URL in the API module itself is fine; dismiss that lead.

**Hand-written formatters next to an existing utility**
- Look for: custom number/currency/date formatting loops when the project has `utils/currency.js` or uses `Intl`.
- Fix: use the shared utility or `Intl.NumberFormat` / `toLocaleString`, matching the existing output exactly (decimal places, separators, currency symbol).

**Repeated stateful logic**
- Look for: the same `loading/error/data` + `onMounted(load)` + `watch(filters, load)` pattern in many views.
- Fix: a composable (`useAsyncData(loader, deps)`) only if at least three views share it closely; otherwise recommend, since a premature abstraction is worse than duplication.

---

## 3. Component structure

**Oversized components** `[scan: large-component]`
- Size alone isn't the problem; mixed responsibilities are. A 1,200-line view with five independent cards, each with its own data shaping, is a good split candidate. A 450-line modal that is mostly CSS is not.
- Fix: extract self-contained sections (a card, a table, a chart) into child components that take data via props and emit events. Keep data fetching and filter wiring in the parent unless a section owns its own data. Move the section's scoped styles with it.

**API style outliers** `[scan: api-style-outlier]`
- An Options API component in a Composition API codebase (or the reverse) is harder to maintain and can't use shared composables naturally. Convert to the house style when it's in scope: `data` -> `ref`, `computed` -> `computed()`, `methods` -> functions, `mounted` -> `onMounted`, `this.x` -> `x.value`.

**Prop drilling**
- Look for: a prop passed through two or more components that don't use it.
- Fix: `provide`/`inject` or an existing composable for shared state. Usually recommend rather than apply.

**Props mutated in children**
- Look for: `props.item.x = ...` or `v-model` bound to a prop.
- Fix: emit an event or use `defineModel`/`update:x`. This is a correctness fix; apply it when in scope.

**Mixed `setup()` and `<script setup>`**
- Not a problem by itself if the project already mixes them. Don't convert files just for uniformity unless asked.

---

## 4. Bundle and loading

**Eagerly imported route components** `[scan: eager-routes]`
- Fix: `component: () => import('./views/Reports.vue')`. Every page except the first one becomes its own chunk, loaded on first navigation. Keep the landing route eager if the project prefers a fast first paint. Check that the build output shows separate chunks.

**Heavy libraries imported whole** `[scan: heavy-import]`
- `import _ from 'lodash'`, `moment`, full chart libraries. Fix: per-function imports (`lodash-es/debounce`), native `Intl`/`Date`, or `defineAsyncComponent` for the component that needs the library.

**Rarely used heavy components**
- Big modals or charts that most users never open: `defineAsyncComponent(() => import('./HeavyModal.vue'))`.

**Verifying bundle work**
- Compare `vite build` output before and after (chunk names and sizes). Report the numbers rather than "smaller bundle".
