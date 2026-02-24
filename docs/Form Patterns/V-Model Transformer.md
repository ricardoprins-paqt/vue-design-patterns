# V-Model Transformer

Using [[Writable Computed]] to transform a value between two formats — the format the parent/API uses and the format the input needs. Avoids having two separate pieces of state and keeping them in sync manually.

## When to Use

- When a prop comes in one format but the input needs another (cents ↔ dollars, timestamp ↔ Date)
- When you need a local transformation of a `v-model` value
- Comma-separated strings ↔ arrays

## Example

### Cents to Dollars

```js
// Props come in as cents (1099), input needs dollars ("10.99")
const props = defineProps<{ price: number }>()
const emit = defineEmits<{ 'update:price': [number] }>()

const displayPrice = computed({
  get: () => (props.price / 100).toFixed(2),
  set: (val) => emit('update:price', Math.round(parseFloat(val) * 100))
})
```

```vue
<input v-model="displayPrice" type="number" step="0.01" />
```

The component thinks in dollars, the parent thinks in cents, and neither has to care about the other's format.

### Comma-Separated String to Array

```js
const tags = computed({
  get: () => props.modelValue.split(',').filter(Boolean),
  set: (arr) => emit('update:modelValue', arr.join(','))
})
```

## Notes

The transformation is colocated and obvious. This is a core building block of [[Form Context]] and comes up constantly in form-heavy applications.
