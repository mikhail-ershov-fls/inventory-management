// Run with: node --test src/utils/ src/composables/   (from the client directory)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recommendRestock, totalGapCost, demandGap } from './restock.js'

const f = (sku, trend, current, forecasted, unit_cost) => ({
  item_sku: sku,
  item_name: sku,
  trend,
  current_demand: current,
  forecasted_demand: forecasted,
  unit_cost,
  lead_time_days: 5
})

const FORECASTS = [
  f('STB', 'stable', 100, 110, 1), // gap 10, $10
  f('INC-SMALL', 'increasing', 100, 120, 2), // gap 20, $40
  f('INC-BIG', 'increasing', 100, 150, 1), // gap 50, $50
  f('DEC', 'decreasing', 100, 80, 1) // gap 0
]

test('demand gap never goes negative', () => {
  assert.equal(demandGap(FORECASTS[3]), 0)
  assert.equal(demandGap(FORECASTS[2]), 50)
})

test('total gap cost sums every positive gap', () => {
  assert.equal(totalGapCost(FORECASTS), 100)
})

test('ample budget covers every gap, increasing trends first, larger gap first', () => {
  const lines = recommendRestock(FORECASTS, 1000)
  assert.deepEqual(lines.map((l) => [l.sku, l.quantity, l.partial]), [
    ['INC-BIG', 50, false],
    ['INC-SMALL', 20, false],
    ['STB', 10, false]
  ])
})

test('tight budget partially fills, then still fits cheaper items further down', () => {
  // $50 covers INC-BIG fully; $15 left buys 7 of INC-SMALL ($2), then $1 buys 1 STB
  const lines = recommendRestock(FORECASTS, 65)
  assert.deepEqual(lines.map((l) => [l.sku, l.quantity, l.partial]), [
    ['INC-BIG', 50, false],
    ['INC-SMALL', 7, true],
    ['STB', 1, true]
  ])
  assert.equal(lines.reduce((s, l) => s + l.line_total, 0), 65)
})

test('zero or negative budget recommends nothing', () => {
  assert.deepEqual(recommendRestock(FORECASTS, 0), [])
  assert.deepEqual(recommendRestock(FORECASTS, -5), [])
})

test('cent rounding: repeated 18.99 purchases stay exact', () => {
  const lines = recommendRestock([f('PSU', 'stable', 0, 100, 18.99)], 189.9)
  assert.equal(lines[0].quantity, 10)
  assert.equal(lines[0].line_total, 189.9)
})

test('calendar dates format as the same local day, invalid input passes through', async () => {
  const { formatCalendarDate } = await import('./restock.js')
  assert.equal(formatCalendarDate('2026-11-12'), 'Nov 12, 2026')
  assert.equal(formatCalendarDate('not-a-date'), 'not-a-date')
})
