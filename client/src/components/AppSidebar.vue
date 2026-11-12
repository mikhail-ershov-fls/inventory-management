<template>
  <div v-if="mobileOpen" class="sidebar-backdrop" @click="$emit('close')"></div>
  <aside
    id="app-sidebar"
    :class="['sidebar', { 'is-collapsed': collapsed, 'is-open': mobileOpen }]"
  >
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">CC</span>
      <div v-if="!collapsed" class="brand-text">
        <span class="brand-name">{{ t('nav.companyName') }}</span>
        <span class="brand-sub">{{ t('nav.subtitle') }}</span>
      </div>
      <button
        class="sidebar-close"
        type="button"
        :aria-label="t('nav.closeMenu')"
        @click="$emit('close')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" v-html="icons.close"></svg>
      </button>
    </div>

    <nav class="sidebar-nav" :aria-label="t('nav.mainNavigation')">
      <div v-for="section in sections" :key="section.titleKey" class="nav-section">
        <div v-if="!collapsed" class="nav-section-title">{{ t(section.titleKey) }}</div>
        <div v-else class="nav-section-divider" aria-hidden="true"></div>
        <router-link
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :exact-active-class="item.exact ? 'is-active' : ''"
          :active-class="item.exact ? '' : 'is-active'"
          :title="collapsed ? t(item.labelKey) : undefined"
          @click="$emit('navigate')"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="item.icon"></svg>
          <span v-if="!collapsed" class="nav-label">{{ t(item.labelKey) }}</span>
        </router-link>
      </div>
    </nav>

    <button
      class="sidebar-collapse"
      type="button"
      :aria-label="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
      :title="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
      @click="$emit('toggle-collapse')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" v-html="icons.collapse"></svg>
      <span v-if="!collapsed" class="collapse-label">{{ t('nav.collapseSidebar') }}</span>
    </button>
  </aside>
</template>

<script>
import { useI18n } from '../composables/useI18n'
import { NAV_SECTIONS, ICONS } from '../navigation'

export default {
  name: 'AppSidebar',
  props: {
    collapsed: { type: Boolean, default: false },
    mobileOpen: { type: Boolean, default: false }
  },
  emits: ['close', 'navigate', 'toggle-collapse'],
  setup() {
    const { t } = useI18n()
    return { t, sections: NAV_SECTIONS, icons: ICONS }
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  /* Dark sidebar: re-map the global color tokens for this subtree only. Every rule
     below reads these variables, so hover/active/brand styles follow automatically
     without touching the light theme used by the rest of the app. */
  --color-surface: #0f172a;
  --color-surface-muted: rgb(255 255 255 / 0.06);
  --color-border: rgb(255 255 255 / 0.08);
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-text-subtle: #64748b;
  --color-accent: #93c5fd;
  --color-accent-soft: rgb(96 165 250 / 0.16);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition), transform var(--transition);
}

.sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex: none;
}

.sidebar.is-collapsed .sidebar-brand {
  justify-content: center;
  padding: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-surface);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: 0.02em;
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.brand-name {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-sub {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-section-title {
  padding: 0 var(--space-3) var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.nav-section-divider {
  height: 1px;
  margin: 0 var(--space-2) var(--space-1);
  background: var(--color-border);
}

.nav-section:first-child .nav-section-divider {
  display: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  transition: background var(--transition), color var(--transition);
}

.nav-item:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.nav-item.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.nav-item:focus-visible,
.sidebar-collapse:focus-visible,
.sidebar-close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.nav-icon {
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar.is-collapsed .nav-item {
  justify-content: center;
  padding: 0;
}

.sidebar-collapse {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-3);
  height: 36px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
  flex: none;
}

.sidebar-collapse:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.sidebar.is-collapsed .sidebar-collapse {
  justify-content: center;
  padding: 0;
}

.sidebar-collapse svg,
.sidebar-close svg {
  width: 18px;
  height: 18px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--transition);
}

.sidebar.is-collapsed .sidebar-collapse svg {
  transform: rotate(180deg);
}

.sidebar-close {
  display: none;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 39;
  background: rgb(15 23 42 / 0.4);
}

/* Below 1024px the sidebar becomes an off-canvas drawer (always full width, never collapsed) */
@media (max-width: 1023px) {
  .sidebar,
  .sidebar.is-collapsed {
    width: var(--sidebar-width);
    transform: translateX(-100%);
    box-shadow: none;
  }

  .sidebar.is-open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }

  .sidebar-collapse {
    display: none;
  }

  .sidebar-close {
    display: inline-grid;
    place-items: center;
    margin-left: auto;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .sidebar-close:hover {
    background: var(--color-surface-muted);
  }
}

@media (min-width: 1024px) {
  .sidebar-backdrop {
    display: none;
  }
}
</style>
