// Run with: node --test src/utils/   (from the client directory)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escapeCsvCell, toCsv, dateStamp } from './csv.js'

test('plain values pass through', () => {
  assert.equal(escapeCsvCell('Sensor A'), 'Sensor A')
  assert.equal(escapeCsvCell(42), '42')
  assert.equal(escapeCsvCell(12.5), '12.5')
})

test('null, undefined and non-finite numbers become empty cells', () => {
  assert.equal(escapeCsvCell(null), '')
  assert.equal(escapeCsvCell(undefined), '')
  assert.equal(escapeCsvCell(NaN), '')
  assert.equal(escapeCsvCell(Infinity), '')
})

test('commas, quotes and newlines are quoted per RFC 4180', () => {
  assert.equal(escapeCsvCell('a,b'), '"a,b"')
  assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""')
  assert.equal(escapeCsvCell('line1\nline2'), '"line1\nline2"')
})

test('formula-like strings are neutralised', () => {
  assert.equal(escapeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)")
  assert.equal(escapeCsvCell('+1'), "'+1")
  assert.equal(escapeCsvCell('-cmd'), "'-cmd")
  assert.equal(escapeCsvCell('@foo'), "'@foo")
  assert.equal(escapeCsvCell('=a,b'), `"'=a,b"`)
})

test('negative numbers stay numeric', () => {
  assert.equal(escapeCsvCell(-5), '-5')
})

test('non-ASCII text is preserved', () => {
  assert.equal(escapeCsvCell('在庫レベル'), '在庫レベル')
})

test('toCsv builds header and rows with CRLF', () => {
  const columns = [
    { header: 'SKU', value: (r) => r.sku },
    { header: 'Qty', value: (r) => r.qty }
  ]
  const csv = toCsv(columns, [
    { sku: 'A-1', qty: 3 },
    { sku: 'B,2', qty: 0 }
  ])
  assert.equal(csv, 'SKU,Qty\r\nA-1,3\r\n"B,2",0\r\n')
})

test('toCsv with no rows emits header only', () => {
  assert.equal(toCsv([{ header: 'SKU', value: (r) => r.sku }], []), 'SKU\r\n')
})

test('dateStamp uses local date, zero-padded', () => {
  assert.equal(dateStamp(new Date(2026, 0, 5)), '2026-01-05')
})
