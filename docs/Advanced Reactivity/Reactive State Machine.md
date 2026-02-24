# Reactive State Machine

State machines make impossible states impossible. Instead of having multiple booleans that can contradict each other, you have a single state value that can only be one thing at a time, with explicit transitions.

## The Problem

```js
// ❌ booleans can contradict — isLoading AND isError being true simultaneously
const isLoading = ref(false)
const isError = ref(false)
const isSuccess = ref(false)
```

## Solution

```js
// ✅ only one state at a time, transitions are explicit
function useStateMachine(initial, transitions) {
  const state = ref(initial)

  function transition(event) {
    const nextState = transitions[state.value]?.[event]
    if (nextState) state.value = nextState
    // if no transition defined, event is silently ignored
  }

  const is = (s) => state.value === s

  return { state, transition, is }
}

// Define valid states and which events move between them
const { state, transition, is } = useStateMachine('idle', {
  idle:    { FETCH: 'loading' },
  loading: { SUCCESS: 'success', ERROR: 'error' },
  error:   { RETRY: 'loading' },
  success: { RESET: 'idle' },
})
```

```vue
<Spinner v-if="is('loading')" />
<ErrorMessage v-else-if="is('error')" @retry="transition('RETRY')" />
<DataView v-else-if="is('success')" />
```

```js
// Driving it
transition('FETCH')    // idle → loading
transition('SUCCESS')  // loading → success
transition('FETCH')    // ignored — no FETCH event defined for success state
```

## Composed Example

A search feature combining [[Custom Ref|debounced ref]], state machine, and [[Race Condition Handling]]:

```js
function useSearch(searchFn) {
  const query = useDebouncedRef('', 300)

  const { state, transition, is } = useStateMachine('idle', {
    idle:     { SEARCH: 'loading' },
    loading:  { SUCCESS: 'success', ERROR: 'error', SEARCH: 'loading' },
    success:  { SEARCH: 'loading', RESET: 'idle' },
    error:    { SEARCH: 'loading', RESET: 'idle' },
  })

  const results = ref([])
  const error = ref(null)

  const { pause, resume } = watch(query, async () => {
    if (!query.value) { transition('RESET'); return }

    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())

    transition('SEARCH')

    try {
      results.value = await searchFn(query.value, { signal: controller.signal })
      transition('SUCCESS')
    } catch (e) {
      if (e.name === 'AbortError') return
      error.value = e
      transition('ERROR')
    }
  })

  return { query, results, error, is, pause, resume }
}
```

## Notes

Invalid transitions are silently ignored — you can never accidentally get into a state the machine doesn't define. No more "how did we end up with `isLoading` AND `isError` both true" bugs.

For more complex cases with entry/exit actions and guards, libraries like XState exist. But for most UI async flows, this lightweight version covers 90% of needs.
