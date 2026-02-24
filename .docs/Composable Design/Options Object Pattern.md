# Options Object Pattern

When a composable needs more than one or two arguments, a plain parameter list quickly becomes painful. The Options Object Pattern replaces positional args with a named config object.

## When to Use

- When a composable has more than two arguments
- When you want self-documenting API calls
- When you need to add new options without breaking existing callers

## Example

**Before** — unclear positional arguments:

```js
// What does true mean? What is 500? What is 'click'?
const history = useRefHistory(myRef, true, 10, 500, 'click', false)
```

**After** — named config object:

```js
const history = useRefHistory(myRef, {
  deep: true,
  capacity: 10,
  debounce: 500,
  eventFilter: 'click',
  flush: false,
})
```

Every argument is self-documenting. Adding new options in the future doesn't break existing callers since you're just adding optional keys:

```js
export function useRefHistory(source, options = {}) {
  const {
    deep = false,
    capacity = Infinity,
    debounce = 0,
  } = options

  // ...
}
```

## Notes

VueUse uses this pattern almost universally. Worth adopting as a default for any composable with more than two arguments.
