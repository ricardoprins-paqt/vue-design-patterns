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

```js
export function useUser(userId) {
  const user = ref(null)
  const pending = ref(false)

  watch(userId, async () => {
    const controller = new AbortController()

    // Cancel this fetch if the watcher re-runs before it resolves
    onWatcherCleanup(() => controller.abort())

    pending.value = true

    try {
      user.value = await fetchUser(userId.value, {
        signal: controller.signal
      })
    } catch (e) {
      if (e.name !== 'AbortError') throw e // don't swallow real errors
    } finally {
      pending.value = false
    }
  }, { immediate: true })

  return { user, pending }
}
```

When `userId` changes, Vue calls the cleanup function (aborting the in-flight request) before starting the new watcher run. Only the latest request can ever write to `user.value`.

## Notes

This is the production-ready version of what people usually solve with a `cancelled` boolean flag — but `AbortController` actually cancels the network request at the browser level, saving bandwidth too.

**Nuxt**: `useAsyncData` has a built-in `watch` option and handles cancellation internally. But for custom fetching outside of `useAsyncData`, the `AbortController` + `onWatcherCleanup` pattern is exactly what you need.
