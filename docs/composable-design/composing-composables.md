# Composing Composables

Composables are most powerful when they're small and focused enough to be composed together, with the output of one feeding into another.

## When to Use

- When building complex features from smaller, reusable pieces
- When you want each piece to be independently testable and reusable
- When a composable's inputs could come from different sources

## When Not to Use

- When the pieces are only ever used together. Splitting one 15-line composable into three adds indirection without adding reuse.
- When the "inputs" are really internal details. A composable that always reads the mouse position can just call `useMousePosition()` inside; that is normal composition, not an anti-pattern.

## Example

```ts
import { ref, computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

// Each composable does one thing
function useMousePosition() {
  const x = ref(0)
  const y = ref(0)
  // ... add a mousemove listener in onMounted, remove it in onUnmounted
  return { x, y }
}

function useElementUnderMouse(x: MaybeRefOrGetter<number>, y: MaybeRefOrGetter<number>) {
  // Client-only: `document` does not exist during SSR
  const element = computed(() => document.elementFromPoint(toValue(x), toValue(y)))
  return { element }
}

function useTooltip(element: MaybeRefOrGetter<Element | null>) {
  const tooltip = computed(() => {
    const el = toValue(element)
    return el instanceof HTMLElement ? el.dataset.tooltip ?? null : null
  })
  return { tooltip }
}

// Compose them — output of one becomes input of the next
const { x, y } = useMousePosition()
const { element } = useElementUnderMouse(x, y)
const { tooltip } = useTooltip(element)
```

Each composable is independently testable and reusable. `useElementUnderMouse` doesn't care where `x` and `y` come from — they could be from mouse position, touch events, or hardcoded values. That works because it accepts [`MaybeRefOrGetter`](maybereforgetter.md) and reads the values with `toValue()`, so `useElementUnderMouse(100, 200)` is as valid as passing refs.

## The Anti-Pattern

```ts
// ❌ hard to compose, hard to test
function useTooltip() {
  const { x, y } = useMousePosition() // tightly coupled inside
  const element = computed(() => document.elementFromPoint(x.value, y.value))
  const tooltip = computed(() => element.value?.dataset?.tooltip ?? null)
  return { tooltip }
}
```

This works but now you can't use `useTooltip` with any other position source, and a test has to fake mouse events to reach the tooltip logic.

## Notes

Accepting dependencies as arguments keeps the doors open. This is why accepting `MaybeRefOrGetter` matters so much — it makes composables composable.

`elementFromPoint` only re-runs when `x` or `y` change. If the DOM under a still mouse changes, `element` keeps the old value; that is fine for tooltips, but worth knowing before you reuse it for something stricter.
