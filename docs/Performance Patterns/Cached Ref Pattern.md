# Cached Ref Pattern

A pattern for creating refs that automatically persist their values to storage — making state survive page reloads or expensive server computations persist across requests. Combines `ref` + `watch` + storage API into a self-managed cache.

## When to Use

- PWAs and offline-first apps that need stale data available immediately
- Expensive computations that shouldn't repeat on every page load
- User preferences that should persist across sessions
- SSR apps where data can be cached server-side with a TTL

## Example

### Client-Side: localStorage

```js
import { ref, watch } from 'vue'

export function useStoredRef(defaultValue, key) {
  const innerRef = ref(defaultValue)
  
  // Load cached value on initialization
  const cachedValue = localStorage.getItem(key)
  if (cachedValue) {
    innerRef.value = JSON.parse(cachedValue)
  }
  
  // Sync changes to storage
  watch(
    innerRef,
    (newVal) => {
      localStorage.setItem(key, JSON.stringify(newVal))
    },
    { deep: true }
  )
  
  return innerRef
}
```

```vue
<script setup>
import { useStoredRef } from '@/composables/storage'

// Articles persist across page reloads
const articles = useStoredRef([], 'articles')

articles.value.push({ id: 1, title: 'Type-safe Injections' })
// Automatically saved to localStorage
</script>
```

### Client-Side: IndexedDB

For larger data or better storage quotas, use IndexedDB with a wrapper like `idb-keyval`:

```js
import { ref, toRaw, watch } from 'vue'
import { get, set } from 'idb-keyval'

export function useStoredRef(defaultValue, key) {
  const innerRef = ref(defaultValue)
  
  // Async initialization
  get(key)
    .then((cachedValue) => {
      // Only update if value hasn't been changed by other logic
      if (toRaw(innerRef.value) === defaultValue && cachedValue !== undefined) {
        innerRef.value = JSON.parse(cachedValue)
      }
    })
    .catch((err) => console.error(err))
  
  watch(
    innerRef,
    async (newValue) => {
      // JSON.stringify needed because Vue adds non-serializable properties
      await set(key, JSON.stringify(newValue))
    },
    { deep: true }
  )
  
  return innerRef
}
```

### Server-Side: LRU Cache (Nuxt)

Cache expensive data on the server with a TTL to avoid refetching for every user:

```js
// modules/ssrCache.js
import LRU from 'lru-cache'
import { defineNuxtModule } from '@nuxtjs/composition-api'

const FIVE_MINUTES = 1000 * 60 * 5

export default defineNuxtModule(function StoreServerCacheModule() {
  const storeCache = new LRU({ maxAge: FIVE_MINUTES })
  
  this.nuxt.hook('vue-renderer:ssr:prepareContext', (ssrContext) => {
    ssrContext.$serverCache = storeCache
  })
})
```

```js
// composables/useCachedSsrRef.js
import { computed, ssrRef, useContext } from '@nuxtjs/composition-api'

const CACHE_TTL = 3600 * 1000 * 5 // 5 minutes

export function useCachedSsrRef(defaultValue, key, ttl = CACHE_TTL) {
  const innerRef = ssrRef(defaultValue, key)
  
  if (!process.server) {
    return innerRef // Client-side: regular ref
  }
  
  const ctx = useContext()
  const serverCache = ctx.ssrContext.$serverCache
  
  if (!serverCache) {
    return innerRef
  }
  
  // Initialize with cached value if available
  if (serverCache.has(key)) {
    innerRef.value = serverCache.get(key)
  }
  
  // Use computed as a gatekeeper to update cache synchronously
  const wrapper = computed({
    get: () => innerRef.value,
    set(newVal) {
      serverCache.set(key, newVal, ttl)
      innerRef.value = newVal
    }
  })
  
  return wrapper
}
```

```js
// Usage in a component
const categories = useCachedSsrRef([], 'store-categories', 3600 * 1000 * 5)

// First request fetches and caches
categories.value = await fetchCategories()

// Next requests within 5 minutes use cached value
```

## Notes

**Client-Side:**
- localStorage is synchronous and simple but limited to ~5-10MB
- IndexedDB is async and has larger quotas but more complex
- Always handle storage quota errors and disabled storage scenarios
- The `deep: true` option ensures nested changes trigger saves

**Server-Side:**
- In-memory caches (LRU) are fast but don't scale across multiple servers
- Use Redis or similar for distributed caching in production
- `computed` is used instead of `watch` because it executes synchronously — critical for cache writes before the response is sent
- The pattern prevents refetching expensive data for every user, dramatically improving SSR response times

**Trade-offs:**
- Data can become stale if not invalidated properly
- Storage APIs can fail (quota exceeded, disabled)
- Server-side memory caches don't persist across restarts

This pattern gives you atomic control over persistence without littering your components with explicit storage calls. The ref manages itself.
