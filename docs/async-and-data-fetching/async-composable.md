# Async Composable

The foundation everything else builds on. Encapsulates the three states every async operation has — loading, error, and data — so you never have to manage them manually in components.

## When to Use

- Any time you need to fetch data or run an async operation
- When you want a reusable pattern for loading/error/data state management

## When Not to Use

- **In Nuxt**: use `useFetch` / `useAsyncData`. They add SSR, payload transfer, caching, deduplication and cancellation that a hand-written `useAsync` does not have.
- For server state shared across many components (caching, background refetching, invalidation), a dedicated library such as TanStack Query (Vue Query) or Pinia Colada saves you from re-implementing a cache.

## Example

### Basic Async Composable

```ts
import { ref, shallowRef, type Ref } from 'vue'

export function useAsync<T, Args extends unknown[] = []>(
  fetcher: (...args: Args) => Promise<T>
) {
  const data: Ref<T | null> = shallowRef(null)
  const error = shallowRef<unknown>(null)
  const pending = ref(false)

  async function execute(...args: Args): Promise<void> {
    pending.value = true
    error.value = null

    try {
      data.value = await fetcher(...args)
    } catch (e) {
      error.value = e
    } finally {
      pending.value = false
    }
  }

  return { data, error, pending, execute }
}
```

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

const { userId } = defineProps<{ userId: number }>()

const { data, error, pending, execute } = useAsync(() => fetchUser(userId))

onMounted(execute)
</script>

<template>
  <Spinner v-if="pending" />
  <ErrorMessage v-else-if="error" :error="error" />
  <UserCard v-else-if="data" :user="data" />
</template>
```

The `execute` function is exposed so the caller controls when and how often to trigger the fetch — on mount, on button click, whenever.

Note the `v-else-if="data"` on the last branch: `pending` starts as `false` and `onMounted` runs after the first render, so that first render has no data, no error and no loading state. Without the guard, `UserCard` would be mounted with `user` set to `null` and break as soon as it reads `user.name`.

`data` is a `shallowRef`: the response is replaced as a whole, never mutated in place, so deep reactivity on it would only cost performance (see [shallowRef and triggerRef](../performance-patterns/shallowref-and-triggerref.md)).

### With Auto Re-Fetching

```ts
import { watch, type WatchSource } from 'vue'

export function useAsyncWatch<T>(fetcher: () => Promise<T>, source: WatchSource) {
  const { data, error, pending, execute } = useAsync(fetcher)

  // Wrap execute: watch passes (newValue, oldValue, onCleanup) to its callback,
  // and those must not end up as fetcher arguments.
  watch(source, () => execute(), { immediate: true })

  return { data, error, pending }
}

// Usage — re-fetches automatically whenever userId changes
const { data } = useAsyncWatch(() => fetchUser(userId.value), userId)
```

**Watch out**: this version has a race condition. If `userId` changes while a request is in flight, the older response can arrive last and overwrite the newer one. [Race Condition Handling](race-condition-handling.md) shows the fix; use it for any source that can change quickly (search inputs, filters, tabs).

## Notes

**Nuxt**: `useFetch` and `useAsyncData` in Nuxt are essentially this pattern with SSR state serialization added on top. They handle the server/client handoff automatically. If you roll your own `useAsync`, you lose that unless you use Nuxt's `useState` to manage the server/client state handoff manually. Also note that `onMounted` never runs on the server, so the example above always fetches on the client only.

`useAsync` stores the error instead of throwing it. That keeps the component in control of the error UI, but it also means an [Error Boundary](error-boundaries.md) higher up never sees it. Rethrow from `execute` (or don't catch at all) when you want a boundary to handle failures.
