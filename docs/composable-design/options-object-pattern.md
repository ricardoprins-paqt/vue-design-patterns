# Options Object Pattern

When a composable needs more than one or two arguments, a plain parameter list quickly becomes painful. The Options Object Pattern replaces positional args with a named config object.

## When to Use

- When a composable has more than two arguments
- When you want self-documenting API calls
- When you need to add new options without breaking existing callers

## When Not to Use

- For one or two arguments whose meaning is obvious from the name: `useProduct(id)` does not need `useProduct({ id })`.
- For required inputs. Keep the main subject positional (`useUndoHistory(source, options)`) and put only the optional settings in the object, so TypeScript still forces callers to pass what is required.

## Example

**Before** — unclear positional arguments:

```ts
// What does true mean? What is 10? What is 500? What is 'post'?
const history = useUndoHistory(myRef, true, 10, 500, 'post')
```

**After** — named config object:

```ts
const history = useUndoHistory(myRef, {
  deep: true,
  capacity: 10,
  debounce: 500,
  flush: 'post',
})
```

Every argument is self-documenting. Adding new options in the future doesn't break existing callers since you're just adding optional keys. An interface documents the options and gives callers autocompletion:

```ts
import type { Ref } from 'vue'

export interface UseUndoHistoryOptions {
  /** Track nested changes inside the source */
  deep?: boolean
  /** Maximum number of history entries to keep */
  capacity?: number
  /** Wait this many ms after the last change before recording */
  debounce?: number
  /** When to record relative to rendering, same as watch() */
  flush?: 'pre' | 'post' | 'sync'
}

export function useUndoHistory<T>(source: Ref<T>, options: UseUndoHistoryOptions = {}) {
  const {
    deep = false,
    capacity = Infinity,
    debounce = 0,
    flush = 'pre',
  } = options

  // ...
}
```

## Notes

VueUse uses this pattern almost universally. Its real [`useRefHistory`](https://vueuse.org/core/useRefHistory/) takes the source plus an options object much like the one above. Worth adopting as a default for any composable with more than two arguments.

Options are read once, when the composable is called. If an option has to change at runtime (say, `capacity`), type it as [`MaybeRefOrGetter`](maybereforgetter.md) and read it with `toValue()` where it is used.
