# Reactivity Boundary Pattern

Being deliberate about where reactivity stops. By default Vue tracks deeply: every nested property you read inside a `computed` or watcher through a reactive proxy becomes a tracked dependency. For large data structures that tracking has a real cost, and a change to any property you read re-runs the whole computation.

## When to Use

- When processing large reactive objects with expensive transformations
- When you want to control exactly which changes trigger recomputation
- When storing non-reactive objects (chart instances, editor instances) inside reactive state

## When Not to Use

- For normal-sized state. Deep tracking is cheap at that scale, and an escape hatch makes the code harder to reason about.
- When the data is mutated in place. Code that reads through `toRaw` can't see those mutations, so it silently goes stale.
- If you control where the data is stored, prefer `shallowRef` or `shallowReactive` (see [shallowRef and triggerRef](../performance-patterns/shallowref-and-triggerref.md)): they draw the boundary once, where the state is declared, instead of in every consumer.

## Example

### Strategic `toRaw` for Heavy Processing

```ts
import { computed, toRaw } from 'vue'
import type { Ref } from 'vue'

export function useDataProcessor(data: Ref<Dataset>) {
  const processed = computed(() => {
    // Cross the boundary — get raw data for heavy processing
    const raw = toRaw(data.value)

    // Now process without Vue tracking every property access
    return expensiveTransformation(raw)
  })

  return { processed }
}
```

```ts
function expensiveTransformation(raw: Dataset) {
  // Called inside the computed, but `raw` is not a proxy:
  // reading raw.items, raw.users etc. creates no dependencies
  return raw.items.flatMap((item) => /* complex logic */)
}
```

Without `toRaw`, every property access inside `expensiveTransformation` would be tracked as a dependency. With `toRaw` you explicitly say "I only want to recompute when `data.value` itself is replaced, not when any nested property changes."

That is a contract with whoever updates the data: they have to replace it (`data.value = { ...data.value, items: newItems }`), not mutate it (`data.value.items.push(item)`). A push changes the data but not `data.value`, so `processed` keeps returning the old result. The [Vue docs](https://vuejs.org/api/reactivity-advanced.html#toraw) call `toRaw` an escape hatch for this reason. When you own the state, declaring it with `shallowRef` gives the same performance and makes the "replace, don't mutate" rule visible where the state lives.

### Using `markRaw` for Non-Reactive Objects

```ts
import { markRaw, reactive } from 'vue'

const chartInstance = markRaw(new Chart(canvas, config))
const state = reactive({
  chart: chartInstance, // won't be proxied, Vue won't try to track it
  data: []
})
```

Class instances like charts and editors often break when wrapped in a proxy (private `#fields` and internal identity checks fail), and tracking their internals is pure overhead. See [markRaw for Third Party Instances](../performance-patterns/markraw-for-third-party-instances.md). If the instance is the only thing you store, `shallowRef(chart)` is the simpler option.

## Notes

`toRaw` and `markRaw` both set a boundary between the reactive and non-reactive worlds, at different moments: `toRaw` reads past an existing proxy for one piece of code, while `markRaw` permanently stops an object from ever being made reactive. Either way, the point is to be intentional about the boundary rather than letting Vue decide everything should be deeply tracked.
