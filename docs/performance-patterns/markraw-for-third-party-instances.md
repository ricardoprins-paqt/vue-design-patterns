# markRaw for Third Party Instances

When you store third party class instances inside reactive state — chart libraries, map instances, Three.js objects, WebSocket connections — Vue will try to proxy them. This causes two problems: it's wasteful because you don't need these tracked, and it often breaks the library because proxied objects don't behave identically to the originals.

## When to Use

- Chart.js, D3, Three.js, or any third party class instances stored in component state
- WebSocket connections, editor instances, map objects
- Any non-Vue object that manages its own internal state

## Example

```js
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

```js
const chartRef = useTemplateRef('canvas')
const chart = shallowRef(null)

onMounted(() => {
  chart.value = markRaw(new Chart(chartRef.value, {
    type: 'line',
    data: chartData
  }))
})

// Update chart when data changes without Vue ever touching the instance
watch(chartData, (newData) => {
  chart.value.data = newData  // direct mutation, no reactivity needed
  chart.value.update()        // chart library handles its own rendering
})

onBeforeUnmount(() => {
  chart.value.destroy()
})
```

## Notes

`markRaw` on the instance means even if you put it inside a reactive object or ref, Vue will never proxy it. Combined with `shallowRef` for the container, the instance is completely outside Vue's reactivity system while still being stored conveniently in component state.

See also: [[Reactivity Boundary Pattern]] for the broader concept of controlling where reactivity stops.
