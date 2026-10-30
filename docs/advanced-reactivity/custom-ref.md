# Custom Ref

`customRef` gives you full control over when a ref tracks dependencies and when it triggers updates. You get two functions — `track` and `trigger` — and you decide when to call them.

## When to Use

- Debounced refs (delay triggering updates)
- Validated refs (reject invalid values)
- Any ref that needs custom behavior on get or set

## When Not to Use

- For a debounced value, VueUse's `refDebounced` or `watchDebounced` keep the input bound to a normal ref and debounce only the consumer, which avoids the `v-model` pitfall below.
- If you only need to transform or validate on write, a [Writable Computed](writable-computed.md) over a normal ref is easier to read.

## Example

### Debounced Ref

```ts
import { customRef } from 'vue'

function useDebouncedRef<T>(initialValue: T, delay = 300) {
  let value = initialValue
  let timeout: ReturnType<typeof setTimeout> | undefined

  return customRef<T>((track, trigger) => ({
    get() {
      track()              // tell Vue "this value is a dependency"
      return value
    },
    set(newValue) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        value = newValue
        trigger()          // tell Vue "something changed, re-render"
      }, delay)
    }
  }))
}
```

```ts
const searchQuery = useDebouncedRef('', 400)
// searchQuery behaves like a normal ref but only triggers
// watchers and re-renders 400ms after the user stops typing
```

```vue
<input v-model="searchQuery" />
<!-- watcher only fires after user pauses typing -->
```

Be careful with `v-model` here: until the timeout fires, `searchQuery.value` still returns the old value. If anything else re-renders the component during that window, Vue's `v-model` writes that old value back into the input and the user's typing is lost. Keep the input bound to a plain ref and debounce what reacts to it when the component re-renders often.

### Validated Ref

```ts
import { customRef } from 'vue'

function useValidatedRef<T>(initialValue: T, validator: (value: T) => boolean) {
  let value = initialValue

  return customRef<T>((track, trigger) => ({
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
