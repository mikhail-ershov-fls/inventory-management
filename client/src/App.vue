<template>
  <div :class="['app', 'app-shell', { 'is-collapsed': sidebarCollapsed }]">
    <AppSidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileNavOpen"
      @close="mobileNavOpen = false"
      @navigate="mobileNavOpen = false"
      @toggle-collapse="toggleSidebarCollapsed"
    />

    <div class="app-main">
      <header class="topbar">
        <button
          class="topbar-menu"
          type="button"
          :aria-label="t('nav.openMenu')"
          aria-controls="app-sidebar"
          :aria-expanded="mobileNavOpen ? 'true' : 'false'"
          @click="mobileNavOpen = true"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" v-html="icons.menu"></svg>
        </button>
        <div class="topbar-breadcrumb">
          <span class="topbar-crumb">{{ t('nav.companyName') }}</span>
          <svg class="topbar-sep" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          <span class="topbar-title">{{ currentPageTitle }}</span>
        </div>
        <div class="topbar-actions">
          <ThemeToggle />
          <LanguageSwitcher />
          <ProfileMenu
            @show-profile-details="showProfileDetails = true"
            @show-tasks="showTasks = true"
          />
        </div>
      </header>
      <FilterBar />
      <main class="app-content main-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import AppSidebar from './components/AppSidebar.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { ICONS, findNavItem } from './navigation'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher,
    AppSidebar,
    ThemeToggle
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // --- App shell state (sidebar collapse + mobile drawer) ---
    const route = useRoute()
    const SIDEBAR_KEY = 'app-sidebar-collapsed'
    const readCollapsed = () => {
      try {
        return localStorage.getItem(SIDEBAR_KEY) === '1'
      } catch (e) {
        return false
      }
    }
    const sidebarCollapsed = ref(readCollapsed())
    const mobileNavOpen = ref(false)

    const toggleSidebarCollapsed = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
      try {
        localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0')
      } catch (e) {
        // Storage unavailable (private mode etc.): collapse still works for this session
      }
    }

    // Top bar title comes from the same nav config as the sidebar (one source of truth)
    const currentPageTitle = computed(() => {
      const item = findNavItem(route.path)
      return item ? t(item.labelKey) : ''
    })

    // Close the mobile drawer whenever the route changes or Escape is pressed
    watch(() => route.fullPath, () => { mobileNavOpen.value = false })
    const onKeydown = (e) => {
      if (e.key === 'Escape' && mobileNavOpen.value) mobileNavOpen.value = false
    }

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(() => {
      loadTasks()
      window.addEventListener('keydown', onKeydown)
    })
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))

    return {
      t,
      icons: ICONS,
      sidebarCollapsed,
      mobileNavOpen,
      toggleSidebarCollapsed,
      currentPageTitle,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
/* =========================================================================
   Design tokens. Every page and component uses these instead of ad-hoc values.
   Palette follows the project design system (slate neutrals + green/blue/yellow/red status).
   ========================================================================= */
:root {
  /* Spacing: 4px scale. Use these for every margin, padding and gap. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Neutrals */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;

  /* Accent (active nav, primary buttons, focus, links) */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-soft: #eff6ff;

  /* Status: text color + soft background pairs */
  --color-success: #15803d;
  --color-success-soft: #f0fdf4;
  --color-info: #1d4ed8;
  --color-info-soft: #eff6ff;
  --color-warning: #a16207;
  --color-warning-soft: #fefce8;
  --color-danger: #b91c1c;
  --color-danger-soft: #fef2f2;

  /* Shape and depth */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.05);
  --shadow-md: 0 4px 12px rgb(15 23 42 / 0.08);
  --shadow-lg: 0 12px 32px rgb(15 23 42 / 0.14);

  /* Type */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 0.9375rem;
  --text-lg: 1.125rem;
  --text-xl: 1.375rem;
  --text-2xl: 1.75rem;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Layout */
  --sidebar-width: 248px;
  --sidebar-width-collapsed: 68px;
  --topbar-height: 60px;
  --content-max-width: 1440px;
  --transition: 150ms ease;
  --topbar-bg: rgb(255 255 255 / 0.9);
  color-scheme: light;
}

/* =========================================================================
   Dark theme. Activated by data-theme="dark" on <html> (see composables/useTheme.js).
   Only color/depth tokens change; components that read tokens follow automatically.
   Neutrals stay on the slate scale; status hues are lifted for contrast on dark surfaces
   and their "-soft" fills become translucent tints instead of pastel backgrounds.
   ========================================================================= */
:root[data-theme="dark"] {
  --color-bg: #0b1222;
  --color-surface: #131c2f;
  --color-surface-muted: #1a2438;
  --color-border: #263248;
  --color-border-strong: #334155;
  --color-text: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-text-subtle: #64748b;

  --color-accent: #3b82f6;
  --color-accent-hover: #60a5fa;
  --color-accent-soft: rgb(59 130 246 / 0.16);

  --color-success: #4ade80;
  --color-success-soft: rgb(34 197 94 / 0.14);
  --color-info: #60a5fa;
  --color-info-soft: rgb(59 130 246 / 0.14);
  --color-warning: #facc15;
  --color-warning-soft: rgb(234 179 8 / 0.14);
  --color-danger: #f87171;
  --color-danger-soft: rgb(239 68 68 / 0.14);

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.45);
  --shadow-lg: 0 12px 32px rgb(0 0 0 / 0.55);

  --topbar-bg: rgb(19 28 47 / 0.88);
  color-scheme: dark;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* =========================================================================
   App shell: fixed left sidebar + main column (sticky top bar, filter toolbar, content)
   ========================================================================= */
.app-shell {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  min-width: 0; /* lets wide tables scroll inside their container instead of widening the page */
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition);
}

.app-shell.is-collapsed .app-main {
  margin-left: var(--sidebar-width-collapsed);
}

.app-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-8) var(--space-12);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-8);
  background: var(--topbar-bg);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--text-sm);
}

.topbar-crumb {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.topbar-sep {
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke: var(--color-text-subtle);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.topbar-title {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.topbar-menu {
  display: none;
}

.topbar-menu svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 1023px) {
  .app-main,
  .app-shell.is-collapsed .app-main {
    margin-left: 0;
  }

  .app-content {
    padding: var(--space-6) var(--space-4) var(--space-10);
  }

  .topbar {
    padding: 0 var(--space-4);
    gap: var(--space-3);
  }

  .topbar-menu {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }

  .topbar-crumb,
  .topbar-sep {
    display: none;
  }
}

/* =========================================================================
   Shared component recipes (used by every view)
   ========================================================================= */

/* Page header: same pattern on every page */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.page-header h2 {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-header p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

/* Section heading used above groups of cards */
.section-title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-3);
}

/* KPI / stat tiles */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--color-surface);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.stat-card:hover {
  border-color: var(--color-border-strong);
}

.stat-label {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-card.warning .stat-value { color: var(--color-warning); }
.stat-card.success .stat-value { color: var(--color-success); }
.stat-card.danger .stat-value { color: var(--color-danger); }
.stat-card.info .stat-value { color: var(--color-info); }

/* Cards */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
}

/* Tables: wrapped so they scroll horizontally on small screens */
.table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

thead {
  background: var(--color-surface-muted);
}

th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-weight: var(--weight-semibold);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
}

td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr {
  transition: background-color var(--transition);
}

tbody tr:hover {
  background: var(--color-bg);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: 1.5;
  white-space: nowrap;
  text-transform: capitalize;
}

.badge.success,
.badge.increasing {
  background: var(--color-success-soft);
  color: var(--color-success);
  box-shadow: inset 0 0 0 1px rgb(21 128 61 / 0.15);
}

.badge.warning,
.badge.medium {
  background: var(--color-warning-soft);
  color: var(--color-warning);
  box-shadow: inset 0 0 0 1px rgb(161 98 7 / 0.18);
}

.badge.danger,
.badge.decreasing,
.badge.high {
  background: var(--color-danger-soft);
  color: var(--color-danger);
  box-shadow: inset 0 0 0 1px rgb(185 28 28 / 0.15);
}

.badge.info,
.badge.low {
  background: var(--color-info-soft);
  color: var(--color-info);
  box-shadow: inset 0 0 0 1px rgb(29 78 216 / 0.15);
}

.badge.stable {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.08);
}

/* Buttons and form controls: shared focus ring */
button:focus-visible,
select:focus-visible,
input:focus-visible,
textarea:focus-visible,
a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Loading / error / empty states */
/* Content kept on screen while a reload is in flight (see useDataLoader) */
.is-refreshing {
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.loading {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.error {
  background: var(--color-danger-soft);
  border: 1px solid rgb(185 28 28 / 0.2);
  color: var(--color-danger);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  margin: var(--space-4) 0;
  font-size: var(--text-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
