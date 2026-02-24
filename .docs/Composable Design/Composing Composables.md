# Composing Composables

Composables are most powerful when they're small and focused enough to be composed together, with the output of one feeding into another.

## When to Use

- When building complex features from smaller, reusable pieces
- When you want each piece to be independently testable and reusable
- When a composable's inputs could come from different sources

## Example

```js
// Each composable does one thing
function useMousePosition() {
  const x = ref(0)
  const y = ref(0)
  // ... event listener
  return { x, y }
}

function useElementUnderMouse(x, y) {
  const element = computed(() => document.elementFromPoint(x.value, y.value))
  return { element }
}

function useTooltip(element) {
  const tooltip = computed(() => element.value?.dataset?.tooltip ?? null)
  return { tooltip }
}

// Compose them — output of one becomes input of the next
const { x, y } = useMousePosition()
const { element } = useElementUnderMouse(x, y)
const { tooltip } = useTooltip(element)
```

Each composable is independently testable and reusable. `useElementUnderMouse` doesn't care where `x` and `y` come from — they could be from mouse position, touch events, or hardcoded values.

## The Anti-Pattern

```js
// ❌ hard to compose, hard to test
function useTooltip() {
  const { x, y } = useMousePosition() // tightly coupled inside
  const element = computed(() => document.elementFromPoint(x.value, y.value))
  const tooltip = computed(() => element.value?.dataset?.tooltip ?? null)
  return { tooltip }
}
```

This works but now you can't use `useTooltip` with any other position source.

## Notes

Accepting dependencies as arguments keeps the doors open. This is why accepting `MaybeRefOrGetter` matters so much — it makes composables composable.
