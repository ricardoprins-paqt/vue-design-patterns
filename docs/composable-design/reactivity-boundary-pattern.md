# Reactivity Boundary Pattern

Being deliberate about where reactivity stops. By default Vue tracks deeply, which means if you have a large reactive object, every nested property access inside a `computed` or `watcher` becomes a tracked dependency. This can cause unnecessary re-renders or performance issues.

## When to Use

- When processing large reactive objects with expensive transformations
- When you want to control exactly which changes trigger recomputation
- When storing non-reactive objects (chart instances, editor instances) inside reactive state

## Example

### Strategic `toRaw` for Heavy Processing

```js
export function useDataProcessor(reactiveData) {
  const processed = computed(() => {
    // Cross the boundary — get raw data for heavy processing
    const raw = toRaw(reactiveData.value)

    // Now process without Vue tracking every property access
    return expensiveTransformation(raw)
  })

  return { processed }
}
```

```js
function expensiveTransformation(raw) {
  // This runs outside Vue's tracking system
  // Accesses to raw.items, raw.users etc don't create dependencies
  return raw.items.flatMap(item => /* complex logic */)
}
```

Without `toRaw`, every property access inside `expensiveTransformation` would be tracked as a dependency. With `toRaw` you explicitly say "I only want to recompute when `reactiveData.value` itself changes, not when any nested property changes."

### Using `markRaw` for Non-Reactive Objects

```js
const chartInstance = markRaw(new Chart(canvas, config))
const state = reactive({
  chart: chartInstance, // won't be proxied, Vue won't try to track it
  data: []
})
```

## Notes

Both `toRaw` and `markRaw` are about the same idea — being intentional about the boundary between reactive and non-reactive worlds rather than letting Vue decide everything should be deeply tracked.
