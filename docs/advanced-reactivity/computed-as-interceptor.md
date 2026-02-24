# Computed as Interceptor

Using writable `computed` properties for synchronous side effects instead of `watch`. When you need side effects to execute **immediately** and **synchronously** during value changes, a computed get/set is more reliable than watch's async callback timing.

## When to Use

- Server-side caching where writes must happen before the response is sent
- Synchronous side effects that can't wait for the next tick
- Intercepting value changes to validate or transform before writing
- Any scenario where `watch`'s async timing causes problems

## The Problem

`watch` callbacks are **asynchronous** — they run after the current synchronous execution completes:

```js
import { ref, watch } from 'vue'

const value = ref(0)
const cache = new Map()

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

In SSR, this is a problem — the response is sent after the synchronous execution completes, so a `watch` callback runs too late:

```js
const data = ref([])

watch(data, (newVal) => {
  serverCache.set('data', newVal) // ❌ Runs too late — response already sent
})

data.value = await fetchData()
```

## Solution

Use a writable `computed` as a gatekeeper that executes side effects **synchronously**:

```js
import { ref, computed } from 'vue'

const innerRef = ref(0)
const cache = new Map()

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

```js
import { ref, computed } from 'vue'

export function useCachedSsrRef(defaultValue, key, serverCache) {
  const innerRef = ref(defaultValue)

  if (!import.meta.env.SSR) {
    return innerRef
  }

  // Initialize from cache if available
  if (serverCache.has(key)) {
    innerRef.value = serverCache.get(key)
  }

  // Wrap with computed to intercept writes
  const wrapper = computed({
    get: () => innerRef.value,

    set: (newVal) => {
      // ✅ Write to cache synchronously BEFORE responding
      serverCache.set(key, newVal)
      innerRef.value = newVal
    }
  })

  return wrapper
}
```

Usage:

```js
const categories = useCachedSsrRef([], 'store-categories', serverCache)

categories.value = await fetchCategories()
// Cache write happens synchronously — before the response is sent
```

### Validation Example

```js
import { ref, computed } from 'vue'

function useValidatedRef(defaultValue, validator) {
  const innerRef = ref(defaultValue)
  
  const validated = computed({
    get: () => innerRef.value,
    
    set: (newVal) => {
      if (!validator(newVal)) {
        console.warn('Invalid value rejected:', newVal)
        return // Reject invalid values
      }
      innerRef.value = newVal
    }
  })
  
  return validated
}

const age = useValidatedRef(0, (val) => val >= 0 && val <= 120)

age.value = -5   // Rejected synchronously, warning logged
age.value = 25   // Accepted
```

### Logging/Tracking Example

```js
import { ref, computed } from 'vue'

function useTrackedRef(defaultValue, trackFn) {
  const innerRef = ref(defaultValue)
  
  const tracked = computed({
    get: () => innerRef.value,
    
    set: (newVal) => {
      trackFn(newVal) // Analytics, logging, etc.
      innerRef.value = newVal
    }
  })
  
  return tracked
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
| Timing | Async (next tick) | Sync (immediate) |
| Use Case | Side effects | Transformations + sync side effects |
| Flexibility | More options (flush timing) | Simple get/set |
| Composability | Independent | Value must flow through computed |

**When to Use Each:**
- **watch**: Most side effects, DOM updates, API calls
- **computed get/set**: Sync side effects, caching, validation, transformation + side effect

**Caveats:**
- Computed get/set is less idiomatic than watch for side effects
- Only use when synchronous timing is critical
- Can't use `flush: 'post'` or other watch timing options
- Must always update `innerRef.value` or create infinite loop

**SSR Specific:**
In SSR, the response is sent after the synchronous execution completes. If you need to write to a cache before responding, `watch` is too late — use computed get/set.

**Alternative Pattern:**
You could also use an explicit setter function:

```js
const innerRef = ref(0)

function setValue(newVal) {
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
