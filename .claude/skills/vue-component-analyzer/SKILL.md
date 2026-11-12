---
name: vue-component-analyzer
description: Analyze Vue 3 component structure and apply optimizations for rendering performance, code reuse, component structure and bundle loading - scan the source tree, confirm each issue by reading the code, apply the safe fixes, verify the build still passes, and report what changed and what is left. Use this skill whenever the user asks to audit, review, analyze, optimize, speed up, clean up, refactor or de-duplicate Vue components or a Vue app; mentions slow or janky pages, re-renders, oversized .vue files, copy-pasted helpers or modals, composables, lazy loading or bundle size in a Vue project; or asks "what can we improve in our frontend" for a Vue codebase - even if they don't say "performance" or "reuse" explicitly.
---

# Vue Component Analyzer

Find the places where a Vue 3 codebase does avoidable work at render time, repeats itself, or has outgrown its component boundaries, then fix what can be fixed safely and explain the rest.

The user should end up with a smaller, faster, easier-to-change codebase that **behaves exactly as before**. An optimization that changes what a page shows, drops an event, or breaks a translation is a regression, however clean the diff looks. That is why every step below leans toward confirming before changing and verifying after.

## Workflow

### 1. Scope and project rules

- **Scope.** Work out what the user wants analyzed: one component, a folder, or the whole app. A request about one file gets fixes in that file plus any shared helper it needs; a whole-app request gets the cross-file reuse work. Don't refactor files outside the scope just because the scan flagged them; list those under "Recommended".
- **Project rules.** Read `CLAUDE.md` (repo root and the client folder) and skim two or three representative components. Note the house style (Composition API with `setup()` vs `<script setup>`, where shared helpers live, i18n approach, formatting utilities). Your fixes should look like the rest of the codebase, not like a textbook. Project rules override this skill: if `CLAUDE.md` says `.vue` changes must go through a named agent and you have the Agent tool, delegate the edits with a precise brief (the confirmed findings, the exact changes, the rules in step 4); if you can't delegate, do the work yourself and mention the rule in your report.
- **Baseline.** Run `git status` so your changes can be told apart from the user's. Find the build command (usually `npx vite build` in the client folder) and run it once now, so you know whether failures later are yours.

### 2. Scan

Run the bundled scanner from the repo root:

```bash
node <skill-dir>/scripts/scan.mjs <client-src-dir>                     # whole app
node <skill-dir>/scripts/scan.mjs <client-src-dir> --only views/Foo.vue # one file or folder
```

It reports component sizes and API styles, per-file leads (index keys, template calls that loop over data, debug logs, hardcoded URLs, eager route imports, deep watchers, listeners without cleanup), functions defined in several files (with which ones have identical bodies), and groups of scoped CSS classes repeated across files (a strong sign of a missing shared component).

Treat the output as **leads, not findings**. Regexes can't tell a hot path from a twelve-item list, or the API client's base URL (correct) from a URL hardcoded in a view (not). Duplication is measured across the whole tree even with `--only`, so a single-file run still tells you which of its helpers already exist elsewhere.

### 3. Confirm, look further, and size the impact

Open every flagged file and decide for each lead: real, or dismissed (and why). Then read `references/checklist.md` and look for the issues a scanner can't see: computed-able watchers, inline object props that defeat child memoization, reactive wrappers around large static data, prop drilling, components doing two jobs.

For each real issue, be honest about how much it matters. A method that filters 250 orders twelve times per render is worth fixing; a `getBarHeight()` that scans 12 months is still worth caching, but call it a small win. Rank by actual impact on users and maintainers, not by how many scanner hits a pattern produced.

### 4. Apply the fixes

Apply what is safe, in small groups, building after each group so a failure points at one change.

**Apply directly** - local, behavior-preserving, easy to verify:
- stable `:key`s (a real id, or a natural unique field like `month` / `sku`), never the index
- template calls that loop over data -> `computed` (one computed per distinct argument, or one computed that groups everything at once)
- identical helpers in several files -> one shared module in the project's existing utils/composables location, imported everywhere
- hardcoded API URLs in components -> the project's API client
- leftover `console.log` / debug output removed (keep real `console.error` in catch blocks)
- route components -> lazy `() => import(...)`, except the landing route if the project prefers it eager
- an Options API outlier in a Composition API codebase -> the house style, when that component is in scope
- missing listener / interval cleanup -> add it

**Apply when it is in the requested scope** - structural, worth doing, needs care:
- splitting an oversized component into child components
- extracting a shared base component (modal shell, card, data table) from repeated markup

For these, keep the outside the same: the same props, emits and slots on the parent, the same CSS class names on the rendered DOM (other styles and tests may target them), the same i18n keys. Move code rather than rewriting it. Migrate one or two call sites first, build, then the rest.

**Recommend, don't apply** - anything that changes behavior, UX, the API contract or the backend: pagination, list virtualization, changing what data is fetched, debouncing user input, new dependencies. Explain the trade-off and sketch the change.

Rules that keep fixes safe:
- **Merge only true duplicates.** Helpers with the same name but different bodies (different date formats, different fallbacks) are not duplicates. Either keep them separate or give the shared version an option that reproduces each call site's exact output. Check every call site's output before and after.
- **Keep reactivity intact.** When moving code into a composable or computed, make sure everything that was reactive still is (refs stay refs, props are read through `props.x` or `toRefs`, not destructured).
- **Don't widen the diff.** No reformatting, renaming or "while I'm here" changes outside the findings.

### 5. Verify

- Build after each group of changes, and once at the end. If tests exist (`npm test`, `pytest`, etc.) and touch what you changed, run them.
- If the app is running or easy to start, and you have Playwright (MCP tools or a script), load each route you touched: no new console errors, same visible text and data as before. Compare against the baseline you took; changing a key or a computed should never change what the page shows.
- If a fix breaks something you can't repair quickly, revert that fix and move it to "Recommended" with what went wrong. A smaller set of working changes beats a larger broken one.

### 6. Report

Reply with this structure (and write it to a file only if the user asks):

```markdown
# Vue component analysis: <scope>

## Summary
2-4 sentences: what you changed, the biggest wins, what is left and why.

## Applied
| # | Area | Change | Files | Why it matters |
|---|------|--------|-------|----------------|
Areas: Performance, Reuse, Structure, Bundle. One row per logical change, files as path:line.

## Recommended, not applied
For each: the issue (path:line), why it wasn't applied (out of scope / changes behavior / needs a decision), and a sketch of the fix.

## Checked and dismissed
Scanner leads you looked at and rejected, one line each with the reason, so the user can see they weren't missed.

## Verification
Build result (before and after), tests run, routes checked in the browser, anything you couldn't verify.
```

Keep it scannable: the user should be able to review every applied change from the table and the diff alone.

## Reference files

- `references/checklist.md` - the full catalog of issues by area, with how to spot each one, why it matters, and the fix. Read it during step 3.
- `scripts/scan.mjs` - the scanner (Node 18+, no dependencies).
