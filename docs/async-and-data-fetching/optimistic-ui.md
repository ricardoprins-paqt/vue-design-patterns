# Optimistic UI

Updating the local state immediately when the user does something, then syncing with the server in the background. If the server call fails, roll back to the previous state. It makes apps feel instant.

## When to Use

- Like/unlike buttons, toggles, status changes
- Any user action where the expected server response is predictable
- When perceived performance matters more than absolute correctness

## When Not to Use

- When the server decides the result (prices, generated IDs, validation that often fails): you would show a value and then correct it. Show a pending state instead.
- For irreversible or high-stakes actions (payments, sending a message, deleting data): the user must not believe something happened before it did.
- When the request usually takes less than ~100 ms, a plain pending state is simpler and feels just as fast.

## Example

```ts
import { ref, type Ref } from 'vue'

export function useOptimistic<T>(initialValue: T, updateFn: (value: T) => Promise<unknown>) {
  const state = ref(initialValue) as Ref<T>

  async function optimisticUpdate(newValue: T): Promise<void> {
    const previousValue = state.value  // snapshot before

    state.value = newValue             // apply immediately — optimistic

    try {
      await updateFn(newValue)         // sync with server
    } catch (e) {
      state.value = previousValue      // server failed — roll back
      throw e                          // let caller handle the error
    }
  }

  return { state, optimisticUpdate }
}
```

```ts
// Usage — liking a post
const { state: post, optimisticUpdate } = useOptimistic(
  props.post,
  (updated) => api.updatePost(updated.id, { liked: updated.liked })
)

async function toggleLike() {
  try {
    await optimisticUpdate({
      ...post.value,
      liked: !post.value.liked,
      likes: post.value.likes + (post.value.liked ? -1 : 1)
    })
  } catch {
    toast.error('Could not save your like. Please try again.')
  }
}
```

The user sees the like happen instantly. If the API call fails, the like visually un-happens, and the user is told why. The snapshot pattern — saving `previousValue` before the update — is what makes rollback trivial.

`useOptimistic(props.post, ...)` copies the prop once. If the parent later passes a different post, `post` does not follow it. Re-create the state when the prop changes (for example with a `watch` on `() => props.post` that resets `state`), or key the component by post id.

## Notes

**Tricky edge case**: if the user triggers multiple optimistic updates before any of them resolve, naive snapshots can roll back to intermediate states rather than the true original.

Consider: user clicks like, then immediately clicks again before the first request resolves. The second call snapshots the *optimistic* state, not the original. When the first request fails and rolls back, the second snapshot is now stale.

A version counter ("only roll back if no newer update happened") fixes part of this, but not all: if both updates fail, the second one rolls back to the first one's optimistic value, which the server never saved. Keep the last value the server *accepted*, and only let the latest update roll back to it:

```ts
import { ref, type Ref } from 'vue'

export function useOptimistic<T>(initialValue: T, updateFn: (value: T) => Promise<unknown>) {
  const state = ref(initialValue) as Ref<T>
  let confirmed = initialValue // last value the server accepted
  let latest = 0

  async function optimisticUpdate(newValue: T): Promise<void> {
    const thisUpdate = ++latest
    state.value = newValue

    try {
      await updateFn(newValue)
      confirmed = newValue
    } catch (e) {
      // Only the latest update decides what is shown; roll back to what
      // the server last accepted, never to another optimistic value
      if (thisUpdate === latest) {
        state.value = confirmed
      }
      throw e
    }
  }

  return { state, optimisticUpdate }
}
```

For most single-action UI (like buttons, toggles), the simple snapshot version is fine. Reach for this version when the user can realistically trigger overlapping updates.

Neither version controls the order in which the *server* applies overlapping requests. If that matters, disable the control while a request is pending, send updates one after another, or refetch the real state once the last one settles.

In Nuxt, the same idea is usually done with `useFetch`/`useAsyncData`: update `data` optimistically, call `$fetch`, and on failure call `refresh()` to get the real state back.
