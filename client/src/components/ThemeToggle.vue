<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="label"
    :title="label"
    :aria-pressed="isDark ? 'true' : 'false'"
    @click="toggleTheme"
  >
    <!-- Shows the theme you will switch TO: moon in light mode, sun in dark mode -->
    <svg v-if="isDark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../composables/useI18n'

const { theme, toggleTheme } = useTheme()
const { t } = useI18n()

const isDark = computed(() => theme.value === 'dark')
const label = computed(() => t(isDark.value ? 'theme.switchToLight' : 'theme.switchToDark'))
</script>

<style scoped>
.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition), color var(--transition), border-color var(--transition);
}

.theme-toggle:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
