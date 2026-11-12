// Run with: node --test src/utils/ src/composables/   (from the client directory)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useDataLoader } from './useDataLoader.js'

// Silence Vue's "onBeforeUnmount called outside a component" warning in these unit tests
const originalWarn = console.warn
console.warn = (...args) => (String(args[0]).includes('onBeforeUnmount') ? undefined : originalWarn(...args))
const originalError = console.error

// A promise we can resolve/reject from the test, to control response order
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

test('a slow older response cannot overwrite a newer one (audit finding PERF-4)', async () => {
  const responses = [deferred(), deferred()]
  const signals = []
  let call = 0
  const applied = []
  const loader = useDataLoader(
    (signal) => {
      signals.push(signal)
      return responses[call++].promise
    },
    (result) => applied.push(result)
  )

  const first = loader.reload() // e.g. filter = January
  const second = loader.reload() // user switches to February before January returns
  assert.equal(signals[0].aborted, true, 'superseded request is aborted')

  responses[1].resolve('february')
  await second
  responses[0].resolve('january') // late response for the old filter
  await first

  assert.deepEqual(applied, ['february'])
  assert.equal(loader.loading.value, false)
})

test('loading stays true until the latest request finishes', async () => {
  const responses = [deferred(), deferred()]
  let call = 0
  const loader = useDataLoader(
    () => responses[call++].promise,
    () => {}
  )

  const first = loader.reload()
  const second = loader.reload()
  responses[0].resolve('old')
  await first
  assert.equal(loader.loading.value, true, 'older request finishing must not clear loading')

  responses[1].resolve('new')
  await second
  assert.equal(loader.loading.value, false)
})

test('isInitialLoading is only true before the first successful load', async () => {
  const responses = [deferred(), deferred()]
  let call = 0
  const loader = useDataLoader(
    () => responses[call++].promise,
    () => {}
  )

  const first = loader.reload()
  assert.equal(loader.isInitialLoading.value, true)
  responses[0].resolve('data')
  await first
  assert.equal(loader.isInitialLoading.value, false)

  const second = loader.reload() // refresh after a filter change
  assert.equal(loader.loading.value, true)
  assert.equal(loader.isInitialLoading.value, false, 'existing data stays on screen during refresh')
  responses[1].resolve('more')
  await second
})

test('errors from the latest request are exposed and cleared on retry', async () => {
  console.error = () => {}
  try {
    const responses = [deferred(), deferred()]
    let call = 0
    const applied = []
    const loader = useDataLoader(
      () => responses[call++].promise,
      (r) => applied.push(r)
    )

    const first = loader.reload()
    responses[0].reject(new Error('Network Error'))
    await first
    assert.equal(loader.error.value.message, 'Network Error')
    assert.equal(loader.loading.value, false)

    const retry = loader.reload()
    assert.equal(loader.error.value, null, 'retry clears the previous error')
    responses[1].resolve('ok')
    await retry
    assert.deepEqual(applied, ['ok'])
  } finally {
    console.error = originalError
  }
})

test('a failure of a superseded request is ignored', async () => {
  const responses = [deferred(), deferred()]
  let call = 0
  const loader = useDataLoader(
    () => responses[call++].promise,
    () => {}
  )

  const first = loader.reload()
  const second = loader.reload()
  responses[0].reject(new Error('canceled'))
  await first
  responses[1].resolve('ok')
  await second
  assert.equal(loader.error.value, null)
})
