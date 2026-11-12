<template>
  <div class="error error-state" role="alert">
    <span>{{ message || t('common.loadError') }}</span>
    <button type="button" class="retry-button" @click="$emit('retry')">{{ t('common.retry') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from '../composables/useI18n'

// Shared "failed to load" state. Raw error details go to the console (see useDataLoader);
// users get a translated message and a way to recover without reloading the page.
defineProps({
  message: {
    type: String,
    default: ''
  }
})
defineEmits(['retry'])

const { t } = useI18n()
</script>

<style scoped>
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.retry-button {
  padding: var(--space-2) var(--space-4);
  border: 1px solid currentColor;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
}

.retry-button:hover {
  background: var(--color-danger-soft);
}
</style>
