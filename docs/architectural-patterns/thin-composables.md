# Thin Composables

A Thin Composable contains your business logic as pure TypeScript functions, with only a thin reactive wrapper around them. The idea is to keep Vue-specific code (`ref`, `watch`, `computed`) as minimal as possible, with the actual logic in plain functions that have no Vue dependency.

## When to Use

- When business logic is complex enough to warrant isolated testing
- When you want logic that could potentially travel to another framework
- As the "Model" layer in [The MVC Triad](the-mvc-triad.md)

## When Not to Use

- The logic is a one-liner (`items.value.length > 0`). A `computed` in the component is clearer than a separate function and file.
- The "logic" is mostly reactive coordination (watchers, timers, fetching). There is nothing pure to extract; a regular composable is fine.
- Don't split for a framework move that isn't planned. Isolated testing is the real payoff.

## Example

```ts
// cart.ts — pure business logic, zero Vue, fully testable with plain TS
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

const DISCOUNT_RATES = new Map<string, number>([
  ['SAVE10', 0.1],
  ['SAVE20', 0.2],
])

export function calculateTotal(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function applyDiscount(total: number, discountCode: string): number {
  const rate = DISCOUNT_RATES.get(discountCode.trim().toUpperCase()) ?? 0
  return total * (1 - rate)
}
```

```ts
// useCart.ts — thin reactive layer on top
import { ref, computed } from 'vue'
import { calculateTotal, applyDiscount, type CartItem } from './cart'

export function useCart() {
  const items = ref<CartItem[]>([])
  const discountCode = ref('')

  const total = computed(() => applyDiscount(calculateTotal(items.value), discountCode.value))

  function addItem(item: CartItem) {
    items.value.push(item)
  }

  function removeItem(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return { items, discountCode, total, addItem, removeItem }
}
```

## Notes

`calculateTotal` and `applyDiscount` are completely independent of Vue. Because they live in their own module and are exported, you can unit test them with a simple `expect(calculateTotal([...])).toBe(...)` — no component mounting, no reactive system to deal with. The composable just wires the logic to reactivity.

The discount lookup uses a `Map` rather than a plain object on purpose: with an object, a user typing `constructor` as a code would find `Object.prototype.constructor` and turn the total into `NaN`.

Prices here are plain numbers to keep the example short. For real money, calculate in cents (integers) to avoid floating point rounding.

This separation also means if you ever move to a different framework, your business logic travels with you unchanged.

See also: [Humble Components](humble-components.md), [Controller Components](controller-components.md), and [The MVC Triad](the-mvc-triad.md).
