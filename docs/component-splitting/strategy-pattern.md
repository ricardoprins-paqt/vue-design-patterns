# Strategy Pattern

When you have conditional logic that switches between different behaviors or components, the Strategy Pattern replaces chains of `v-if` with a lookup object and `<component :is>`.

## When to Use

- When you have a growing chain of `v-if`/`v-else-if` for component selection
- When new variants need to be added frequently
- When the selection logic should be open for extension without modifying the template

## When Not to Use

- Three or four stable branches: a `v-if` chain is just as readable and keeps each component's props visible in the template
- When the variants need different props or emit different events: `<component :is>` passes the same bindings to all of them, and TypeScript can no longer check them per variant

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

```vue
<script setup lang="ts">
import type { Component } from 'vue'

type PaymentMethod = 'card' | 'paypal' | 'bank' | 'crypto'

const { paymentMethod } = defineProps<{ paymentMethod: PaymentMethod }>()

// A plain constant: components never need to be reactive
const paymentForms: Record<PaymentMethod, Component> = {
  card: CreditCardForm,
  paypal: PayPalForm,
  bank: BankTransferForm,
  crypto: CryptoForm,
}
</script>

<template>
  <component :is="paymentForms[paymentMethod]" />
</template>
```

## Notes

Adding a new payment method is now adding one line to the lookup object (and one member to the `PaymentMethod` type, which makes TypeScript point out a missing entry). You don't touch the template. This scales in a way that `v-if` chains don't — at 8 or 10 options the chain becomes unreadable, while the lookup stays one line per option.

If the key comes from outside your types (an API response, a URL), check it with `method in paymentForms` before you use it, and render a fallback for unknown methods.

Keep the map a plain constant. Putting components inside `ref()` or `reactive()` makes Vue proxy them and warn; if they must live in reactive state, see [markRaw for Third Party Instances](../performance-patterns/markraw-for-third-party-instances.md).

The map values can also be `defineAsyncComponent(() => import('./CryptoForm.vue'))`, so each form is only downloaded when it is chosen (see [Granular Code Splitting](../performance-patterns/granular-code-splitting.md)).

The lookup object is also easy to drive from outside — you could even receive it as a prop, making the component fully open for extension without modification.

This pattern is also used in [Schema-Driven Forms](../form-patterns/schema-driven-forms.md) where `fieldComponents` maps field type strings to the right component.
