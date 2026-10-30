# V-Model Transformer

Using [Writable Computed](../advanced-reactivity/writable-computed.md) to transform a value between two formats — the format the parent/API uses and the format the input needs. Avoids having two separate pieces of state and keeping them in sync manually.

## When to Use

- When a prop comes in one format but the input needs another (cents ↔ dollars, timestamp ↔ Date)
- When you need a local transformation of a `v-model` value
- Comma-separated strings ↔ arrays

## When Not to Use

- When the conversion is lossy or needs the user's intermediate input (dates typed character by character, formatted currency with separators): keep a local string `ref` for the input and convert on blur or submit.
- When only the display differs: format in the template (or a computed) and keep one value — no setter needed.

## Example

### Cents to Dollars

```vue
<script setup lang="ts">
import { computed } from 'vue'

// Props come in as cents (1099), input needs dollars (10.99)
const props = defineProps<{ price: number | null }>()
const emit = defineEmits<{ 'update:price': [number | null] }>()

const displayPrice = computed({
  // Return a number, not a formatted string: v-model on a number input
  // compares numbers, so a string like "1.00" would overwrite what the user types
  get: () => (props.price === null ? '' : props.price / 100),
  // v-model gives a number for type="number", or '' when the field is empty
  set: (val: number | string) => {
    emit('update:price', typeof val === 'number' ? Math.round(val * 100) : null)
  },
})
</script>

<template>
  <input v-model="displayPrice" type="number" step="0.01" />
</template>
```

The component thinks in dollars, the parent thinks in cents, and neither has to care about the other's format.

Two details are easy to get wrong here. Formatting in the getter (`(cents / 100).toFixed(2)`) looks harmless, but Vue then writes `"1.00"` back into the input while the user is typing `1`, so they can never type `15`. And an empty field must not become `Math.round(parseFloat('') * 100)`, which is `NaN`. Format for display outside the input (or on blur), and decide explicitly what "empty" means for the parent.

#### With `defineModel` (Vue 3.4+)

`defineModel` accepts `get` and `set` transformers, which does the same with less code:

```vue
<script setup lang="ts">
// Parent: <PriceInput v-model:price="priceInCents" />
const price = defineModel<number | null>('price', {
  get: (cents) => (cents === null ? null : cents / 100),
  set: (dollars) => (typeof dollars === 'number' ? Math.round(dollars * 100) : null),
})
</script>

<template>
  <input v-model="price" type="number" step="0.01" />
</template>
```

### Comma-Separated String to Array

```ts
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const tags = computed({
  get: () => props.modelValue.split(',').filter(Boolean),
  set: (tags: string[]) => emit('update:modelValue', tags.join(',')),
})

function addTag(tag: string) {
  tags.value = [...tags.value, tag] // assign a new array — tags.value.push(tag) would do nothing
}
```

The getter builds a new array on every read, so mutating it (`push`, `splice`) changes a throwaway copy and never reaches the setter. Always assign a new array.

## Notes

The transformation is colocated and obvious. It combines well with [Form Context](form-context.md) — a field component can wrap the `value` from `useField` in a transformer — and comes up constantly in form-heavy applications.
