# Optimistic UI

Updating the local state immediately when the user does something, then syncing with the server in the background. If the server call fails, roll back to the previous state. It makes apps feel instant.

## When to Use

- Like/unlike buttons, toggles, status changes
- Any user action where the expected server response is predictable
- When perceived performance matters more than absolute correctness

## Example

```js
export function useOptimistic(initialValue, updateFn) {
  const state = ref(initialValue)

  async function optimisticUpdate(newValue) {
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

```js
// Usage — liking a post
const { state: post, optimisticUpdate } = useOptimistic(
  props.post,
  (updated) => api.updatePost(updated.id, { liked: updated.liked })
)

async function toggleLike() {
  await optimisticUpdate({
    ...post.value,
    liked: !post.value.liked,
    likes: post.value.likes + (post.value.liked ? -1 : 1)
  })
}
```

The user sees the like happen instantly. If the API call fails, the like visually un-happens. The snapshot pattern — saving `previousValue` before the update — is what makes rollback trivial.

## Notes

**Tricky edge case**: if the user triggers multiple optimistic updates before any of them resolve, naive snapshots can roll back to intermediate states rather than the true original. For complex cases you might need a queue or version counter, but for most UI interactions the simple snapshot is sufficient.
