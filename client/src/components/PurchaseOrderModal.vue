<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && backlogItem" class="modal-overlay" @click="close">
        <div
          class="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="po-modal-title"
          @click.stop
        >
          <div class="modal-header">
            <h3 id="po-modal-title" class="modal-title">
              {{ mode === 'view' ? t('purchaseOrder.viewTitle') : t('purchaseOrder.createTitle') }}
            </h3>
            <button class="close-button" :aria-label="t('common.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="item-summary">
              <div class="item-summary-main">
                <h4 class="item-name">{{ translateProductName(backlogItem.item_name) }}</h4>
                <div class="item-sku">{{ t('purchaseOrder.sku') }}: {{ backlogItem.item_sku }}</div>
              </div>
              <div class="shortage-pill">
                <span class="shortage-label">{{ t('purchaseOrder.shortage') }}</span>
                <span class="shortage-value">{{ shortage }} {{ t('purchaseOrder.units') }}</span>
              </div>
            </div>

            <!-- Create mode -->
            <form
              v-if="mode === 'create'"
              id="po-create-form"
              class="po-form"
              novalidate
              @submit.prevent="submit"
            >
              <div class="form-field full">
                <label class="form-label" for="po-supplier">{{ t('purchaseOrder.supplierName') }}</label>
                <input
                  id="po-supplier"
                  v-model="form.supplierName"
                  type="text"
                  class="form-input"
                  :class="{ invalid: fieldErrors.supplierName }"
                  :placeholder="t('purchaseOrder.supplierPlaceholder')"
                  autocomplete="off"
                />
                <span v-if="fieldErrors.supplierName" class="field-error">{{ fieldErrors.supplierName }}</span>
              </div>

              <div class="form-field">
                <label class="form-label" for="po-quantity">{{ t('purchaseOrder.quantity') }}</label>
                <input
                  id="po-quantity"
                  v-model.number="form.quantity"
                  type="number"
                  min="1"
                  step="1"
                  class="form-input"
                  :class="{ invalid: fieldErrors.quantity }"
                />
                <span v-if="fieldErrors.quantity" class="field-error">{{ fieldErrors.quantity }}</span>
              </div>

              <div class="form-field">
                <label class="form-label" for="po-unit-cost">{{ t('purchaseOrder.unitCost') }}</label>
                <input
                  id="po-unit-cost"
                  v-model.number="form.unitCost"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="form-input"
                  :class="{ invalid: fieldErrors.unitCost }"
                  placeholder="0.00"
                />
                <span v-if="fieldErrors.unitCost" class="field-error">{{ fieldErrors.unitCost }}</span>
              </div>

              <div class="form-field">
                <label class="form-label" for="po-delivery">{{ t('purchaseOrder.expectedDelivery') }}</label>
                <input
                  id="po-delivery"
                  v-model="form.expectedDeliveryDate"
                  type="date"
                  :min="todayStr"
                  class="form-input"
                  :class="{ invalid: fieldErrors.expectedDeliveryDate }"
                />
                <span v-if="fieldErrors.expectedDeliveryDate" class="field-error">{{ fieldErrors.expectedDeliveryDate }}</span>
              </div>

              <div class="form-field total-field">
                <span class="form-label">{{ t('purchaseOrder.total') }}</span>
                <span class="total-value">{{ formattedTotal }}</span>
              </div>

              <div class="form-field full">
                <label class="form-label" for="po-notes">
                  {{ t('purchaseOrder.notes') }}
                  <span class="optional">({{ t('purchaseOrder.optional') }})</span>
                </label>
                <textarea
                  id="po-notes"
                  v-model="form.notes"
                  rows="3"
                  class="form-input form-textarea"
                  :placeholder="t('purchaseOrder.notesPlaceholder')"
                ></textarea>
              </div>

              <div v-if="submitError" class="alert-error full" role="alert">{{ submitError }}</div>
            </form>

            <!-- View mode -->
            <template v-else>
              <div v-if="viewLoading" class="state-message">{{ t('common.loading') }}</div>
              <div v-else-if="viewError" class="alert-error" role="alert">{{ viewError }}</div>
              <div v-else-if="purchaseOrder" class="po-details">
                <div class="po-details-header">
                  <span class="po-id">{{ purchaseOrder.id }}</span>
                  <span class="status-badge" :class="purchaseOrder.status">
                    {{ translateStatus(purchaseOrder.status) }}
                  </span>
                </div>
                <div class="info-grid">
                  <div class="info-item full">
                    <div class="info-label">{{ t('purchaseOrder.supplierName') }}</div>
                    <div class="info-value">{{ purchaseOrder.supplier_name }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.quantity') }}</div>
                    <div class="info-value">{{ purchaseOrder.quantity }} {{ t('purchaseOrder.units') }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.unitCostLabel') }}</div>
                    <div class="info-value">{{ formatMoney(purchaseOrder.unit_cost) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.total') }}</div>
                    <div class="info-value strong">{{ formatMoney(purchaseOrder.quantity * purchaseOrder.unit_cost) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.expectedDelivery') }}</div>
                    <div class="info-value">{{ formatDate(purchaseOrder.expected_delivery_date) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.createdDate') }}</div>
                    <div class="info-value">{{ formatDate(purchaseOrder.created_date) }}</div>
                  </div>
                  <div class="info-item full">
                    <div class="info-label">{{ t('purchaseOrder.notes') }}</div>
                    <div class="info-value notes">{{ purchaseOrder.notes || t('purchaseOrder.noNotes') }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="modal-footer">
            <template v-if="mode === 'create'">
              <button type="button" class="btn-secondary" :disabled="submitting" @click="close">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" form="po-create-form" class="btn-primary" :disabled="submitting">
                {{ submitting ? t('purchaseOrder.submitting') : t('purchaseOrder.submit') }}
              </button>
            </template>
            <button v-else type="button" class="btn-secondary" @click="close">
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { api } from '../api'
import { useI18n } from '../composables/useI18n'
import { formatCurrencyWithDecimals } from '../utils/currency'

const { t, currentLocale, currentCurrency, translateProductName } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  backlogItem: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'view'].includes(value)
  }
})

const emit = defineEmits(['close', 'po-created'])

const DEFAULT_LEAD_DAYS = 14

// Build a YYYY-MM-DD string from local date parts. toISOString() would use UTC
// and can shift the date by a day depending on the user's timezone.
const toDateStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todayStr = ref(toDateStr(new Date()))

const shortage = computed(() => {
  if (!props.backlogItem) return 0
  return Math.max(0, props.backlogItem.quantity_needed - props.backlogItem.quantity_available)
})

// ---- Create mode state ----
const form = reactive({
  supplierName: '',
  quantity: 1,
  unitCost: '',
  expectedDeliveryDate: '',
  notes: ''
})
const fieldErrors = reactive({})
const submitError = ref(null)
const submitting = ref(false)

// ---- View mode state ----
const purchaseOrder = ref(null)
const viewLoading = ref(false)
const viewError = ref(null)

const total = computed(() => {
  const qty = Number(form.quantity)
  const cost = Number(form.unitCost)
  if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost <= 0) return 0
  return qty * cost
})

const formatMoney = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '-'
  return formatCurrencyWithDecimals(value, currentCurrency.value, 2)
}

const formattedTotal = computed(() => formatMoney(total.value))

const clearFieldErrors = () => {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

const resetForm = () => {
  const now = new Date()
  todayStr.value = toDateStr(now)
  const delivery = new Date(now.getFullYear(), now.getMonth(), now.getDate() + DEFAULT_LEAD_DAYS)

  form.supplierName = ''
  form.quantity = shortage.value > 0 ? shortage.value : 1
  form.unitCost = ''
  form.expectedDeliveryDate = toDateStr(delivery)
  form.notes = ''
  clearFieldErrors()
  submitError.value = null
  submitting.value = false
}

// Client-side validation mirroring the backend contract
const validate = () => {
  clearFieldErrors()

  if (!form.supplierName.trim()) {
    fieldErrors.supplierName = t('purchaseOrder.validation.supplierRequired')
  }

  const qty = Number(form.quantity)
  if (form.quantity === '' || !Number.isInteger(qty) || qty <= 0) {
    fieldErrors.quantity = t('purchaseOrder.validation.quantityInvalid')
  }

  const cost = Number(form.unitCost)
  if (form.unitCost === '' || !Number.isFinite(cost) || cost <= 0) {
    fieldErrors.unitCost = t('purchaseOrder.validation.unitCostInvalid')
  }

  // YYYY-MM-DD strings compare correctly as plain strings
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expectedDeliveryDate)) {
    fieldErrors.expectedDeliveryDate = t('purchaseOrder.validation.dateRequired')
  } else if (form.expectedDeliveryDate < todayStr.value) {
    fieldErrors.expectedDeliveryDate = t('purchaseOrder.validation.datePast')
  }

  return Object.keys(fieldErrors).length === 0
}

// FastAPI returns `detail` as a string for HTTPException and as an array of
// { loc, msg } objects for 422 validation errors.
const extractErrorMessage = (err, fallbackKey) => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d?.msg || String(d)).join('; ')
  }
  return t(fallbackKey)
}

const submit = async () => {
  if (submitting.value || !props.backlogItem) return
  submitError.value = null
  if (!validate()) return

  submitting.value = true
  try {
    const payload = {
      backlog_item_id: props.backlogItem.id,
      supplier_name: form.supplierName.trim(),
      quantity: Number(form.quantity),
      unit_cost: Number(form.unitCost),
      expected_delivery_date: form.expectedDeliveryDate,
      notes: form.notes.trim() || null
    }
    const created = await api.createPurchaseOrder(payload)
    emit('po-created', created)
  } catch (err) {
    console.error('Failed to create purchase order:', err)
    submitError.value = extractErrorMessage(err, 'purchaseOrder.errors.createFailed')
  } finally {
    submitting.value = false
  }
}

const loadPurchaseOrder = async () => {
  if (!props.backlogItem) return
  const requestedId = props.backlogItem.id
  purchaseOrder.value = null
  viewError.value = null
  viewLoading.value = true
  try {
    const po = await api.getPurchaseOrderByBacklogItem(requestedId)
    // Ignore stale responses if the modal was switched to another item meanwhile
    if (props.backlogItem?.id === requestedId) purchaseOrder.value = po
  } catch (err) {
    console.error('Failed to load purchase order:', err)
    if (props.backlogItem?.id !== requestedId) return
    viewError.value = err?.response?.status === 404
      ? t('purchaseOrder.errors.notFound')
      : extractErrorMessage(err, 'purchaseOrder.errors.loadFailed')
  } finally {
    if (props.backlogItem?.id === requestedId) viewLoading.value = false
  }
}

const translateStatus = (status) => {
  if (!status) return ''
  const key = `purchaseOrder.status.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  // Parse YYYY-MM-DD as a local date to avoid timezone off-by-one
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString(currentLocale.value === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const close = () => {
  emit('close')
}

const onKeydown = (event) => {
  if (event.key === 'Escape') close()
}

// Reset state on every open; fetch the PO in view mode
watch(
  () => [props.isOpen, props.mode, props.backlogItem?.id],
  ([open]) => {
    if (open && props.backlogItem) {
      document.addEventListener('keydown', onKeydown)
      if (props.mode === 'view') {
        loadPurchaseOrder()
      } else {
        resetForm()
      }
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--space-4);
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--color-text);
  letter-spacing: -0.025em;
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition);
}

.close-button:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

/* Item summary */
.item-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.item-summary-main {
  min-width: 0;
}

.item-name {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
}

.item-sku {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.shortage-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: var(--space-2) var(--space-4);
  background: var(--color-danger-soft);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.shortage-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.shortage-value {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--color-danger);
}

/* Form */
.po-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5) var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.optional {
  text-transform: none;
  letter-spacing: normal;
  font-weight: var(--weight-normal);
  color: var(--color-text-subtle);
}

.form-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.form-input.invalid {
  border-color: var(--color-danger);
}

.form-textarea {
  resize: vertical;
  min-height: 72px;
}

.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}

.total-field {
  justify-content: flex-end;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}

.total-value {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text);
}

.alert-error {
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-soft);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: var(--text-sm);
}

/* View mode */
.state-message {
  padding: var(--space-8) 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.po-details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.po-id {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-accent);
}

.status-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.status-badge.pending {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.status-badge.ordered,
.status-badge.shipped {
  background: var(--color-info-soft);
  color: var(--color-info);
}

.status-badge.received,
.status-badge.delivered {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.status-badge.cancelled {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5) var(--space-4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.info-value {
  font-size: var(--text-base);
  color: var(--color-text);
  font-weight: var(--weight-medium);
}

.info-value.strong {
  font-weight: var(--weight-bold);
}

.info-value.notes {
  white-space: pre-wrap;
  font-weight: var(--weight-normal);
  color: var(--color-text-secondary);
}

/* Footer */
.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.btn-secondary,
.btn-primary {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition);
  font-family: inherit;
}

.btn-secondary {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
  border-color: var(--color-border-strong);
}

.btn-primary {
  background: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .po-form,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .item-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .shortage-pill {
    align-items: flex-start;
  }
}

/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
