# Mini Store with effectScope

Singleton state that can be properly cleaned up — useful for testing or for stores that should reset. Wraps state in an `effectScope` so all watchers and computeds can be torn down with a single `scope.stop()`.

## When to Use

- When you need singleton state with proper cleanup (especially for testing)
- When you want store-like behavior without Pinia
- When state needs to be reset between test cases

## Example

```js
// useCartStore.js
import { effectScope, ref, computed, readonly } from 'vue'

let scope
let state

function createStore() {
  scope = effectScope()

  scope.run(() => {
    const items = ref([])
    const total = computed(() =>
      items.value.reduce((sum, item) => sum + item.price, 0)
    )

    const addItem = (item) => items.value.push(item)
    const removeItem = (id) => {
      items.value = items.value.filter(i => i.id !== id)
    }

    state = { items: readonly(items), total, addItem, removeItem }
  })
}

export function useCartStore() {
  if (!state) createStore()
  return state
}

// Call this in tests to reset between test cases
export function disposeCartStore() {
  scope?.stop()
  scope = undefined
  state = undefined
}
```

## Notes

This is essentially what Pinia does internally. The `effectScope` groups all the watchers and computed values together so they can all be torn down with a single `scope.stop()`. Without this, watchers created inside the store would leak when you try to reset state in tests.
