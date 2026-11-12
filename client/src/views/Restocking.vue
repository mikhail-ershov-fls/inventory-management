<template>
  <div class="restocking">
    <div class="page-header">
      <h2>{{ t('restocking.title') }}</h2>
      <p>{{ t('restocking.description') }}</p>
    </div>

    <div v-if="isInitialLoading" class="loading" role="status">{{ t('common.loading') }}</div>
    <ErrorState v-else-if="error" @retry="loadForecasts" />
    <div v-else :class="{ 'is-refreshing': loading }" :aria-busy="loading">
      <div class="card budget-card">
        <div class="budget-row">
          <label for="restock-budget" class="budget-label">{{ t('restocking.budget') }}</label>
          <span class="budget-value">{{ formatMoney(budget) }}</span>
        </div>
        <input
          id="restock-budget"
          v-model.number="budget"
          type="range"
          class="budget-slider"
          min="0"
          :max="maxBudget"
          :step="BUDGET_STEP"
          :aria-valuetext="formatMoney(budget)"
        />
        <div class="budget-scale">
          <span>{{ formatMoney(0) }}</span>
          <span>{{ t('restocking.budgetHint', { amount: formatMoney(fullCoverageCost, 2) }) }}</span>
          <span>{{ formatMoney(maxBudget) }}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card info">
          <div class="stat-label">{{ t('restocking.planned') }}</div>
          <div class="stat-value">{{ formatMoney(orderTotal, 2) }}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">{{ t('restocking.remaining') }}</div>
          <div class="stat-value">{{ formatMoney(budget - orderTotal, 2) }}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">{{ t('restocking.leadTime') }}</div>
          <div class="stat-value">{{ selectedLines.length ? t('restocking.days', { count: leadTimeDays }) : '-' }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('restocking.recommended') }}</h3>
          <span v-if="recommendations.length" class="selected-count">
            {{ t('restocking.selectedCount', { selected: selectedLines.length, total: recommendations.length }) }}
          </span>
        </div>

        <p v-if="!recommendations.length" class="empty-state">{{ t('restocking.noRecommendations') }}</p>
        <div v-else class="table-container">
          <table class="restock-table">
            <thead>
              <tr>
                <th class="col-check"><span class="visually-hidden">{{ t('restocking.include', { name: '' }) }}</span></th>
                <th>{{ t('restocking.table.sku') }}</th>
                <th>{{ t('restocking.table.item') }}</th>
                <th>{{ t('restocking.table.trend') }}</th>
                <th class="num">{{ t('restocking.table.gap') }}</th>
                <th class="num">{{ t('restocking.table.quantity') }}</th>
                <th class="num">{{ t('restocking.table.unitCost') }}</th>
                <th class="num">{{ t('restocking.table.lineTotal') }}</th>
                <th class="num">{{ t('restocking.table.leadTime') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in recommendations" :key="line.sku" :class="{ excluded: excludedSkus.has(line.sku) }">
                <td class="col-check">
                  <input
                    type="checkbox"
                    :checked="!excludedSkus.has(line.sku)"
                    :aria-label="t('restocking.include', { name: line.name })"
                    @change="toggleLine(line.sku)"
                  />
                </td>
                <td><strong>{{ line.sku }}</strong></td>
                <td>{{ line.name }}</td>
                <td>
                  <span :class="['badge', line.trend]">{{ t(`trends.${line.trend}`) }}</span>
                </td>
                <td class="num">{{ line.gap }}</td>
                <td class="num">
                  {{ line.quantity }}
                  <span v-if="line.partial" class="badge warning partial">{{ t('restocking.partial') }}</span>
                </td>
                <td class="num">{{ formatMoney(line.unit_cost, 2) }}</td>
                <td class="num"><strong>{{ formatMoney(line.line_total, 2) }}</strong></td>
                <td class="num">{{ t('restocking.days', { count: line.lead_time_days }) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="order-footer">
          <div class="order-feedback" aria-live="polite">
            <span v-if="submitError" class="feedback-error" role="alert">{{ submitError }}</span>
            <span v-else-if="lastOrder" class="feedback-success">
              {{ t('restocking.success', { id: lastOrder.id, date: formatDate(lastOrder.expected_delivery_date) }) }}
              <router-link to="/orders">{{ t('restocking.viewOrders') }}</router-link>
            </span>
          </div>
          <button type="button" class="btn-primary" :disabled="!selectedLines.length || submitting" @click="placeOrder">
            {{ submitting ? t('restocking.placing') : t('restocking.placeOrder') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api'
import { useI18n } from '../composables/useI18n'
import { useCurrency } from '../composables/useCurrency'
import { useDataLoader } from '../composables/useDataLoader'
import ErrorState from '../components/ErrorState.vue'
import { recommendRestock, totalGapCost, formatCalendarDate } from '../utils/restock'

// Slider granularity, in USD (API amounts are USD; display converts per locale)
const BUDGET_STEP = 50
const DEFAULT_BUDGET = 2000

export default {
  name: 'Restocking',
  components: {
    ErrorState
  },
  setup() {
    const { t, currentLocale } = useI18n()
    const { formatMoney } = useCurrency()

    const forecasts = ref([])
    const budget = ref(DEFAULT_BUDGET)
    // SKUs the user unchecked. Kept by SKU so the choice survives slider moves.
    const excludedSkus = ref(new Set())
    const submitting = ref(false)
    const submitError = ref('')
    const lastOrder = ref(null)

    const fullCoverageCost = computed(() => totalGapCost(forecasts.value))
    // Slider tops out at the full-coverage cost, rounded up to the next step
    const maxBudget = computed(() => Math.max(BUDGET_STEP, Math.ceil(fullCoverageCost.value / BUDGET_STEP) * BUDGET_STEP))

    const { loading, error, isInitialLoading, reload: loadForecasts } = useDataLoader(
      (signal) => api.getDemandForecasts({ signal }),
      (data) => {
        forecasts.value = data
        // Keep the budget inside the new slider range
        budget.value = Math.min(budget.value, maxBudget.value)
      }
    )

    const recommendations = computed(() => recommendRestock(forecasts.value, budget.value))
    // Unchecking an item drops it from the order without re-spending its budget elsewhere,
    // so the quantities the user reviewed don't shift under them.
    const selectedLines = computed(() => recommendations.value.filter((line) => !excludedSkus.value.has(line.sku)))
    const orderTotal = computed(() => Math.round(selectedLines.value.reduce((sum, l) => sum + l.line_total * 100, 0)) / 100)
    const leadTimeDays = computed(() => Math.max(0, ...selectedLines.value.map((l) => l.lead_time_days)))

    const toggleLine = (sku) => {
      const next = new Set(excludedSkus.value)
      next.has(sku) ? next.delete(sku) : next.add(sku)
      excludedSkus.value = next
    }

    // A new plan makes the previous result message stale
    watch([budget, excludedSkus], () => {
      submitError.value = ''
    })

    const placeOrder = async () => {
      if (!selectedLines.value.length || submitting.value) return
      submitting.value = true
      submitError.value = ''
      lastOrder.value = null
      try {
        lastOrder.value = await api.createRestockOrder({
          budget: budget.value,
          items: selectedLines.value.map((line) => ({ sku: line.sku, quantity: line.quantity }))
        })
        excludedSkus.value = new Set()
      } catch (err) {
        console.error('Restock order error:', err)
        submitError.value = err.response?.data?.detail || t('restocking.errors.submitFailed')
      } finally {
        submitting.value = false
      }
    }

    const formatDate = (isoDate) => formatCalendarDate(isoDate, currentLocale.value === 'ja' ? 'ja-JP' : 'en-US')

    onMounted(loadForecasts)

    return {
      t,
      formatMoney,
      formatDate,
      BUDGET_STEP,
      loading,
      error,
      isInitialLoading,
      loadForecasts,
      budget,
      maxBudget,
      fullCoverageCost,
      recommendations,
      excludedSkus,
      selectedLines,
      orderTotal,
      leadTimeDays,
      toggleLine,
      placeOrder,
      submitting,
      submitError,
      lastOrder
    }
  }
}
</script>

<style scoped>
.budget-card {
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.budget-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}

.budget-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.budget-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.budget-slider {
  width: 100%;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.budget-scale {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-2);
  font-size: 0.813rem;
  color: var(--color-text-muted);
}

.selected-count {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.empty-state {
  padding: var(--space-8) var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
}

.restock-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-check {
  width: 44px;
}

.col-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.restock-table tr.excluded td:not(.col-check) {
  opacity: 0.45;
  text-decoration: line-through;
}

.partial {
  margin-left: var(--space-2);
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

.order-feedback {
  font-size: 0.875rem;
}

.feedback-error {
  color: var(--color-danger);
}

.feedback-success {
  color: var(--color-success);
}

.feedback-success a {
  margin-left: var(--space-2);
  color: var(--color-accent);
}

.btn-primary {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  background: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: #ffffff;
  transition: all var(--transition);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .budget-scale span:nth-child(2) {
    display: none;
  }

  .order-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
