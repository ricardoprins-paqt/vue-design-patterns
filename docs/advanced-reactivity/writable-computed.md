# Writable Computed

Most `computed` properties are read-only derived state. But `computed` accepts a getter AND a setter, creating a two-way transformation between a source value and a derived representation.

## When to Use

- Converting between formats (celsius/fahrenheit, cents/dollars)
- Creating a local transformation layer for a prop without violating "don't mutate props"
- As the basis for [V-Model Transformer](../form-patterns/v-model-transformer.md)

## Example

### Basic Two-Way Transformation

```ts
import { ref, computed } from 'vue'

const celsius = ref(0)

const fahrenheit = computed({
  get: () => celsius.value * 9/5 + 32,
  set: (val) => celsius.value = (val - 32) * 5/9
})

fahrenheit.value = 212  // sets celsius to 100
console.log(celsius.value) // 100
```

### Prop Transformation

```ts
// Component receives a timestamp, wants to work with a Date object
const props = defineProps<{ timestamp: number }>()
const emit = defineEmits<{ 'update:timestamp': [number] }>()

const date = computed({
  get: () => new Date(props.timestamp),
  set: (d) => emit('update:timestamp', d.getTime())
})

// Now you can bind date directly to a date picker
// Reading gives a Date object, writing emits the right number
```

## Notes

`defineModel` (Vue 3.4+) is built on the same idea: reading gives you the prop, writing emits the update event. Internally it is a `customRef` rather than a `computed`, so it can also keep a local value when the parent doesn't bind `v-model`. For simple transforms it takes `get`/`set` options itself:

```ts
const timestamp = defineModel<number>('timestamp', { required: true })

// Transform on the way out, without an extra computed
const [value, modifiers] = defineModel<string, 'trim'>({
  set: (v) => (modifiers.trim ? v.trim() : v)
})
```

If you need a value of a *different type* (a `Date` for a `number` prop, like above), a writable computed over the model is the right tool:

```ts
const date = computed({
  get: () => new Date(timestamp.value),
  set: (d: Date) => { timestamp.value = d.getTime() }
})
```

See also: [V-Model Transformer](../form-patterns/v-model-transformer.md) for the form-specific application of this pattern.
