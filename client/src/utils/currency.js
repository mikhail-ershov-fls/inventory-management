// Currency conversion utility
// All amounts coming from the API are in USD. Every money value shown in the UI
// must go through one of the formatters below so it is converted for JPY users;
// never prefix a raw API number with a currency symbol in a template.
// USD to JPY exchange rate (approximate)
const USD_TO_JPY = 150

const LOCALE_FOR_CURRENCY = { USD: 'en-US', JPY: 'ja-JP' }
const SYMBOL_FOR_CURRENCY = { USD: '$', JPY: '¥' }

// Missing/non-numeric values (e.g. a field absent from a mock record) render as 0
// instead of throwing inside a template.
function toAmount(amount) {
  const n = Number(amount)
  return Number.isFinite(n) ? n : 0
}

export function formatCurrency(amount, currency = 'USD') {
  amount = toAmount(amount)
  if (currency === 'JPY') {
    const yenAmount = Math.round(amount * USD_TO_JPY)
    return `¥${yenAmount.toLocaleString('ja-JP')}`
  }
  // Default USD
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function formatCurrencyWithDecimals(amount, currency = 'USD', decimals = 0) {
  amount = toAmount(amount)
  if (currency === 'JPY') {
    // Yen has no minor unit, so decimals are intentionally ignored
    const yenAmount = Math.round(amount * USD_TO_JPY)
    return `¥${yenAmount.toLocaleString('ja-JP')}`
  }
  // Default USD
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

// Short form for chart axes: $25K / $1.2M in USD, ¥375万 in JPY (locale-native compact notation)
export function formatCurrencyCompact(amount, currency = 'USD') {
  const cur = currency === 'JPY' ? 'JPY' : 'USD'
  const value = convertAmount(toAmount(amount), cur)
  const number = new Intl.NumberFormat(LOCALE_FOR_CURRENCY[cur], {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
  return `${SYMBOL_FOR_CURRENCY[cur]}${number}`
}

export function convertAmount(amount, currency = 'USD') {
  if (currency === 'JPY') {
    return Math.round(amount * USD_TO_JPY)
  }
  return amount
}
