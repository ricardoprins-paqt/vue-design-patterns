# Mini Store with effectScope

Singleton state that can be properly cleaned up — useful for testing or for stores that should reset. Wraps state in an `effectScope` so all watchers and computeds can be torn down with a single `scope.stop()`.

## When to Use

- When you need singleton state with proper cleanup (especially for testing)
- When you want store-like behavior without Pinia
- When state needs to be reset between test cases

## When Not to Use

- When the store has no watchers or other effects. A plain [Singleton Composable](singleton-composable.md) with a `reset()` function is enough.
- When you need more than one or two of these. Pinia gives you the same lifecycle plus devtools, plugins and SSR support; VueUse's [`createGlobalState`](https://vueuse.org/shared/createGlobalState/) is a ready-made version of this page.

## Example

```ts
// useCartStore.ts
import { effectScope, ref, computed, readonly } from 'vue'
import type { ComputedRef, EffectScope, Ref } from 'vue'

interface CartItem {
  id: string
  price: number
}

interface CartStore {
  items: Readonly<Ref<readonly CartItem[]>>
  total: ComputedRef<number>
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

let scope: EffectScope | undefined
let store: CartStore | undefined

function createStore(): CartStore {
  // Detached (`true`): the scope must not belong to whichever component
  // happens to call useCartStore() first, or it would stop when that component unmounts
  scope = effectScope(true)

  return scope.run(() => {
    const items = ref<CartItem[]>([])
    const total = computed(() =>
      items.value.reduce((sum, item) => sum + item.price, 0)
    )

    const addItem = (item: CartItem) => {
      items.value.push(item)
    }
    const removeItem = (id: string) => {
      items.value = items.value.filter(i => i.id !== id)
    }

    return { items: readonly(items), total, addItem, removeItem }
  })!
}

export function useCartStore(): CartStore {
  return (store ??= createStore())
}

// Call this in tests to reset between test cases
export function disposeCartStore() {
  scope?.stop()
  scope = undefined
  store = undefined
}
```

## Notes

This is essentially what Pinia does internally: each store runs inside its own `effectScope`, under a detached root scope that no component owns. The scope groups all the watchers and computed values created inside the store, so they can all be torn down with a single `scope.stop()`. Without it, a watcher you add to the store (to persist the cart to `localStorage`, say) would keep running after you reset state in tests.

Why detached matters: `effectScope()` without `true` becomes a child of the currently active scope. When the store is first created inside a component's `setup`, that is the component's scope, and unmounting the component stops every watcher in the store, while other components still use it.

After `disposeCartStore()`, the next `useCartStore()` call creates a fresh store. Components that kept a reference to the old one keep a stopped store, so only dispose when nothing is mounted (as in tests).

Module-level state like this is shared across requests during SSR; see the warning on [Singleton Composable](singleton-composable.md).
