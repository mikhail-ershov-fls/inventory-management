// Run with: node --test src/utils/ src/composables/   (from the client directory)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatCurrency, formatCurrencyWithDecimals, formatCurrencyCompact, convertAmount } from './currency.js'

test('USD values are formatted without conversion', () => {
  assert.equal(formatCurrency(1234.4, 'USD'), '$1,234')
  assert.equal(formatCurrencyWithDecimals(12.5, 'USD', 2), '$12.50')
})

test('JPY values are converted from USD, not just re-labelled', () => {
  assert.equal(formatCurrency(100, 'JPY'), '¥15,000')
  assert.equal(formatCurrencyWithDecimals(12.5, 'JPY', 2), '¥1,875')
  assert.equal(convertAmount(2, 'JPY'), 300)
})

test('compact formatter converts and abbreviates for chart axes', () => {
  assert.equal(formatCurrencyCompact(25000, 'USD'), '$25K')
  assert.equal(formatCurrencyCompact(0, 'USD'), '$0')
  assert.equal(formatCurrencyCompact(25000, 'JPY'), '¥375万')
})

test('missing or non-numeric amounts render as zero instead of throwing', () => {
  assert.equal(formatCurrency(undefined, 'USD'), '$0')
  assert.equal(formatCurrencyWithDecimals(null, 'JPY', 2), '¥0')
  assert.equal(formatCurrencyCompact(NaN, 'USD'), '$0')
})

// Regression guard for audit finding UX-3: templates used to render
// `{{ currencySymbol }}{{ rawUsdAmount }}`, showing USD numbers with a ¥ sign.
test('no Vue file prefixes a raw amount with currencySymbol', () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..')
  const offenders = []
  for (const sub of ['views', 'components']) {
    for (const file of readdirSync(join(srcDir, sub))) {
      if (!file.endsWith('.vue')) continue
      const text = readFileSync(join(srcDir, sub, file), 'utf8')
      if (/currencySymbol/.test(text)) offenders.push(`${sub}/${file}`)
    }
  }
  assert.deepEqual(offenders, [], `use useCurrency().formatMoney instead of currencySymbol in: ${offenders.join(', ')}`)
})
