# Custom Ref

`customRef` gives you full control over when a ref tracks dependencies and when it triggers updates. You get two functions — `track` and `trigger` — and you decide when to call them.

## When to Use

- Debounced refs (delay triggering updates)
- Validated refs (reject invalid values)
- Any ref that needs custom behavior on get or set

## Example

### Debounced Ref

```js
function useDebouncedRef(initialValue, delay = 300) {
  let timeout

  return customRef((track, trigger) => ({
    get() {
      track()              // tell Vue "this value is a dependency"
      return initialValue
    },
    set(newValue) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        initialValue = newValue
        trigger()          // tell Vue "something changed, re-render"
      }, delay)
    }
  }))
}
```

```js
const searchQuery = useDebouncedRef('', 400)
// searchQuery behaves like a normal ref but only triggers
// watchers and re-renders 400ms after the user stops typing
```

```vue
<input v-model="searchQuery" />
<!-- watcher only fires after user pauses typing -->
```

### Validated Ref

```js
function useValidatedRef(initialValue, validator) {
  let value = initialValue

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      if (!validator(newValue)) return // reject invalid values silently
      value = newValue
      trigger()
    }
  }))
}

const age = useValidatedRef(0, (v) => v >= 0 && v <= 120)
age.value = -5   // rejected, nothing happens
age.value = 25   // accepted, triggers update
```

## Notes

The key insight is that `track` and `trigger` are deliberately separated. Normal refs call both automatically — `customRef` lets you decouple them completely. You could trigger without tracking, track without triggering, delay either, or add conditions.
