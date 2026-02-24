# Error Boundaries

Isolating async failures so one broken section of your UI doesn't take down the whole page. Combines `onErrorCaptured`, `<Suspense>`, and `defineAsyncComponent`.

## When to Use

- When sections of your page fetch data independently and could fail
- When you want graceful degradation instead of a full-page crash
- When you need retry functionality for failed async components

## Example

### Reusable Error Boundary Component

```vue
<!-- ErrorBoundary.vue -->
<script setup>
const error = ref(null)

onErrorCaptured((e) => {
  error.value = e
  return false // stop propagation
})

const reset = () => error.value = null
</script>

<template>
  <slot v-if="!error" />
  <slot v-else name="fallback" :error="error" :reset="reset">
    <!-- default fallback if no named slot provided -->
    <div>Something went wrong. <button @click="reset">Try again</button></div>
  </slot>
</template>
```

### Using It with Suspense

```vue
<ErrorBoundary>
  <Suspense>
    <template #default>
      <AsyncDashboard />  <!-- has top-level await, might throw -->
    </template>
    <template #fallback>
      <DashboardSkeleton />
    </template>
  </Suspense>

  <template #fallback="{ error, reset }">
    <DashboardError :message="error.message" @retry="reset" />
  </template>
</ErrorBoundary>
```

The layers each do something specific:
- `Suspense` handles the loading state while `AsyncDashboard` is fetching
- `ErrorBoundary` catches it if the fetch or render throws
- The `reset` function clears the error and lets Suspense try again

## Notes

**Important subtlety**: `onErrorCaptured` catches errors from child components but not from async setup functions triggered by Suspense unless you explicitly re-throw them. Make sure your async setup throws rather than silently swallowing errors:

```js
// AsyncDashboard.vue
const data = await fetchDashboard() // if this throws, ErrorBoundary catches it
// ✅ don't catch here unless you handle it — let it bubble to the boundary
```

**Nuxt**: error handling uses `createError` and `showError` at the page level, but for component-level error boundaries the `onErrorCaptured` pattern works the same way.
