# Dynamic Return Pattern

Sometimes a composable is used in a simple context that just needs one value, and other times it's used in a more complex context that needs full control. The Dynamic Return Pattern supports both modes.

## When to Use

- When a composable has both simple and advanced use cases
- When you want a shorthand for the common case without sacrificing flexibility

## When Not to Use

- When there is only one way the composable is used. Returning a plain object and letting callers destructure what they need is simpler to write, type and read.
- When the two modes would need different inputs too. Two small composables are then clearer than one with overloads.

## Example

Basic form — return an object, destructure what you need. This is the default for most composables and needs no pattern at all:

```ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  // Start at 0 and read the real size on mount: `window` does not exist during SSR
  const width = ref(0)
  const height = ref(0)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, height }
}
```

The dynamic version returns a single ref by default and the full set of controls only when asked for them, like VueUse's `useNow({ controls: true })`. TypeScript overloads give each call the right return type:

```ts
import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface UseTimestampOptions<Controls extends boolean> {
  controls?: Controls
  interval?: number
}

interface TimestampControls {
  timestamp: Ref<number>
  pause: () => void
  resume: () => void
}

export function useTimestamp(options?: UseTimestampOptions<false>): Ref<number>
export function useTimestamp(options: UseTimestampOptions<true>): TimestampControls
export function useTimestamp(
  options: UseTimestampOptions<boolean> = {},
): Ref<number> | TimestampControls {
  const { controls = false, interval = 1000 } = options
  const timestamp = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined

  const pause = () => {
    clearInterval(timer)
    timer = undefined
  }
  const resume = () => {
    if (timer) return
    timer = setInterval(() => (timestamp.value = Date.now()), interval)
  }

  onMounted(resume)
  onUnmounted(pause)

  return controls ? { timestamp, pause, resume } : timestamp
}
```

```ts
// Simple case — just the value
const now = useTimestamp()

// Advanced case — value plus controls
const { timestamp, pause, resume } = useTimestamp({ controls: true })
```

### Awaitable Return

A related trick returns something you can either `await` or destructure straight away. Nuxt's `useFetch` and `useAsyncData` work this way. A simplified version:

```ts
import { ref } from 'vue'

export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = ref<T>()
  const error = ref<unknown>(null)
  const pending = ref(true)
  const state = { data, error, pending }

  const promise = fetcher()
    .then(
      (result) => { data.value = result },
      (err: unknown) => { error.value = err },
    )
    .finally(() => { pending.value = false })
    // Resolve to the state itself, so `await` gives you the refs
    .then(() => state)

  // Attach the same refs to the promise, so you can also destructure without awaiting
  return Object.assign(promise, state)
}
```

```ts
// In async setup — suspends until loaded, then destructure
const { data } = await useAsyncData(fetcher)

// Without await — returns immediately, refs update reactively
const { data, error, pending } = useAsyncData(fetcher)
```

## Notes

The composable returns something that works in both modes without forcing the caller to always deal with the full object when they don't need to.

- Overloads are what make the dynamic return pleasant to use. Without them every caller gets the union type and has to narrow it.
- Top-level `await` in `<script setup>` makes the component async, which needs a [`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html) ancestor. Nuxt provides one; in a plain Vue app you add it yourself, and `<Suspense>` is still marked experimental.
- The awaitable version never rejects: errors land in `error`. That keeps both modes consistent, but callers must check `error` instead of using `try/catch`.
