# Race Condition Handling

One of the most common async bugs in Vue apps — and most developers don't even know they have it. When a reactive source changes rapidly (a search input, a tab switcher, a filter), multiple fetches can be in flight simultaneously and resolve out of order.

## The Problem

```
userId changes to 2 → fetch starts
userId changes to 3 → fetch starts
fetch for 3 resolves first → data.value = user 3
fetch for 2 resolves second → data.value = user 2  ← wrong!
```

## Solution

Use `AbortController` combined with `onWatcherCleanup` to cancel the previous fetch when the watcher re-runs:

```ts
import { ref, shallowRef, watch, onWatcherCleanup, type Ref } from 'vue'

export function useUser(userId: Ref<number>) {
  const user = shallowRef<User | null>(null)
  const error = shallowRef<unknown>(null)
  const pending = ref(false)

  watch(userId, async (id) => {
    const controller = new AbortController()

    // Cancel this fetch if the watcher re-runs before it resolves.
    // Must be registered before the first await.
    onWatcherCleanup(() => controller.abort())

    pending.value = true
    error.value = null

    try {
      const result = await fetchUser(id, { signal: controller.signal })
      if (controller.signal.aborted) return // a newer run owns the state now
      user.value = result
    } catch (e) {
      if (controller.signal.aborted) return // cancelled on purpose, not an error
      error.value = e
    } finally {
      // Only the latest run may reset pending; otherwise an aborted run
      // would flip it to false while the newer request is still loading.
      if (!controller.signal.aborted) pending.value = false
    }
  }, { immediate: true })

  return { user, error, pending }
}
```

When `userId` changes, Vue calls the cleanup function (aborting the in-flight request) before starting the new watcher run. The `signal.aborted` checks make sure an outdated run never writes `user`, `error` or `pending`. That also covers a `fetchUser` that ignores the `signal`: the request then runs to the end, but its result is dropped.

## Notes

This is the production-ready version of what people usually solve with a `cancelled` boolean flag — but `AbortController` actually cancels the network request at the browser level, saving bandwidth too. That only works when the signal reaches `fetch` (or `$fetch`, axios, ...): pass it through every layer of `fetchUser`.

`onWatcherCleanup` was added in Vue 3.5. On older versions, use the third argument of the watch callback instead: `watch(userId, async (id, _old, onCleanup) => { onCleanup(() => controller.abort()) })`. See [Side Effect Cleanup](https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup).

**Nuxt**: `useAsyncData` and `useFetch` refetch when their key or `watch` sources change, and with the default `dedupe: 'cancel'` a new request cancels the one still in flight. `useAsyncData` passes an `AbortSignal` to its handler; forward it to `$fetch` (`(_nuxtApp, { signal }) => $fetch(url, { signal })`) so the network request itself is cancelled too ([docs](https://nuxt.com/docs/4.x/api/composables/use-async-data)). For custom fetching outside of `useAsyncData`, the `AbortController` + `onWatcherCleanup` pattern is exactly what you need.
