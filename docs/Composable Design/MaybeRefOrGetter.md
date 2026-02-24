# MaybeRefOrGetter Pattern

Making composables flexible by accepting refs, getters, or raw values. Uses `MaybeRefOrGetter` type + `toValue()` + conditional watching to create library-quality APIs that don't force consumers to pack and repack their values.

## When to Use

- Building reusable composables for a team or library
- When a composable could reasonably work with static or reactive data
- To avoid forcing consumers into verbose `computed(() => props.id)` wrappers
- When you want VueUse-level API ergonomics

## The Problem

A composable that only accepts refs is inflexible:

```js
// ❌ Forces reactivity even when not needed
export function useProduct(id: Ref<number>) {
  // ...
}

// Consumer is forced to wrap everything
const product = useProduct(ref(1)) // annoying
const product = useProduct(computed(() => props.id)) // verbose
```

And accessing reactive object properties requires repacking:

```js
const props = defineProps<{ id: number }>()

// ❌ Doesn't work — props.id is not reactive when extracted
useProduct(props.id)

// ✅ Have to repack it
useProduct(computed(() => props.id)) // verbose!
useProduct(toRef(props, 'id')) // still verbose!
```

## Solution

### Step 1: Accept `MaybeRefOrGetter`

```ts
import { MaybeRefOrGetter } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>) {
  // ...
}
```

This type (built into Vue 3.3+) accepts:
- Raw values: `useProduct(1)`
- Refs: `useProduct(ref(1))`
- Getters: `useProduct(() => props.id)`

### Step 2: Extract the Value with `toValue()`

```ts
import { MaybeRefOrGetter, toValue, ref, onMounted } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref(null)
  
  onMounted(async () => {
    // toValue() extracts the value regardless of type
    product.value = await fetchProduct(toValue(id))
  })
  
  return { product }
}
```

`toValue()` works like this:
- Ref → `ref.value`
- Getter → call it and return result
- Raw value → return as-is

### Step 3: Watch Conditionally

If the value is reactive, set up a watcher. If it's static, skip the watcher:

```ts
import { MaybeRefOrGetter, toValue, isRef, ref, onMounted, watch } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref(null)
  
  const fetchAndUpdate = async () => {
    product.value = await fetchProduct(toValue(id))
  }
  
  onMounted(fetchAndUpdate)
  
  // Only watch if it's reactive
  if (isRef(id) || typeof id === 'function') {
    watch(id, fetchAndUpdate)
  }
  
  return { product }
}
```

Or use a helper:

```ts
function isWatchable<T>(value: MaybeRefOrGetter<T>): value is Ref<T> | (() => T) {
  return isRef(value) || typeof value === 'function'
}

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref(null)
  
  const fetchAndUpdate = async () => {
    product.value = await fetchProduct(toValue(id))
  }
  
  onMounted(fetchAndUpdate)
  
  if (isWatchable(id)) {
    watch(id, fetchAndUpdate)
  }
  
  return { product }
}
```

### Full Example

```ts
import { MaybeRefOrGetter, toValue, watch, ref } from 'vue'

function isWatchable<T>(value: MaybeRefOrGetter<T>): value is Ref<T> | (() => T) {
  return isRef(value) || typeof value === 'function'
}

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const fetchAndUpdate = async () => {
    loading.value = true
    error.value = null
    try {
      product.value = await fetchProduct(toValue(id))
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }
  
  // Initial fetch
  fetchAndUpdate()
  
  // Watch for changes if reactive
  if (isWatchable(id)) {
    watch(id, fetchAndUpdate)
  }
  
  return { product, loading, error }
}
```

## Usage Examples

All of these now work:

```vue
<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProduct } from '@/composables/products'

const route = useRoute()
const props = defineProps<{ productId: number }>()

// ✅ Static value
const product1 = useProduct(42)

// ✅ Ref
const id = ref(42)
const product2 = useProduct(id)

// ✅ Getter extracting from reactive object
const product3 = useProduct(() => props.productId)

// ✅ Getter from route params — no repacking needed!
const product4 = useProduct(() => route.params.id)

// ✅ Computed ref
const product5 = useProduct(computed(() => props.productId))
</script>
```

## Notes

**Pre-Vue 3.3:**
Define the type yourself:

```ts
import { Ref } from 'vue'

type MaybeRef<T> = Ref<T> | T
type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)
```

**Why Getters?**
Getters let consumers extract reactive properties without the `toRef()` / `computed()` ceremony. It's the difference between:

```js
// ❌ Verbose
useProduct(toRef(props, 'id'))

// ✅ Clean
useProduct(() => props.id)
```

**When to Watch:**
Only watch if the value can change. `isRef()` checks for refs, `typeof === 'function'` checks for getters. Raw values are static and don't need watching.

**VueUse Standard:**
Almost every VueUse composable uses this pattern. It's the industry standard for flexible, ergonomic composable APIs.

**watch() Accepts Getters:**
Vue's `watch()` natively accepts getter functions as the source, so `watch(id, ...)` works whether `id` is a ref or a getter. This makes the implementation clean.

This pattern eliminates the "repacking refs" problem and makes composables feel natural to use with props, route params, and any other reactive data source.
