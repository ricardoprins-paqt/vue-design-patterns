# Writable Computed

Most `computed` properties are read-only derived state. But `computed` accepts a getter AND a setter, creating a two-way transformation between a source value and a derived representation.

## When to Use

- Converting between formats (celsius/fahrenheit, cents/dollars)
- Creating a local transformation layer for a prop without violating "don't mutate props"
- As the basis for [[V-Model Transformer]]

## Example

### Basic Two-Way Transformation

```js
const celsius = ref(0)

const fahrenheit = computed({
  get: () => celsius.value * 9/5 + 32,
  set: (val) => celsius.value = (val - 32) * 5/9
})

fahrenheit.value = 212  // sets celsius to 100
console.log(celsius.value) // 100
```

### Prop Transformation

```js
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

This is exactly how `defineModel` works internally — it's a computed with a getter that reads the prop and a setter that emits the update event. If you ever need a transformed version of a `v-model` value, writable computed is the right tool.

See also: [[V-Model Transformer]] for the form-specific application of this pattern.
