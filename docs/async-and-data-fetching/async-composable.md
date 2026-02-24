# Async Composable

The foundation everything else builds on. Encapsulates the three states every async operation has — loading, error, and data — so you never have to manage them manually in components.

## When to Use

- Any time you need to fetch data or run an async operation
- When you want a reusable pattern for loading/error/data state management

## Example

### Basic Async Composable

```js
export function useAsync(fetcher) {
  const data = ref(null)
  const error = ref(null)
  const pending = ref(false)

  async function execute(...args) {
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
<script setup>
const { data, error, pending, execute } = useAsync(() => fetchUser(userId))

onMounted(execute)
</script>

<template>
  <Spinner v-if="pending" />
  <ErrorMessage v-else-if="error" :error="error" />
  <UserCard v-else :user="data" />
</template>
```

The `execute` function is exposed so the caller controls when and how often to trigger the fetch — on mount, on button click, whenever.

### With Auto Re-Fetching

```js
export function useAsyncWatch(fetcher, source) {
  const { data, error, pending, execute } = useAsync(fetcher)

  watch(source, execute, { immediate: true })

  return { data, error, pending }
}

// Usage — re-fetches automatically whenever userId changes
const { data } = useAsyncWatch(() => fetchUser(userId.value), userId)
```

## Notes

**Nuxt**: `useFetch` and `useAsyncData` in Nuxt are essentially this pattern with SSR state serialization added on top. They handle the server/client handoff automatically. If you roll your own `useAsync`, you lose that unless you also use `useNuxtData` to manually manage the payload.
