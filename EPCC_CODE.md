# Implementation: Inventory CSV Export

**Mode**: default | **Date**: 2026-11-12 | **Status**: Complete

## 1. Changes (5 files, ~+190 lines)

**Created**: `client/src/utils/csv.js` - framework-free CSV builder (`toCsv`, `escapeCsvCell`), browser download helper, local-date stamp
**Created**: `client/src/utils/csv.test.js` - 9 unit tests (`node --test src/utils/` from `client/`)
**Modified**: `client/src/views/Inventory.vue` - "Export CSV" button next to search, `exportCsv` handler, button styles, ≤640px header wrap
**Modified**: `client/src/locales/en.js`, `ja.js` - `inventory.exportCsv`, `inventory.exportCsvTitle`

## 2. Quality (Unit 9/9 | E2E verified | Build clean)

**E2E** (headless Chromium against the running app): file `inventory-YYYY-MM-DD.csv` with UTF-8 BOM; 32 table rows → 32 CSV rows in the same order; search "sensor" → 5 rows in both; button disabled when search matches nothing; no console errors; no horizontal overflow at 390px width.
**Security**: Cells starting with `= + - @` are prefixed with `'` (CSV formula injection); RFC 4180 quoting.

## 3. Decisions

**Client-side export**: Generated from `filteredItems` | Why: exports exactly what the user sees (warehouse/category filters + search + sort), no backend change | Alt: `GET /api/inventory/export` endpoint
**Raw numbers**: No currency symbol or thousands separators; cost columns labelled `(USD)` | Why: spreadsheets keep them numeric. The on-screen table shows `¥` with unconverted USD values in JPY mode; the CSV stays unambiguous instead of copying that.
**Localised text**: Headers, product names, categories, warehouses and statuses follow the active language; BOM added so Excel reads Japanese correctly.

## 4. Handoff

**Run**: `/epcc-commit` when ready
**Blockers**: None
**TODOs**: Japanese-mode export not exercised in the browser (labels come from the same `t()` calls the table uses). No frontend test runner in `package.json`; consider adding a `test` script. The existing `¥`-with-USD-values display in the table is a separate pre-existing bug.
