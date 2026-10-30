# The Computed Caching Pattern

Computed values are cached based on their reactive dependencies — they only recompute when a dependency changes. But this only applies when you actually use `computed`. A common mistake is putting expensive derivations in methods or directly in the template.

## When to Use

- Any expensive data transformation that depends on reactive state
- When you want to chain multiple transformation steps with independent caching
- Replacing method calls in templates that re-run on every render

## Example

### Avoid Uncached Template Calls

```vue
<!-- ❌ processData() runs on EVERY render, no caching -->
<div v-for="item in processData(rawData)">...</div>

<!-- ✅ only recomputes when rawData changes -->
<div v-for="item in processedData">...</div>
```

```ts
const processedData = computed(() => processData(rawData.value))
```

### Chaining Computed Properties

Rather than one massive computed that does everything, chain smaller ones — Vue only recomputes the parts whose dependencies actually changed:

```ts
// If page changes, only paginated recomputes
// If sort changes, sorted recomputes from cached filtered, then paginated
// If filters or rawData change, everything downstream recomputes
const filtered = computed(() => rawData.value.filter(applyFilters))
const sorted = computed(() => [...filtered.value].sort(applySort))
const paginated = computed(() => sorted.value.slice(page.value * size, (page.value + 1) * size))
```

Order the chain so the inputs that change most often come last: they then only re-run the cheap tail of the chain.

Each `computed` is a cache boundary. Changes propagate only as far as they need to.

## Notes

This is simple but frequently misunderstood. The key insight is that each computed in a chain acts as a cache boundary — downstream computeds only re-run if their specific input actually changed, not if any upstream data changed.

"Changed" means a new value by `Object.is`. Since Vue 3.4, a computed that recomputes to the *same* primitive doesn't trigger anything downstream, but a computed that returns a new array or object (like `filter` or `[...x].sort()`) always counts as changed.

Don't wrap trivial expressions (`a.value + b.value`, a property lookup) in their own computed just for caching: the bookkeeping costs more than the work it saves.
