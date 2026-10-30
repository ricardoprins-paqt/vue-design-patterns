# Cached Ref Pattern

A pattern for creating refs that automatically persist their values to storage — making state survive page reloads or expensive server computations persist across requests. Combines `ref` + `watch` + storage API into a self-managed cache.

## When to Use

- PWAs and offline-first apps that need stale data available immediately
- Expensive computations that shouldn't repeat on every page load
- User preferences that should persist across sessions
- SSR apps where data can be cached server-side with a TTL

## When Not to Use

- For localStorage, VueUse's `useLocalStorage` / `useStorage` already does this, including SSR guards, serializers and syncing between tabs.
- In Nuxt, cache on the server with Nitro (see below) and let `useFetch` / `useAsyncData` transfer the data to the client, instead of a hand-written SSR ref.
- Never put user-specific or sensitive data in a shared server cache.

## Example

### Client-Side: localStorage

```ts
import { ref, watch, type Ref } from 'vue'

export function useStoredRef<T>(defaultValue: T, key: string): Ref<T> {
  const innerRef = ref(defaultValue) as Ref<T>
  
  // Load cached value on initialization
  const cachedValue = localStorage.getItem(key)
  if (cachedValue !== null) {
    innerRef.value = JSON.parse(cachedValue) as T
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
<script setup lang="ts">
import { useStoredRef } from '@/composables/storage'

interface Article {
  id: number
  title: string
}

// Articles persist across page reloads
const articles = useStoredRef<Article[]>([], 'articles')

articles.value.push({ id: 1, title: 'Type-safe Injections' })
// Automatically saved to localStorage
</script>
```

`localStorage` only exists in the browser. In an SSR app, only call this on the client (for example in `onMounted`), or use VueUse's `useLocalStorage`, which handles that for you.

### Client-Side: IndexedDB

For larger data or better storage quotas, use IndexedDB with a wrapper like `idb-keyval`:

```ts
import { ref, toRaw, watch, type Ref } from 'vue'
import { get, set } from 'idb-keyval'

export function useStoredRef<T>(defaultValue: T, key: string): Ref<T> {
  const innerRef = ref(defaultValue) as Ref<T>
  
  // Async initialization
  get<string>(key)
    .then((cachedValue) => {
      // Only update if value hasn't been changed by other logic
      if (toRaw(innerRef.value) === defaultValue && cachedValue !== undefined) {
        innerRef.value = JSON.parse(cachedValue) as T
      }
    })
    .catch((err) => console.error(err))
  
  watch(
    innerRef,
    async (newValue) => {
      // IndexedDB stores values with structured clone, which can't clone
      // Vue's reactive proxies, so store a plain JSON string instead
      await set(key, JSON.stringify(newValue))
    },
    { deep: true }
  )
  
  return innerRef
}
```

### Server-Side: Cached API Route (Nuxt)

Cache expensive data on the server with a TTL to avoid refetching for every user. In Nuxt, do this in the server layer with Nitro's cache, not in a component:

```ts
// server/api/categories.get.ts
export default defineCachedEventHandler(
  async () => {
    return await fetchCategoriesFromCms() // expensive call
  },
  { maxAge: 60 * 5 } // seconds: 5 minutes
)
```

```vue
<script setup lang="ts">
// The first request within the TTL calls the CMS, later requests get the cached result.
// useFetch also sends the data to the client in the payload, so hydration matches.
const { data: categories } = await useFetch('/api/categories')
</script>
```

Nitro's cache is in memory by default and can use Redis or another storage driver in production. For a framework-agnostic version of the same idea (a server cache written synchronously from a ref), see [Computed as Interceptor](../advanced-reactivity/computed-as-interceptor.md).

## Notes

**Client-Side:**
- localStorage is synchronous and simple but limited to ~5-10MB
- IndexedDB is async and has larger quotas but more complex
- Always handle storage quota errors and disabled storage scenarios
- The `deep: true` option ensures nested changes trigger saves

**Server-Side:**
- In-memory caches are fast but don't scale across multiple servers
- Use Redis or similar for distributed caching in production (Nitro supports this through its storage drivers)
- A server cache is shared by **all users**: only cache public data, or include the user in the cache key
- The pattern prevents refetching expensive data for every user, dramatically improving SSR response times

**Trade-offs:**
- Data can become stale if not invalidated properly
- Storage APIs can fail (quota exceeded, disabled)
- Server-side memory caches don't persist across restarts

This pattern gives you atomic control over persistence without littering your components with explicit storage calls. The ref manages itself.
