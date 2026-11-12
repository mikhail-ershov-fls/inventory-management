#!/usr/bin/env node
// Static scan of a Vue 3 source tree. Produces leads, not verdicts: every hit must be
// confirmed by reading the code before it becomes a finding.
//
// Usage: node scan.mjs <src-dir> [--json] [--only <file-or-dir>]
//   <src-dir>  the app's source root (e.g. client/src). Duplication is always measured
//              across the whole tree, even with --only.
//   --only     limit per-file checks to one file or folder (relative to cwd or src-dir).
// No dependencies; Node 18+.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const onlyIdx = args.indexOf('--only')
const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null
const srcDir = args.find((a, i) => !a.startsWith('--') && !(onlyIdx !== -1 && i === onlyIdx + 1))
if (!srcDir || !fs.existsSync(srcDir)) {
  console.error('Usage: node scan.mjs <src-dir> [--json] [--only <file-or-dir>]')
  process.exit(2)
}
const root = path.resolve(srcDir)
const onlyAbs = only ? path.resolve(fs.existsSync(only) ? only : path.join(root, only)) : null

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.vite'])
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(vue|js|ts|mjs)$/.test(e.name) && !/\.(spec|test)\./.test(e.name)) out.push(p)
  }
  return out
}
const files = walk(root)
const rel = p => path.relative(root, p)
const inScope = p => !onlyAbs || p === onlyAbs || p.startsWith(onlyAbs + path.sep)
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length

function blocks(text) {
  // Outermost <template>, <script>, <style> blocks with their starting line.
  const get = (tag) => {
    const out = []
    const re = new RegExp(`<${tag}(\\s[^>]*)?>`, 'g')
    let m
    while ((m = re.exec(text))) {
      const start = m.index + m[0].length
      const end = tag === 'template' ? text.lastIndexOf('</template>') : text.indexOf(`</${tag}>`, start)
      if (end < start) continue
      out.push({ attrs: m[1] || '', body: text.slice(start, end), line: lineOf(text, start) })
      if (tag === 'template') break
      re.lastIndex = end
    }
    return out
  }
  return { template: get('template')[0], scripts: get('script'), styles: get('style') }
}

const findings = []   // { check, area, file, line, detail }
const add = (check, area, file, line, detail) => findings.push({ check, area, file: rel(file), line, detail })

// Function definitions across all files, for duplication analysis
const defs = new Map() // name -> [{file, line, hash, size}]
function recordDefs(file, code, baseLine) {
  const re = /(?:^|\n)[ \t]*(?:export\s+)?(?:const|let|function)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|\()/g
  let m
  while ((m = re.exec(code))) {
    const name = m[1]
    const start = m.index
    // Body: from the first "{" after the signature to its matching "}" (best effort)
    const open = code.indexOf('{', start + m[0].length - 1)
    let body = ''
    if (open !== -1 && open - (start + m[0].length) < 40) {
      let depth = 0, i = open
      for (; i < code.length; i++) {
        if (code[i] === '{') depth++
        else if (code[i] === '}' && --depth === 0) break
      }
      body = code.slice(open, i + 1)
    }
    if (!body || body.split('\n').length < 3) continue // ignore one-liners
    const norm = body.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim()
    const hash = crypto.createHash('sha1').update(norm).digest('hex').slice(0, 10)
    if (!defs.has(name)) defs.set(name, [])
    defs.get(name).push({ file: rel(file), line: baseLine + lineOf(code, start + 1) - 1, hash, size: body.split('\n').length })
  }
}

// Scoped CSS class definitions, for shared-markup detection
const classDefs = new Map() // class -> Set(file)
const components = []
let routerFile = null

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const isVue = file.endsWith('.vue')

  if (/createRouter\s*\(/.test(text)) routerFile = file

  if (!isVue) {
    recordDefs(file, text, 1)
    if (inScope(file)) scanScript(file, text, 1, text)
    continue
  }

  const { template, scripts, styles } = blocks(text)
  const scriptText = scripts.map(s => s.body).join('\n')
  const isSetupSugar = scripts.some(s => /\bsetup\b/.test(s.attrs))
  const hasSetupFn = /\bsetup\s*\(/.test(scriptText)
  const hasOptions = /\b(data\s*\(\s*\)|methods\s*:|computed\s*:\s*\{|mounted\s*\(\s*\))/.test(scriptText)
  const api = isSetupSugar ? 'script-setup' : hasSetupFn && !hasOptions ? 'setup()' : hasOptions && hasSetupFn ? 'mixed' : hasOptions ? 'options' : 'none'
  const lines = text.split('\n').length
  components.push({
    file: rel(file), lines, api,
    templateLines: template ? template.body.split('\n').length : 0,
    scriptLines: scriptText.split('\n').length,
    styleLines: styles.reduce((n, s) => n + s.body.split('\n').length, 0),
    inScope: inScope(file)
  })

  for (const s of scripts) recordDefs(file, s.body, s.line)
  for (const s of styles) {
    if (!/\bscoped\b/.test(s.attrs)) continue
    for (const m of s.body.matchAll(/(?:^|[\s,}])\.([a-zA-Z][\w-]*)\s*[,{:\s]/g)) {
      if (!classDefs.has(m[1])) classDefs.set(m[1], new Set())
      classDefs.get(m[1]).add(rel(file))
    }
  }

  if (!inScope(file)) continue
  if (lines > 400) add('large-component', 'structure', file, 1, `${lines} lines (template ${components.at(-1).templateLines}, script ${components.at(-1).scriptLines}, style ${components.at(-1).styleLines})`)
  for (const s of scripts) scanScript(file, s.body, s.line, text)
  if (template) scanTemplate(file, template, scriptText)
}

function scanScript(file, code, baseLine) {
  const at = idx => baseLine + lineOf(code, idx) - 1
  for (const m of code.matchAll(/console\.(log|debug)\s*\(/g)) add('console-log', 'performance', file, at(m.index), `console.${m[1]} left in code`)
  for (const m of code.matchAll(/['"`](https?:\/\/(?:localhost|127\.0\.0\.1)[^'"`\s]*)/g)) add('hardcoded-url', 'reuse', file, at(m.index), m[1])
  for (const m of code.matchAll(/deep\s*:\s*true/g)) add('deep-watch', 'performance', file, at(m.index), 'deep watcher: traverses the whole object on every change')
  for (const m of code.matchAll(/import\s+[\w{}\s,*]+\s+from\s+['"](lodash|moment|chart\.js|echarts|d3|xlsx|pdfjs-dist)['"]/g)) add('heavy-import', 'bundle', file, at(m.index), `full import of ${m[1]}`)
  for (const m of code.matchAll(/setInterval\s*\(|addEventListener\s*\(/g)) {
    const cleanup = /clearInterval|removeEventListener/.test(code)
    if (!cleanup) add('listener-no-cleanup', 'performance', file, at(m.index), `${m[0].replace(/\s*\($/, '')} without matching cleanup in this file`)
  }
}

function scanTemplate(file, template, scriptText) {
  const t = template.body
  const at = idx => template.line + lineOf(t, idx) - 1

  // v-for with index (or other non-stable) key
  for (const m of t.matchAll(/v-for="\(\s*[\w$]+\s*,\s*([\w$]+)\s*\)\s+in\s+[^"]+"[^>]*?:key="\s*\1\s*"/g)) add('index-key', 'performance', file, at(m.index), `:key="${m[1]}" uses the loop index`)
  for (const m of t.matchAll(/<[^>]*\bv-if="[^"]*"[^>]*\bv-for="|<[^>]*\bv-for="[^"]*"[^>]*\bv-if="/g)) add('v-if-with-v-for', 'performance', file, at(m.index), 'v-if and v-for on the same element')

  // Function calls in the template: names defined as plain functions (not computed) in script
  const fnNames = new Set()
  for (const m of scriptText.matchAll(/(?:const|function)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*(?:async\s*)?\(|\()/g)) fnNames.add(m[1])
  const methodsBlock = scriptText.match(/methods\s*:\s*\{([\s\S]*)/)
  if (methodsBlock) for (const m of methodsBlock[1].matchAll(/^\s{2,6}([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)) fnNames.add(m[1])
  const IGNORE = new Set(['t', '$t', 'emit', 'close', 'open'])
  const calls = new Map()
  // Only expressions: {{ }}, :bind="", v-if/v-show/v-for="" (not @event handlers)
  const exprRe = /\{\{([\s\S]*?)\}\}|(?:\s:[\w.-]+|\sv-(?:if|else-if|show|for|bind:[\w-]+))="([^"]*)"/g
  for (const m of t.matchAll(exprRe)) {
    const expr = m[1] ?? m[2]
    for (const c of expr.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!fnNames.has(c[1]) || IGNORE.has(c[1])) continue
      if (!calls.has(c[1])) calls.set(c[1], [])
      calls.get(c[1]).push(at(m.index))
    }
  }
  for (const [name, lines] of calls) {
    const body = (scriptText.match(new RegExp(`${name}\\s*(?:=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>|\\([^)]*\\))\\s*\\{([\\s\\S]{0,1500}?)\\n\\s{0,6}\\}`)) || [])[1] || ''
    const loops = /\b(for\s*\(|\.filter\(|\.map\(|\.reduce\(|\.sort\(|\.find\(|forEach\()/.test(body)
    if (loops) add('template-call-loops', 'performance', file, lines[0], `${name}() iterates data and is called ${lines.length}x in the template (lines ${[...new Set(lines)].join(', ')}): runs on every re-render; consider a computed`)
  }
}

// Router: eagerly imported route components
if (routerFile) {
  const text = fs.readFileSync(routerFile, 'utf8')
  const eager = [...text.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]*views?\/[^'"]+\.vue)['"]/g)]
  const routed = eager.filter(m => new RegExp(`component\\s*:\\s*${m[1]}\\b`).test(text))
  if (routed.length > 1 && inScope(routerFile)) add('eager-routes', 'bundle', routerFile, lineOf(text, routed[0].index), `${routed.length} route components imported eagerly: ${routed.map(m => m[1]).join(', ')}`)
}

// Cross-file duplication: same function name in 2+ files, grouped by identical bodies
const duplicates = []
for (const [name, list] of defs) {
  const filesWith = new Set(list.map(d => d.file))
  if (filesWith.size < 2) continue
  const byHash = {}
  for (const d of list) (byHash[d.hash] ||= []).push(`${d.file}:${d.line}`)
  const identical = Object.values(byHash).filter(g => g.length > 1)
  duplicates.push({ name, files: filesWith.size, variants: Object.keys(byHash).length, identicalGroups: identical, locations: list.map(d => `${d.file}:${d.line}`) })
}
duplicates.sort((a, b) => b.files - a.files)

// Shared scoped CSS classes: the same component-level class re-implemented in 3+ files
// suggests a missing shared component (modal shell, card, table, badge).
const sharedClasses = [...classDefs].filter(([, s]) => s.size >= 3)
  .map(([cls, s]) => ({ cls, files: [...s].sort() }))
  .sort((a, b) => b.files.length - a.files.length)
// Group classes that occur in the same set of files
const clusters = {}
for (const { cls, files: f } of sharedClasses) (clusters[f.join('|')] ||= { files: f, classes: [] }).classes.push(cls)
const markupClusters = Object.values(clusters).filter(c => c.classes.length >= 3).sort((a, b) => b.files.length * b.classes.length - a.files.length * a.classes.length)

const apiCounts = components.reduce((acc, c) => (acc[c.api] = (acc[c.api] || 0) + 1, acc), {})
const dominant = Object.entries(apiCounts).filter(([k]) => k !== 'none').sort((a, b) => b[1] - a[1])[0]?.[0]
for (const c of components) {
  if (c.inScope && c.api !== 'none' && dominant && c.api !== dominant && (c.api === 'options' || c.api === 'mixed')) {
    add('api-style-outlier', 'structure', path.join(root, c.file), 1, `uses ${c.api} API; most components use ${dominant}`)
  }
}

const result = { root, scope: onlyAbs ? rel(onlyAbs) || '.' : 'all', apiStyles: apiCounts, components: components.sort((a, b) => b.lines - a.lines), findings, duplicates, markupClusters }

if (asJson) {
  console.log(JSON.stringify(result, null, 2))
} else {
  const out = []
  out.push(`# Vue scan: ${result.scope === 'all' ? root : result.scope}`, '')
  out.push(`API styles: ${Object.entries(apiCounts).map(([k, v]) => `${k} ${v}`).join(', ')}`, '')
  out.push('## Largest components', '')
  for (const c of result.components.slice(0, 8)) out.push(`- ${c.file}: ${c.lines} lines (${c.api}; template ${c.templateLines} / script ${c.scriptLines} / style ${c.styleLines})`)
  out.push('', '## Per-file leads', '')
  if (!findings.length) out.push('- none')
  for (const f of findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) out.push(`- [${f.area}] ${f.check} ${f.file}:${f.line}: ${f.detail}`)
  out.push('', '## Functions defined in 2+ files', '')
  if (!duplicates.length) out.push('- none')
  for (const d of duplicates.slice(0, 25)) {
    const ident = d.identicalGroups.length ? `; identical bodies: ${d.identicalGroups.map(g => g.length).join('+')}` : ''
    out.push(`- ${d.name}: ${d.files} files, ${d.variants} variant(s)${ident}: ${d.locations.join(', ')}`)
  }
  out.push('', '## Repeated scoped markup (3+ files define the same classes)', '')
  if (!markupClusters.length) out.push('- none')
  for (const c of markupClusters.slice(0, 10)) out.push(`- ${c.files.length} files share .${c.classes.slice(0, 8).join(', .')}${c.classes.length > 8 ? ` (+${c.classes.length - 8})` : ''}: ${c.files.join(', ')}`)
  console.log(out.join('\n'))
}
