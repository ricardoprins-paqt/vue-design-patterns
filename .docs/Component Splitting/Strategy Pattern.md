# Strategy Pattern

When you have conditional logic that switches between different behaviors or components, the Strategy Pattern replaces chains of `v-if` with a lookup object and `<component :is>`.

## When to Use

- When you have a growing chain of `v-if`/`v-else-if` for component selection
- When new variants need to be added frequently
- When the selection logic should be open for extension without modifying the template

## Example

**Before** — growing chain of `v-if`:

```vue
<template>
  <CreditCardForm v-if="paymentMethod === 'card'" />
  <PayPalForm v-else-if="paymentMethod === 'paypal'" />
  <BankTransferForm v-else-if="paymentMethod === 'bank'" />
  <CryptoForm v-else-if="paymentMethod === 'crypto'" />
</template>
```

**After** — lookup object:

```js
const paymentForms = {
  card: CreditCardForm,
  paypal: PayPalForm,
  bank: BankTransferForm,
  crypto: CryptoForm,
}
```

```vue
<template>
  <component :is="paymentForms[paymentMethod]" />
</template>
```

## Notes

Adding a new payment method is now just adding one line to the lookup object. You never touch the template. This scales in a way that `v-if` chains don't — at 8 or 10 options the chain becomes unreadable, the lookup stays clean forever.

The lookup object is also easy to drive from outside — you could even receive it as a prop, making the component fully open for extension without modification.

This pattern is also used in [[Schema-Driven Forms]] where `fieldComponents` maps field type strings to the right component.
