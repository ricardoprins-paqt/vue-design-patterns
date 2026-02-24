# Thin Composables

A Thin Composable contains your business logic as pure JavaScript functions, with only a thin reactive wrapper around them. The idea is to keep Vue-specific code (`ref`, `watch`, `computed`) as minimal as possible, with the actual logic in plain functions that have no Vue dependency.

## When to Use

- When business logic is complex enough to warrant isolated testing
- When you want logic that could potentially travel to another framework
- As the "Model" layer in [The MVC Triad](the-mvc-triad.md)

## Example

```js
// useCart.js

// ---- Pure business logic — zero Vue, fully testable with plain JS ----
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function applyDiscount(total, discountCode) {
  const discounts = { SAVE10: 0.10, SAVE20: 0.20 }
  const rate = discounts[discountCode] ?? 0
  return total * (1 - rate)
}

// ---- Thin reactive layer on top ----
import { ref, computed } from 'vue'

export function useCart() {
  const items = ref([])
  const discountCode = ref('')

  const total = computed(() => {
    const raw = calculateTotal(items.value)
    return applyDiscount(raw, discountCode.value)
  })

  const addItem = (item) => items.value.push(item)

  return { items, discountCode, total, addItem }
}
```

## Notes

`calculateTotal` and `applyDiscount` are completely independent of Vue. You can unit test them with a simple `expect(calculateTotal([...])).toBe(...)` — no component mounting, no reactive system to deal with. The composable just wires the logic to reactivity.

This separation also means if you ever move to a different framework, your business logic travels with you unchanged.

See also: [Humble Components](humble-components.md), [Controller Components](controller-components.md), and [The MVC Triad](the-mvc-triad.md).
