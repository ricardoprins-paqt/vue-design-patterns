# shallowRef + triggerRef for Large Data Structures

When you have large arrays or complex objects that you always replace wholesale rather than mutate deeply, `shallowRef` is a significant performance win. Vue won't set up deep tracking on the contents — only the top-level `.value` assignment is reactive.

## When to Use

- Large datasets from an API (thousands of rows)
- Data grids with client-side sorting and filtering
- Any large collection where you replace the whole array rather than mutating individual items

## Example

```js
// ❌ reactive() or ref() will deeply proxy every object in this array
// For 10,000 rows that's a lot of proxy wrapping
const rows = ref([])
rows.value = await fetchLargeDataset() // Vue proxies every nested object

// ✅ shallowRef only tracks the assignment itself
const rows = shallowRef([])
rows.value = await fetchLargeDataset() // Vue only tracks rows.value itself
```

When you do need to mutate the contents and trigger an update, use `triggerRef` manually:

```js
function sortRows(key) {
  rows.value.sort((a, b) => a[key] > b[key] ? 1 : -1) // mutate in place
  triggerRef(rows) // manually tell Vue something changed
}
```

## Notes

The mental model is: `shallowRef` opts you out of automatic deep tracking, `triggerRef` is how you opt back in for a specific moment.

A real-world scenario where this matters: a data grid with thousands of rows where you're doing client-side sorting and filtering. With deep reactivity Vue would track every property of every row object. With `shallowRef` it only cares about whether `rows.value` itself was reassigned.
