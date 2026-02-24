# Reactive Props Destructuring (Pre-Vue 3.5)

A workaround pattern for destructuring props while maintaining reactivity in Vue 3.3 and 3.4. Uses `toRefs()` to convert all props into individual reactive refs. In Vue 3.5+, props can be destructured natively with reactivity preserved.

## When to Use

- Vue 3.3 or 3.4 codebases (pre-3.5)
- When you prefer destructuring syntax over `props.x` everywhere
- When passing props to composables that expect refs
- To avoid repetitive `toRef(props, 'key')` calls

## The Problem (Pre-Vue 3.5)

Destructuring props loses reactivity:

```vue
<script setup>
const props = defineProps<{
  count: number
  message: string
}>()

// ❌ These are not reactive!
const { count, message } = props

watch(count, () => {
  // Never fires — count is a static value
})
</script>

<template>
  <!-- ❌ Won't update when prop changes -->
  <div>{{ count }}</div>
</template>
```

The workaround was verbose:

```vue
<script setup>
const props = defineProps<{
  userId: number
}>()

// ✅ Verbose but works
const userId = toRef(props, 'userId')
// or
const userId = computed(() => props.userId)

useUser(userId) // Composable can watch it
</script>
```

## Solution (Pre-Vue 3.5)

Use `toRefs()` to convert the entire props object into individual refs:

```vue
<script setup>
import { toRefs } from 'vue'

const props = defineProps<{
  count: number
  message: string
}>()

// ✅ Each property is now a reactive ref
const { count, message } = toRefs(props)

// Works correctly
watch(count, (newCount) => {
  console.log('Count changed:', newCount)
})
</script>

<template>
  <!-- ✅ Updates when prop changes -->
  <div>{{ count }}</div>
</template>
```

### Passing to Composables

```vue
<script setup>
import { toRefs } from 'vue'

const props = defineProps<{
  userId: number
  filter: string
}>()

const { userId, filter } = toRefs(props)

// ✅ Composables receive reactive refs
const { user, loading } = useUser(userId)
const { results } = useSearch(filter)
</script>
```

### Partial Destructuring

Only convert what you need:

```vue
<script setup>
import { toRef } from 'vue'

const props = defineProps<{
  userId: number
  theme: string
  debug: boolean
}>()

// Only need userId as a ref
const userId = toRef(props, 'userId')

// Access the rest normally
console.log(props.theme, props.debug)
</script>
```

## Vue 3.5+ Native Solution

In Vue 3.5+, props destructuring is reactive by default:

```vue
<script setup>
// ✅ Vue 3.5+: Reactive destructuring built-in
const { count = 0, message = 'hello' } = defineProps<{
  count?: number
  message?: string
}>()

// Automatically reactive in template and watch!
watch(count, () => {
  console.log('Changed:', count)
})

// Pass to composables (wrap in getter — the compiler
// doesn't transform inside composable function bodies)
const { data } = useFetch(() => `/api/users/${count}`)
</script>
```

**Important Vue 3.5+ Caveat:**
The compiler auto-wraps destructured props for `watch` in `<script setup>`, but composables receive the raw value — they run outside the compiler's scope:

```js
// ✅ Works — compiler wraps it for you in <script setup>
watch(count, () => { /* ... */ })

// ✅ Composables need an explicit getter
useFetch(() => `/api/items/${count}`)
```

## Notes

**toRefs() Behavior:**
- Creates a ref for **every** prop
- Refs stay in sync with the original props object
- Safe to destructure and pass around
- Small overhead from ref wrapping

**When to Use This Pattern:**
- **Vue 3.3/3.4**: Use `toRefs()` or `toRef()`
- **Vue 3.5+**: Use native destructuring

**Default Values:**
Pre-3.5, default values need `withDefaults`:

```ts
// Vue 3.3/3.4
const props = withDefaults(
  defineProps<{ count?: number }>(),
  { count: 0 }
)
const { count } = toRefs(props)

// Vue 3.5+
const { count = 0 } = defineProps<{ count?: number }>()
```

**Performance:**
`toRefs()` creates ref wrappers, but the overhead is negligible unless you have dozens of props. The ergonomics usually outweigh the cost.

**Partial vs Full:**
- Use `toRefs(props)` when destructuring multiple props
- Use `toRef(props, 'key')` for single props
- Access `props.x` directly if you don't need reactivity

**Route Params Example:**

```vue
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Pre-3.5: Use computed — toRefs won't survive navigation
// because route.params is replaced (not mutated) on route change
const id = computed(() => route.params.id)
const { user } = useUser(id)

// Vue 3.5+: Just use a getter
const { user } = useUser(() => route.params.id)
</script>
```

This pattern bridges the gap between Vue 3.3/3.4 and 3.5, but if you're on 3.5+, use the native destructuring feature instead. It's cleaner and built into the compiler.
