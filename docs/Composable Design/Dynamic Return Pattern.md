# Dynamic Return Pattern

Sometimes a composable is used in a simple context that just needs one value, and other times it's used in a more complex context that needs full control. The Dynamic Return Pattern supports both modes.

## When to Use

- When a composable has both simple and advanced use cases
- When you want a shorthand for the common case without sacrificing flexibility

## Example

Basic form — return an object, destructure what you need:

```js
export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  // ... event listeners etc

  return { width, height }
}
```

The more advanced version supports both a single-value shorthand AND a full object, like Nuxt's `useFetch` does:

```js
export function useAsyncData(fetcher) {
  const data = ref(null)
  const error = ref(null)
  const pending = ref(true)

  const promise = fetcher().then(result => {
    data.value = result
    pending.value = false
  }).catch(err => {
    error.value = err
    pending.value = false
  })

  // Attach the reactive state to the promise
  // so you can either await it OR destructure it
  promise.data = data
  promise.error = error
  promise.pending = pending

  return promise
}
```

```js
// Simple usage - just await the data
const data = await useAsyncData(fetcher)

// Advanced usage - get full control
const { data, error, pending } = useAsyncData(fetcher)
```

## Notes

This is the exact pattern Nuxt uses internally. The composable returns something that works in both modes without forcing the caller to always deal with the full object when they don't need to.
