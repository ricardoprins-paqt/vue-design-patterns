# Reactivity Debugging

Dev-only hooks `onTrack` and `onTrigger` let you see exactly what Vue's reactivity system is doing — which dependencies are tracked and what changes cause re-runs.

## When to Use

- When a watcher or computed is firing too often
- When you need to find which dependency is causing mystery re-renders
- When a computed is tracking a deeply nested property you didn't expect

## Example

### On Watchers

```js
watchEffect(() => {
  renderChart(data.value)
}, {
  onTrack(e) {
    console.log('tracking:', e.key, 'on', e.target)
  },
  onTrigger(e) {
    console.log('triggered by:', e.key, 'changed from', e.oldValue, 'to', e.newValue)
  }
})
```

### On Computed

```js
const expensiveResult = computed(() => process(data.value), {
  onTrack(e) {
    console.log('computed tracking:', e.key)
  },
  onTrigger(e) {
    console.log('computed re-running because:', e.key)
  }
})
```

## Debugging Workflow

1. Add `onTrigger` to the component's render effect (via `onRenderTriggered`) to find which dependency is causing re-renders
2. If it's a computed, add `onTrigger` to the computed to find why it's recomputing
3. If it's a watcher firing too often, add `onTrack` to see what it's tracking that you didn't expect

## Notes

- `onTrack` fires when a dependency is first accessed — when Vue starts watching it
- `onTrigger` fires when a dependency changes and causes a re-run

**Most common surprise**: a watcher or computed is tracking a deeply nested property you didn't realize it was accessing, causing it to re-run on unrelated changes. Seeing it in the debug event immediately tells you where to add a `toRaw` (see [[Reactivity Boundary Pattern]]) or restructure the access.

These hooks are **dev-only** — they're stripped out in production builds.
