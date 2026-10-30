# Error Boundaries

Isolating async failures so one broken section of your UI doesn't take down the whole page. Combines `onErrorCaptured` with `<Suspense>` (async setup) or `defineAsyncComponent` (lazy-loaded components).

## When to Use

- When sections of your page fetch data independently and could fail
- When you want graceful degradation instead of a full-page crash
- When you need retry functionality for failed async components

## Example

### Reusable Error Boundary Component

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { onErrorCaptured, shallowRef } from 'vue'

const error = shallowRef<Error | null>(null)

onErrorCaptured((e) => {
  error.value = e instanceof Error ? e : new Error(String(e))
  reportError(e) // send it to your monitoring (Sentry, ...) here
  return false // stop propagation
})

const reset = () => {
  error.value = null
}
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
- The `reset` function clears the error, which mounts the default slot again: `AsyncDashboard` is created from scratch and its async setup runs (and fetches) again

`<Suspense>` is still marked experimental in Vue 3.5 ([docs](https://vuejs.org/guide/built-ins/suspense.html)). It works and Nuxt relies on it, but its API may still change.

## Notes

**Let errors reach the boundary**: a rejected async setup inside `<Suspense>` is passed to `onErrorCaptured` of the ancestors like any other component error, so the boundary catches it. That only works if the async setup actually throws. Don't catch errors there unless you handle them:

```ts
// AsyncDashboard.vue
const data = await fetchDashboard() // if this throws, ErrorBoundary catches it
// ✅ don't catch here unless you handle it — let it bubble to the boundary
```

`onErrorCaptured` also catches errors from render functions, watchers, lifecycle hooks and event handlers of descendants. It does not catch errors in the boundary component itself, nor in code that runs outside Vue (a `setTimeout` callback, an unawaited promise).

**Returning `false`** stops the error from reaching `app.config.errorHandler`. If that is where your monitoring is hooked up, report the error from the boundary (as above), or the failure disappears silently.

**Lazy components**: for `defineAsyncComponent`, use its own `errorComponent`, `timeout` and `onError(error, retry, fail, attempts)` options to show a fallback or retry loading the chunk ([docs](https://vuejs.org/guide/components/async.html#loading-and-error-states)).

**Nuxt**: page-level errors use `createError` and `showError`. For component-level boundaries Nuxt ships [`<NuxtErrorBoundary>`](https://nuxt.com/docs/4.x/api/components/nuxt-error-boundary), which does the same as the component above for client-side errors, with an `#error="{ error, clearError }"` slot. Use it instead of writing your own.
