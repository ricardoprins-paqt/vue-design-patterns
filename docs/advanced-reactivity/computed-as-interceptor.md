# Computed as Interceptor

Using writable `computed` properties for synchronous side effects instead of `watch`. When you need side effects to execute **immediately** and **synchronously** during value changes, a computed get/set is more reliable than watch's default async callback timing.

## When to Use

- Server-side caching where writes must happen before the response is sent
- Synchronous side effects that can't wait for the next tick
- Intercepting value changes to validate or transform before writing
- Any scenario where `watch`'s async timing causes problems

## When Not to Use

- If you only need synchronous timing, `watch(source, cb, { flush: 'sync' })` is the built-in option. Reach for the interceptor when you need to *reject or transform* the write, or want the side effect tied to the write itself.
- For most side effects (API calls, DOM work, logging after the fact) a normal `watch` is clearer and more idiomatic.

## The Problem

`watch` callbacks are **asynchronous** by default (`flush: 'pre'`) — they run after the current synchronous execution completes:

```ts
import { ref, watch } from 'vue'

const value = ref(0)
const cache = new Map<string, number>()

watch(value, (newVal) => {
  cache.set('value', newVal)
  console.log('Cached')
})

value.value = 42
console.log('Changed')

// Output:
// Changed
// Cached  ← runs AFTER the synchronous code
```

In SSR it's worse. During server rendering Vue does not run watchers created in a component's setup at all, unless they are `immediate` or use `flush: 'sync'`. So a normal `watch` that writes to a server cache never fires:

```ts
const data = ref<Category[]>([])

watch(data, (newVal) => {
  serverCache.set('data', newVal) // ❌ Never runs during SSR
})

data.value = await fetchData()
```

## Solution

Use a writable `computed` as a gatekeeper that executes side effects **synchronously**:

```ts
import { ref, computed } from 'vue'

const innerRef = ref(0)
const cache = new Map<string, number>()

const value = computed({
  get: () => innerRef.value,
  set: (newVal) => {
    cache.set('value', newVal) // ✅ Runs synchronously
    console.log('Cached')
    innerRef.value = newVal
  }
})

value.value = 42
console.log('Changed')

// Output:
// Cached   ← runs IMMEDIATELY
// Changed
```

### SSR Cache Example

```ts
import { ref, computed, type Ref } from 'vue'

interface Cache<T> {
  has(key: string): boolean
  get(key: string): T | undefined
  set(key: string, value: T): void
}

export function useCachedSsrRef<T>(defaultValue: T, key: string, serverCache: Cache<T>): Ref<T> {
  const innerRef = ref(defaultValue) as Ref<T>

  if (!import.meta.env.SSR) {
    return innerRef
  }

  // Initialize from cache if available
  if (serverCache.has(key)) {
    innerRef.value = serverCache.get(key) as T
  }

  // Wrap with computed to intercept writes
  return computed({
    get: () => innerRef.value,

    set: (newVal) => {
      // ✅ Write to cache synchronously BEFORE responding
      serverCache.set(key, newVal)
      innerRef.value = newVal
    }
  })
}
```

Usage:

```ts
const categories = useCachedSsrRef<Category[]>([], 'store-categories', serverCache)

if (categories.value.length === 0) {
  categories.value = await fetchCategories()
  // Cache write happens synchronously — before the response is sent
}
```

The `serverCache` lives at module level on the server, so it is shared by **all requests and all users**. Only cache public data this way (see the SSR warning in [Singleton Composable](../state-sharing/singleton-composable.md)). On the client this composable returns the default value, so the server value still has to reach the browser through your framework's state transfer. In Nuxt, use Nitro's cached handlers and `useFetch` instead (see [Cached Ref Pattern](../performance-patterns/cached-ref-pattern.md)).

### Validation Example

```ts
import { ref, computed, type Ref } from 'vue'

function useValidatedRef<T>(defaultValue: T, validator: (value: T) => boolean) {
  const innerRef = ref(defaultValue) as Ref<T>

  return computed({
    get: () => innerRef.value,

    set: (newVal: T) => {
      if (!validator(newVal)) {
        console.warn('Invalid value rejected:', newVal)
        return // Reject invalid values
      }
      innerRef.value = newVal
    }
  })
}

const age = useValidatedRef(0, (val) => val >= 0 && val <= 120)

age.value = -5   // Rejected synchronously, warning logged
age.value = 25   // Accepted
```

### Logging/Tracking Example

```ts
import { ref, computed, type Ref } from 'vue'

function useTrackedRef<T>(defaultValue: T, trackFn: (value: T) => void) {
  const innerRef = ref(defaultValue) as Ref<T>

  return computed({
    get: () => innerRef.value,

    set: (newVal: T) => {
      trackFn(newVal) // Analytics, logging, etc.
      innerRef.value = newVal
    }
  })
}

const searchQuery = useTrackedRef('', (query) => {
  analytics.track('search', { query })
})

searchQuery.value = 'Vue patterns'
// Tracking happens synchronously, guaranteed to fire
```

## Notes

**watch vs computed:**

| Aspect | watch | computed get/set |
|--------|-------|------------------|
| Timing | Async by default (`flush: 'pre'`), sync with `flush: 'sync'` | Sync (immediate) |
| Use Case | Side effects | Transformations + sync side effects |
| Flexibility | More options (flush timing) | Simple get/set, can reject writes |
| Composability | Independent | Value must flow through computed |

**When to Use Each:**
- **watch**: Most side effects, DOM updates, API calls
- **computed get/set**: Sync side effects, caching, validation, transformation + side effect

**Caveats:**
- Computed get/set is less idiomatic than watch for side effects
- Only use when synchronous timing is critical
- Can't use `flush: 'post'` or other watch timing options
- If the setter doesn't write `innerRef.value`, the write is silently dropped. That is what makes validation work, but it is surprising if you forget it by accident

**SSR Specific:**
During SSR, Vue skips watchers created in component setup unless they are `immediate` or `flush: 'sync'`. If you need to write to a cache before responding, a default `watch` never gets the chance — use computed get/set (or a `flush: 'sync'` watcher).

**Alternative Pattern:**
You could also use an explicit setter function:

```ts
const innerRef = ref(0)

function setValue(newVal: number) {
  cache.set('value', newVal)
  innerRef.value = newVal
}

return {
  value: readonly(innerRef),
  setValue
}
```

This is more explicit but less ergonomic than `value.value = x`.

This pattern is niche but powerful when synchronous timing matters. Most side effects should use `watch` — only reach for computed get/set when async timing breaks your logic.
