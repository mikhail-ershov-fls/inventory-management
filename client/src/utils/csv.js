// CSV generation and download helpers.
// Kept free of Vue so the formatting rules can be tested with plain Node.

// Cells starting with these characters are interpreted as formulas by Excel /
// Google Sheets (CSV injection). Prefixing a single quote forces text.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

export function escapeCsvCell(value) {
  if (value === null || value === undefined) return ''

  // Numbers are emitted as-is so spreadsheets keep them numeric
  // (negative numbers must not be treated as formula triggers).
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }

  let text = String(value)
  if (FORMULA_TRIGGERS.some((ch) => text.startsWith(ch))) {
    text = `'${text}`
  }

  // RFC 4180: quote fields containing delimiter, quote, or line breaks;
  // embedded quotes are doubled.
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * Build a CSV string.
 * @param {Array<{header: string, value: (row: any) => any}>} columns
 * @param {Array<any>} rows
 */
export function toCsv(columns, rows) {
  const lines = [columns.map((col) => escapeCsvCell(col.header)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((col) => escapeCsvCell(col.value(row))).join(','))
  }
  // CRLF line endings per RFC 4180; trailing newline for tool compatibility.
  return lines.join('\r\n') + '\r\n'
}

/**
 * Trigger a browser download of CSV content.
 * A UTF-8 BOM is prepended so Excel renders non-ASCII text (e.g. Japanese
 * headers) correctly instead of guessing a legacy code page.
 */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Local date (not UTC) so the filename matches the user's calendar day.
export function dateStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
