import { ref, watch } from 'vue'

// Must match the key read by the pre-paint script in index.html
const STORAGE_KEY = 'app-theme'

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch (e) {
    return null
  }
}

const systemQuery = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

// Module-level singleton so every caller shares one theme state.
// hasExplicitChoice tracks whether the user picked a theme; until they do,
// the app follows the OS setting live.
const hasExplicitChoice = ref(readStored() !== null)
const theme = ref(readStored() ?? (systemQuery?.matches ? 'dark' : 'light'))

watch(theme, (value) => {
  document.documentElement.dataset.theme = value
}, { immediate: true })

systemQuery?.addEventListener('change', (e) => {
  if (!hasExplicitChoice.value) theme.value = e.matches ? 'dark' : 'light'
})

export function useTheme() {
  const setTheme = (value) => {
    theme.value = value
    hasExplicitChoice.value = true
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch (e) {
      // Storage unavailable: the choice still applies for this session
    }
  }

  const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggleTheme }
}
