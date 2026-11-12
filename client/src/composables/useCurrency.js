import { useI18n } from './useI18n'
import { formatCurrencyWithDecimals, formatCurrencyCompact } from '../utils/currency'

// Locale-aware money formatting for templates. API amounts are USD; these helpers
// convert to the active currency (JPY for the ja locale) before formatting.
export function useCurrency() {
  const { currentCurrency } = useI18n()

  const formatMoney = (amount, decimals = 0) => formatCurrencyWithDecimals(amount, currentCurrency.value, decimals)
  const formatMoneyCompact = (amount) => formatCurrencyCompact(amount, currentCurrency.value)

  return { currentCurrency, formatMoney, formatMoneyCompact }
}
