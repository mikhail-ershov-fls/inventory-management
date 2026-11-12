import { ref, computed, onBeforeUnmount } from 'vue'

/**
 * Shared loading/error handling for views whose data is (re)fetched, e.g. on filter changes.
 *
 * - Only the latest request may update the view. When filters change quickly, an older
 *   response that arrives after a newer one is discarded (and its HTTP request aborted),
 *   so the data on screen always matches the filters on screen.
 * - Data from the previous load stays visible while a reload is in flight:
 *   `isInitialLoading` is only true until the first successful load; use `loading`
 *   to dim the stale content during refreshes.
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher - fetches data; pass `signal` to the api calls
 * @param {(result: any) => void} apply - writes a fresh result into the view's refs
 */
export function useDataLoader(fetcher, apply) {
  const loading = ref(true)
  const error = ref(null)
  const hasLoaded = ref(false)

  let latestRequestId = 0
  let controller = null

  const reload = async () => {
    const requestId = ++latestRequestId
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    loading.value = true
    error.value = null
    try {
      const result = await fetcher(signal)
      if (requestId !== latestRequestId) return // superseded by a newer request
      apply(result)
      hasLoaded.value = true
    } catch (err) {
      // Aborted/superseded requests are expected; only the latest failure is shown
      if (requestId !== latestRequestId || signal.aborted) return
      console.error('Data load failed:', err)
      error.value = err
    } finally {
      if (requestId === latestRequestId) loading.value = false
    }
  }

  // Drop any in-flight request when the view is left
  onBeforeUnmount(() => {
    latestRequestId++
    controller?.abort()
  })

  const isInitialLoading = computed(() => loading.value && !hasLoaded.value)

  return { loading, error, hasLoaded, isInitialLoading, reload }
}
