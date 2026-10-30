# Reactive State Machine

State machines make impossible states impossible. Instead of having multiple booleans that can contradict each other, you have a single state value that can only be one thing at a time, with explicit transitions.

## When to Use

- Async flows with several states (idle, loading, success, error) that must never overlap
- UI with a few modes where only some moves between them are allowed

## When Not to Use

- Two states: a single boolean is fine
- Many states with guards, entry/exit actions or nested states: use a library like XState instead of growing this one

## The Problem

```ts
// ❌ booleans can contradict — isLoading AND isError being true simultaneously
const isLoading = ref(false)
const isError = ref(false)
const isSuccess = ref(false)
```

## Solution

```ts
// ✅ only one state at a time, transitions are explicit
import { ref, readonly, type Ref } from 'vue'

type Transitions<S extends string, E extends string> = Record<S, Partial<Record<E, S>>>

function useStateMachine<S extends string, E extends string>(initial: S, transitions: Transitions<S, E>) {
  const state = ref(initial) as Ref<S>

  function transition(event: E) {
    const nextState = transitions[state.value][event]
    if (nextState) state.value = nextState
    // if no transition defined, event is silently ignored
  }

  const is = (s: S) => state.value === s

  return { state: readonly(state), transition, is }
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

```ts
// Driving it
transition('FETCH')    // idle → loading
transition('SUCCESS')  // loading → success
transition('FETCH')    // ignored — no FETCH event defined for success state
```

## Composed Example

A search feature combining [debounced ref](custom-ref.md), state machine, and [Race Condition Handling](../async-and-data-fetching/race-condition-handling.md):

```ts
import { ref, watch, onWatcherCleanup, type Ref } from 'vue'

type SearchFn<T> = (query: string, options: { signal: AbortSignal }) => Promise<T[]>

function useSearch<T>(searchFn: SearchFn<T>) {
  const query = useDebouncedRef('', 300)

  const { transition, is } = useStateMachine('idle', {
    idle:     { SEARCH: 'loading' },
    loading:  { SUCCESS: 'success', ERROR: 'error', SEARCH: 'loading', RESET: 'idle' },
    success:  { SEARCH: 'loading', RESET: 'idle' },
    error:    { SEARCH: 'loading', RESET: 'idle' },
  })

  const results = ref([]) as Ref<T[]>
  const error = ref<unknown>(null)

  const { pause, resume } = watch(query, async (q) => {
    if (!q) { transition('RESET'); return }

    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())

    transition('SEARCH')

    try {
      const found = await searchFn(q, { signal: controller.signal })
      if (controller.signal.aborted) return // a newer search took over
      results.value = found
      transition('SUCCESS')
    } catch (e) {
      if (controller.signal.aborted) return
      error.value = e
      transition('ERROR')
    }
  })

  return { query, results, error, is, pause, resume }
}
```

`loading` needs a `RESET` transition too: if the user clears the search box while a request is running, the request is aborted and the machine has to go back to `idle`, otherwise it stays in `loading` forever. Checking `controller.signal.aborted` after the `await` keeps a stale response from winning when `searchFn` ignores the signal.

## Notes

Invalid transitions are silently ignored — you can never accidentally get into a state the machine doesn't define. No more "how did we end up with `isLoading` AND `isError` both true" bugs.

For more complex cases with entry/exit actions and guards, libraries like XState exist. But for most UI async flows, this lightweight version covers 90% of needs.
