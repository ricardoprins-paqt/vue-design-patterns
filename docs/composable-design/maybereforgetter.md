# MaybeRefOrGetter Pattern

Making composables flexible by accepting refs, getters, or raw values. Uses `MaybeRefOrGetter` type + `toValue()` + conditional watching to create library-quality APIs that don't force consumers to pack and repack their values.

## When to Use

- Building reusable composables for a team or library
- When a composable could reasonably work with static or reactive data
- To avoid forcing consumers into verbose `computed(() => props.id)` wrappers
- When you want VueUse-level API ergonomics

## When Not to Use

- For a composable used in one place with one kind of input. Accept exactly what you get (`Ref<number>` or a getter) and widen it later if a second caller needs it.
- When the input must be reactive for the composable to make sense. Accepting a raw value silently turns a "live" composable into a one-shot one; type the parameter as `Ref<T> | (() => T)` instead.

## The Problem

A composable that only accepts refs is inflexible:

```ts
// ❌ Forces reactivity even when not needed
export function useProduct(id: Ref<number>) {
  // ...
}

// Consumer is forced to wrap everything
const product = useProduct(ref(1)) // annoying
const product = useProduct(computed(() => props.id)) // verbose
```

And accessing reactive object properties requires repacking:

```ts
const props = defineProps<{ id: number }>()

// ❌ Doesn't work — props.id is not reactive when extracted
useProduct(props.id)

// ✅ Have to repack it
useProduct(computed(() => props.id)) // verbose!
useProduct(toRef(props, 'id')) // still verbose!
```

The same applies to [reactive props destructuring](../component-api-design/reactive-props-destructuring.md) in Vue 3.5: `const { id } = defineProps<{ id: number }>()` gives you a value, so you still pass `() => id` to keep it reactive.

## Solution

### Step 1: Accept `MaybeRefOrGetter`

```ts
import type { MaybeRefOrGetter } from 'vue'

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
import { toValue, ref, onMounted } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref<Product | null>(null)

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
import { toValue, isRef, ref, onMounted, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref<Product | null>(null)

  const fetchAndUpdate = async () => {
    product.value = await fetchProduct(toValue(id))
  }

  onMounted(fetchAndUpdate)

  // Only watch if it's reactive — watch() warns about a plain number as source
  if (isRef(id) || typeof id === 'function') {
    watch(id, fetchAndUpdate)
  }

  return { product }
}
```

Or use a helper:

```ts
import { isRef, ref, toValue, onMounted, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

function isWatchable<T>(value: MaybeRefOrGetter<T>): value is Ref<T> | ComputedRef<T> | (() => T) {
  return isRef(value) || typeof value === 'function'
}

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref<Product | null>(null)

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

There is a shorter way to get the same result: watch a getter that calls `toValue()`. It works for all three input types — a static value simply never changes, so the watcher never fires again — and needs no type guard. Adding `immediate: true` does the initial fetch, and [`onWatcherCleanup`](https://vuejs.org/api/reactivity-core.html#onwatchercleanup) (Vue 3.5+) drops a response that arrives after `id` has already changed again (see [Race Condition Handling](../async-and-data-fetching/race-condition-handling.md)):

```ts
import { ref, toValue, watch, onWatcherCleanup } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>) {
  const product = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<unknown>(null)

  watch(
    () => toValue(id),
    async (currentId) => {
      let cancelled = false
      onWatcherCleanup(() => (cancelled = true))

      loading.value = true
      error.value = null
      try {
        const result = await fetchProduct(currentId)
        if (!cancelled) product.value = result
      } catch (e) {
        if (!cancelled) error.value = e
      } finally {
        if (!cancelled) loading.value = false
      }
    },
    { immediate: true },
  )

  return { product, loading, error }
}
```

Unlike the `onMounted` versions above, `immediate: true` also starts the fetch during server-side rendering, without waiting for it. In Nuxt, use `useAsyncData` / `useFetch` for data the server should render.

## Usage Examples

All of these now work:

```vue
<script setup lang="ts">
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
// (params are strings, so convert to match the number type)
const product4 = useProduct(() => Number(route.params.id))

// ✅ Computed ref
const product5 = useProduct(computed(() => props.productId))
</script>
```

## Notes

**Pre-Vue 3.3:**
Both `MaybeRefOrGetter` and `toValue()` arrived in Vue 3.3. On older versions, define them yourself (or use the ones from VueUse):

```ts
import { unref } from 'vue'
import type { Ref } from 'vue'

type MaybeRef<T> = Ref<T> | T
type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)

function toValue<T>(source: MaybeRefOrGetter<T>): T {
  return typeof source === 'function' ? (source as () => T)() : unref(source)
}
```

**Why Getters?**
Getters let consumers extract reactive properties without the `toRef()` / `computed()` ceremony. It's the difference between:

```ts
// ❌ Verbose
useProduct(toRef(props, 'id'))

// ✅ Clean
useProduct(() => props.id)
```

**When to Watch:**
Only watch if the value can change. `isRef()` checks for refs, `typeof === 'function'` checks for getters. Raw values are static and don't need watching — or watch `() => toValue(id)` and let the static case be a no-op, as in the full example.

**VueUse Standard:**
Most VueUse composables accept `MaybeRefOrGetter` arguments, which is a good sign the pattern scales.

**watch() Accepts Getters:**
Vue's `watch()` natively accepts getter functions as the source, so `watch(id, ...)` works whether `id` is a ref or a getter. This makes the implementation clean.

This pattern eliminates the "repacking refs" problem and makes composables feel natural to use with props, route params, and any other reactive data source.
