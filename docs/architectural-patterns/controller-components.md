# Controller Components

The Controller Component is the glue layer. It imports the composable (model), orchestrates the logic, and passes results down to [Humble Components](humble-components.md) (views). It contains no UI of its own — just wiring and orchestration: calling services, handling the result, passing state down.

## When to Use

- When you need to connect business logic (composables) with presentation (humble components)
- As the "Controller" layer in [The MVC Triad](the-mvc-triad.md)
- When a page or feature needs to coordinate multiple composables and components

## When Not to Use

- Simple pages with one composable and one or two components. A page component that does both is easier to read than an extra layer.
- When the "wiring" would just pass props through to a deep tree. Use [Typed Provide Inject](../state-sharing/typed-provide-inject.md) or a store (Pinia) instead of making the controller a prop relay.

## Example

```vue
<!-- CartController.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useCart } from '@/composables/useCart'
import { useAuth } from '@/composables/useAuth'
import { checkoutService } from '@/services/checkout'
import CartDisplay from './CartDisplay.vue'
import DiscountInput from './DiscountInput.vue'
import CheckoutButton from './CheckoutButton.vue'

const { items, discountCode, total, removeItem } = useCart()
const { user } = useAuth()

const isSubmitting = ref(false)

async function handleCheckout() {
  if (!user.value) return
  isSubmitting.value = true
  try {
    await checkoutService.submit({ items: items.value, userId: user.value.id })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="cart-wrapper">
    <CartDisplay
      :items="items"
      :total="total"
      @remove-item="removeItem"
    />
    <DiscountInput v-model="discountCode" />
    <CheckoutButton
      label="Checkout"
      :disabled="items.length === 0 || isSubmitting"
      @click="handleCheckout"
    />
  </div>
</template>
```

`useCart` is the [Thin Composable](thin-composables.md) from that page; `CartDisplay` emits `remove-item` with the item id, which goes straight to `removeItem(id)`. Error handling is left to the caller here; in a real app the controller is also where you would show a failed checkout to the user.

## Can Controllers Have HTML?

Structural HTML that exists to hold the pieces together (like a wrapper `<div>`) is acceptable. What you want to avoid is visual/presentational HTML:

```vue
<!-- ❌ this has crept into presentation territory -->
<template>
  <div class="cart-wrapper">
    <h2 class="cart-title">Your Cart</h2>
    <p class="cart-subtitle">{{ items.length }} items</p>
    <CartDisplay ... />
  </div>
</template>
```

That heading and subtitle are presentation — they belong in a humble component, maybe a `CartHeader` or inside `CartDisplay` itself.

## Notes

**Rule of thumb**: if a designer asked you to change it, it shouldn't be in the controller. A wrapper div is invisible to designers. A heading with copy and styling is very much their concern.

See also: [Humble Components](humble-components.md), [Thin Composables](thin-composables.md), and [The MVC Triad](the-mvc-triad.md).
