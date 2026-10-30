# shallowRef + triggerRef for Large Data Structures

When you have large arrays or complex objects that you always replace wholesale rather than mutate deeply, `shallowRef` is a significant performance win. Vue won't set up deep tracking on the contents — only the top-level `.value` assignment is reactive.

## When to Use

- Large datasets from an API (thousands of rows)
- Data grids with client-side sorting and filtering
- Any large collection where you replace the whole array rather than mutating individual items

## When Not to Use

- Rows that are edited in place (inline editing, `v-model` on row fields): those edits need deep reactivity, or you'll be calling `triggerRef` everywhere.
- Small collections: deep reactivity costs little there, and plain `ref` is easier to reason about.

## Example

```ts
// ❌ ref() makes the array deeply reactive: every row becomes a proxy
// as soon as it's accessed (rendering accesses all of them), and every
// property read during render is tracked. For 10,000 rows that adds up.
const rows = ref<Row[]>([])
rows.value = await fetchLargeDataset()

// ✅ shallowRef only tracks the assignment itself
const rows = shallowRef<Row[]>([])
rows.value = await fetchLargeDataset() // Vue only tracks rows.value itself
```

When you do need to mutate the contents and trigger an update, use `triggerRef` manually:

```ts
function sortRows(key: keyof Row) {
  rows.value.sort((a, b) => a[key] > b[key] ? 1 : -1) // mutate in place
  triggerRef(rows) // manually tell Vue something changed
}
```

Often you don't need `triggerRef` at all: assigning a new array is just as cheap and works everywhere:

```ts
function sortRows(key: keyof Row) {
  rows.value = rows.value.toSorted((a, b) => a[key] > b[key] ? 1 : -1)
}
```

Prefer this when other code derives from `rows`. After an in-place mutation + `triggerRef`, a `computed` that returns the same array (for example `computed(() => rows.value)`) recomputes to the identical object, so Vue sees no change and anything depending on it doesn't update.

## Notes

The mental model is: `shallowRef` opts you out of automatic deep tracking, `triggerRef` is how you opt back in for a specific moment.

A real-world scenario where this matters: a data grid with thousands of rows where you're doing client-side sorting and filtering. With deep reactivity Vue would track every property of every row object. With `shallowRef` it only cares about whether `rows.value` itself was reassigned.
