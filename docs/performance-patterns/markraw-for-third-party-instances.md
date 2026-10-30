# markRaw for Third Party Instances

When you store third party class instances inside reactive state — chart libraries, map instances, Three.js objects, editor instances — Vue will try to proxy them. This causes two problems: it's wasteful because you don't need these tracked, and it often breaks the library because proxied objects don't behave identically to the originals.

## When to Use

- Chart.js, D3, Three.js, or any third party class instances stored in component state
- Editor instances, map objects
- Any non-Vue object that manages its own internal state

Vue only proxies plain objects, arrays, `Map`/`Set` and class instances. Built-in objects like `WebSocket`, `Date` or DOM elements are never proxied, so they don't need `markRaw`.

## Example

```ts
// ❌ Vue tries to proxy the chart instance, which can break it
const state = reactive({
  chart: new Chart(canvas, config),
  data: []
})

// ✅ markRaw tells Vue to never proxy this, ever
const state = reactive({
  chart: markRaw(new Chart(canvas, config)),
  data: [] // still reactive
})
```

### Full Component Pattern

```vue
<script setup lang="ts">
import { shallowRef, markRaw, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import { Chart, type ChartData } from 'chart.js/auto'

const props = defineProps<{ data: ChartData<'line'> }>()

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const chart = shallowRef<Chart | null>(null)

onMounted(() => {
  if (!canvas.value) return
  chart.value = markRaw(new Chart(canvas.value, {
    type: 'line',
    data: props.data
  }))
})

// Update chart when data changes without Vue ever touching the instance
watch(() => props.data, (newData) => {
  if (!chart.value) return     // data can change before the chart exists
  chart.value.data = newData   // direct mutation, no reactivity needed
  chart.value.update()         // chart library handles its own rendering
}, { deep: true })

onBeforeUnmount(() => {
  chart.value?.destroy()
})
</script>

<template>
  <canvas ref="canvas" />
</template>
```

## Notes

`markRaw` on the instance means even if you put it inside a reactive object or ref, Vue will never proxy it. A `shallowRef` on its own already doesn't proxy its value, so in the component example `markRaw` is a safety net: it keeps the instance raw even if it later ends up in a `reactive()` object or a deep `ref`. Together, the instance is completely outside Vue's reactivity system while still being stored conveniently in component state.

If you never put the instance in reactive state at all, a plain `let chart: Chart | undefined` variable in `<script setup>` is the simplest option.

See also: [Reactivity Boundary Pattern](../composable-design/reactivity-boundary-pattern.md) for the broader concept of controlling where reactivity stops.
