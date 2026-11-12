<template>
  <div class="reports">
    <div class="page-header">
      <h2>{{ t('reports.title') }}</h2>
      <p>{{ t('reports.description') }}</p>
    </div>

    <div v-if="isInitialLoading" class="loading" role="status">{{ t('common.loading') }}</div>
    <ErrorState v-else-if="error" @retry="loadReports" />
    <div v-else :class="{ 'is-refreshing': loading }" :aria-busy="loading">
      <div v-if="monthlyData.length === 0" class="card empty">{{ t('reports.noData') }}</div>
      <template v-else>
      <!-- Quarterly Performance -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.quarterlyPerformance') }}</h3>
        </div>
        <div class="table-container">
          <table class="reports-table">
            <thead>
              <tr>
                <th>{{ t('reports.quarter') }}</th>
                <th>{{ t('reports.totalOrders') }}</th>
                <th>{{ t('reports.totalRevenue') }}</th>
                <th>{{ t('reports.avgOrderValue') }}</th>
                <th>{{ t('reports.fulfillmentRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quarterlyData" :key="q.quarter">
                <td><strong>{{ q.quarter }}</strong></td>
                <td>{{ q.total_orders }}</td>
                <td>{{ formatMoney(q.total_revenue, 2) }}</td>
                <td>{{ formatMoney(q.avg_order_value, 2) }}</td>
                <td>
                  <span :class="getFulfillmentClass(q.fulfillment_rate)">
                    {{ q.fulfillment_rate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Monthly Trends Chart -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.monthlyRevenueTrend') }}</h3>
        </div>
        <div class="chart-container">
          <div class="bar-chart">
            <div v-for="row in monthRows" :key="row.month" class="bar-wrapper">
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{ height: getBarHeight(row.revenue) + 'px' }"
                  :title="formatMoney(row.revenue, 2)"
                ></div>
              </div>
              <div class="bar-label">{{ formatMonth(row.month) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Month-over-Month Comparison -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.monthOverMonth') }}</h3>
        </div>
        <div class="table-container">
          <table class="reports-table">
            <thead>
              <tr>
                <th>{{ t('reports.month') }}</th>
                <th>{{ t('reports.orders') }}</th>
                <th>{{ t('reports.revenue') }}</th>
                <th>{{ t('reports.change') }}</th>
                <th>{{ t('reports.growthRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in monthRows" :key="row.month">
                <td><strong>{{ formatMonth(row.month) }}</strong></td>
                <td>{{ row.order_count }}</td>
                <td>{{ formatMoney(row.revenue, 2) }}</td>
                <td>
                  <span v-if="row.change !== null" :class="getChangeClass(row.change)">
                    {{ formatChange(row.change) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <span v-if="row.change !== null" :class="getChangeClass(row.change)">
                    {{ formatGrowthRate(row.growthRate) }}
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.totalRevenueSelected') }}</div>
          <div class="stat-value">{{ formatMoney(totalRevenue, 2) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.avgMonthlyRevenue') }}</div>
          <div class="stat-value">{{ formatMoney(avgMonthlyRevenue, 2) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.totalOrdersSelected') }}</div>
          <div class="stat-value">{{ totalOrders }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.bestQuarter') }}</div>
          <div class="stat-value">{{ bestQuarter || '-' }}</div>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'
import { useCurrency } from '../composables/useCurrency'
import { useDataLoader } from '../composables/useDataLoader'
import ErrorState from '../components/ErrorState.vue'

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MAX_BAR_HEIGHT = 200

export default {
  name: 'Reports',
  components: {
    ErrorState
  },
  setup() {
    const { t, currentLocale } = useI18n()
    const { formatMoney } = useCurrency()
    const { selectedPeriod, selectedLocation, selectedCategory, selectedStatus, getCurrentFilters } = useFilters()

    const quarterlyData = ref([])
    const monthlyData = ref([])

    // Both report endpoints honour the shared filter bar; latest-request-wins via useDataLoader
    const { loading, error, isInitialLoading, reload: loadReports } = useDataLoader(
      (signal) => {
        const filters = getCurrentFilters()
        return Promise.all([
          api.getQuarterlyReports(filters, { signal }),
          api.getMonthlyTrends(filters, { signal })
        ])
      },
      ([quarterly, monthly]) => {
        quarterlyData.value = quarterly
        monthlyData.value = monthly
      }
    )

    watch([selectedPeriod, selectedLocation, selectedCategory, selectedStatus], () => {
      loadReports()
    })

    onMounted(loadReports)

    // Month rows with change vs. the previous month precomputed (null for the first row)
    const monthRows = computed(() => monthlyData.value.map((row, index) => {
      if (index === 0) return { ...row, change: null, growthRate: null }
      const previous = monthlyData.value[index - 1].revenue
      const change = row.revenue - previous
      return { ...row, change, growthRate: previous === 0 ? null : (change / previous) * 100 }
    }))

    const totalRevenue = computed(() => monthlyData.value.reduce((sum, m) => sum + m.revenue, 0))
    const totalOrders = computed(() => monthlyData.value.reduce((sum, m) => sum + m.order_count, 0))
    const avgMonthlyRevenue = computed(() =>
      monthlyData.value.length ? totalRevenue.value / monthlyData.value.length : 0
    )
    const bestQuarter = computed(() => {
      let best = null
      for (const q of quarterlyData.value) {
        if (!best || q.total_revenue > best.total_revenue) best = q
      }
      return best ? best.quarter : ''
    })

    // Computed once per data change instead of once per bar
    const maxRevenue = computed(() => Math.max(0, ...monthlyData.value.map((m) => m.revenue)))
    const getBarHeight = (revenue) =>
      maxRevenue.value > 0 ? (revenue / maxRevenue.value) * MAX_BAR_HEIGHT : 0

    // "2025-01" -> "Jan 2025" (en) / "2025 1月" (ja)
    const formatMonth = (monthStr) => {
      const [year, month] = monthStr.split('-')
      const key = MONTH_KEYS[parseInt(month, 10) - 1]
      if (!key) return monthStr
      const name = t(`months.${key}`)
      return currentLocale.value === 'ja' ? `${year}年${name}` : `${name} ${year}`
    }

    const formatChange = (change) => {
      if (change === 0) return formatMoney(0, 2)
      return (change > 0 ? '+' : '-') + formatMoney(Math.abs(change), 2)
    }

    const formatGrowthRate = (rate) => {
      if (rate === null) return 'N/A'
      return (rate > 0 ? '+' : '') + rate.toFixed(1) + '%'
    }

    const getChangeClass = (change) => {
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return ''
    }

    const getFulfillmentClass = (rate) => {
      if (rate >= 90) return 'badge success'
      if (rate >= 75) return 'badge warning'
      return 'badge danger'
    }

    return {
      t,
      loading,
      isInitialLoading,
      error,
      loadReports,
      quarterlyData,
      monthlyData,
      monthRows,
      totalRevenue,
      totalOrders,
      avgMonthlyRevenue,
      bestQuarter,
      formatMoney,
      formatMonth,
      formatChange,
      formatGrowthRate,
      getBarHeight,
      getChangeClass,
      getFulfillmentClass
    }
  }
}
</script>

<style scoped>
.reports {
  padding: 0;
}

.card {
  background: var(--color-surface);
  border-radius: 12px;
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: var(--space-6);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th {
  background: var(--color-bg);
  padding: var(--space-3);
  text-align: left;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid var(--color-border);
}

.reports-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.reports-table tr:hover {
  background: var(--color-bg);
}

.chart-container {
  padding: var(--space-8) var(--space-4);
  min-height: 300px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  gap: var(--space-2);
  /* On narrow screens the bars keep a readable minimum width and the chart
     scrolls inside its card instead of pushing the page sideways. */
  overflow-x: auto;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 36px;
  max-width: 80px;
}

.bar-container {
  height: 200px;
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
  cursor: pointer;
}

.bar:hover {
  background: linear-gradient(to top, #2563eb, #3b82f6);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
  transform: rotate(-45deg);
  white-space: nowrap;
  margin-top: var(--space-6);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.stat-card {
  background: var(--color-surface);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3b82f6;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
}

.badge {
  padding: var(--space-1) var(--space-3);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge.success {
  background: #dcfce7;
  color: #166534;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.positive-change {
  color: #16a34a;
  font-weight: 600;
}

.negative-change {
  color: #dc2626;
  font-weight: 600;
}

.empty {
  text-align: center;
  color: var(--color-text-muted);
}

.loading {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-muted);
}

</style>
