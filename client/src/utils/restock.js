// Budget-constrained restocking recommendations from demand forecasts.
// Amounts are USD, matching the API (display conversion happens in useCurrency).

// Lower rank = restocked first. Rising demand is the most urgent to cover.
const TREND_RANK = { increasing: 0, stable: 1, decreasing: 2 }

// Units needed to cover the forecast: forecasted minus current demand, never negative.
export const demandGap = (forecast) => Math.max(0, forecast.forecasted_demand - forecast.current_demand)

// Cost of covering every item's full gap; used as the slider's upper bound.
export const totalGapCost = (forecasts) =>
  forecasts.reduce((sum, f) => sum + demandGap(f) * f.unit_cost, 0)

// Greedy fill: rank by trend, then by largest gap, and buy each item's full gap while
// the budget allows. When an item doesn't fully fit, buy as many units as remain
// affordable, then keep going, since a cheaper item further down may still fit.
export function recommendRestock(forecasts, budget) {
  const ranked = forecasts
    .filter((f) => demandGap(f) > 0 && f.unit_cost > 0)
    .sort(
      (a, b) =>
        (TREND_RANK[a.trend] ?? 3) - (TREND_RANK[b.trend] ?? 3) ||
        demandGap(b) - demandGap(a) ||
        a.item_sku.localeCompare(b.item_sku)
    )

  // Work in cents so repeated subtraction doesn't drift (e.g. 18.99 * n)
  let remainingCents = Math.round(Math.max(0, budget) * 100)
  const lines = []
  for (const f of ranked) {
    const unitCents = Math.round(f.unit_cost * 100)
    const quantity = Math.min(demandGap(f), Math.floor(remainingCents / unitCents))
    if (quantity <= 0) continue
    remainingCents -= quantity * unitCents
    lines.push({
      sku: f.item_sku,
      name: f.item_name,
      trend: f.trend,
      gap: demandGap(f),
      quantity,
      unit_cost: f.unit_cost,
      line_total: (quantity * unitCents) / 100,
      lead_time_days: f.lead_time_days,
      partial: quantity < demandGap(f)
    })
  }
  return lines
}

// Format an ISO calendar date ('YYYY-MM-DD') as a local date. Plain `new Date('2026-11-12')`
// parses as UTC midnight, which shows the previous day in timezones west of UTC.
export function formatCalendarDate(isoDate, locale = 'en-US') {
  const date = new Date(`${isoDate}T00:00:00`)
  if (isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}
