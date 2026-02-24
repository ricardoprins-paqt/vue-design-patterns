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

```js
const processedData = computed(() => processData(rawData.value))
```

### Chaining Computed Properties

Rather than one massive computed that does everything, chain smaller ones — Vue only recomputes the parts whose dependencies actually changed:

```js
// If filter changes, Vue recomputes filtered but uses cached sorted
// If sort changes, Vue recomputes sorted from cached filtered
// Only if rawData changes does everything recompute
const filtered = computed(() => rawData.value.filter(applyFilters))
const sorted = computed(() => filtered.value.sort(applySort))
const paginated = computed(() => sorted.value.slice(page.value * size, ...))
```

Each `computed` is a cache boundary. Changes propagate only as far as they need to.

## Notes

This is simple but frequently misunderstood. The key insight is that each computed in a chain acts as a cache boundary — downstream computeds only re-run if their specific input actually changed, not if any upstream data changed.
