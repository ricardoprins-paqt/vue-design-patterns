# Controller Components

The Controller Component is the glue layer. It imports the composable (model), orchestrates the logic, and passes results down to [Humble Components](humble-components.md) (views). It contains no UI of its own — just wiring.

## When to Use

- When you need to connect business logic (composables) with presentation (humble components)
- As the "Controller" layer in [The MVC Triad](the-mvc-triad.md)
- When a page or feature needs to coordinate multiple composables and components

## Example

```vue
<!-- CartController.vue -->
<script setup>
const { items, discountCode, total, addItem, removeItem } = useCart()
const { user } = useAuth()

const handleCheckout = async () => {
  await checkoutService.submit({ items: items.value, userId: user.value.id })
}
</script>

<template>
  <div class="cart-wrapper">
    <CartDisplay
      :items="items"
      :total="total"
      @remove-item="removeItem"
    />
    <DiscountInput
      v-model="discountCode"
    />
    <CheckoutButton
      :disabled="items.length === 0"
      @click="handleCheckout"
    />
  </div>
</template>
```

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
