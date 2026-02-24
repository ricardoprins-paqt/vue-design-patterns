# Attribute Routing

When a component has multiple root elements or needs fine-grained control over where attributes land, disable automatic attribute fallthrough and manually route attributes to the correct elements. Combines `inheritAttrs: false` + `useAttrs()` + manual `v-bind`.

## When to Use

- Components with multiple root elements (fragments)
- Wrapper components where attributes should go to a nested input/element, not the root
- When you need to split attributes between different elements
- Form components where `placeholder`, `type`, etc. must go to the input, not a wrapper div
- Library components that need precise control over their public API

## The Problem

By default, Vue applies non-declared attributes to the component's root element. This breaks when:

```vue
<!-- InputGroup.vue -->
<template>
  <div class="input-group">
    <input />
    <button>Submit</button>
  </div>
</template>
```

```vue
<!-- Consumer tries to pass input attributes -->
<InputGroup placeholder="Enter name" @change="handleChange" />
```

The `placeholder` and `@change` fall through to the `<div>`, not the `<input>`. They're wasted.

## Solution

### Basic Routing

```vue
<!-- InputGroup.vue -->
<script setup>
import { useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false // Disable automatic fallthrough
})

const attrs = useAttrs()
</script>

<template>
  <div class="input-group">
    <!-- Manually apply attrs to the input -->
    <input v-bind="attrs" />
    <button>Submit</button>
  </div>
</template>
```

Now `placeholder` and `@change` correctly apply to the input.

### Split Routing

Route different attributes to different elements:

```vue
<script setup>
import { useAttrs, computed } from 'vue'

defineOptions({
  inheritAttrs: false
})

const attrs = useAttrs()

// Split attrs into input-specific and wrapper-specific
const inputAttrs = computed(() => {
  const { class: _, style: __, ...rest } = attrs
  return rest
})

const wrapperAttrs = computed(() => {
  const { class: className, style } = attrs
  return { class: className, style }
})
</script>

<template>
  <div v-bind="wrapperAttrs" class="input-group">
    <input v-bind="inputAttrs" />
    <button>Submit</button>
  </div>
</template>
```

Now `class` and `style` go to the wrapper, everything else goes to the input.

### Safe Attribute Filtering

Only allow specific attributes to pass through:

```vue
<script setup>
import { useAttrs, computed } from 'vue'

defineOptions({
  inheritAttrs: false
})

const attrs = useAttrs()

// Allowlist: only these can fall through
const safeAttrs = computed(() => {
  const { class: className, style, 'data-test-id': testId } = attrs
  return { class: className, style, 'data-test-id': testId }
})
</script>

<template>
  <button v-bind="safeAttrs" type="button">
    <slot />
  </button>
</template>
```

This prevents consumers from accidentally overriding your `type="button"` by passing `type="submit"`.

### Template-Only Routing with `$attrs`

For simple cases, use `$attrs` directly in the template:

```vue
<script setup>
defineOptions({
  inheritAttrs: false
})
</script>

<template>
  <div class="form-field">
    <label>Name</label>
    <!-- Route all attrs to the input -->
    <input v-bind="$attrs" />
  </div>
</template>
```

No need for `useAttrs()` in the script if you're just forwarding everything.

### Multiple Root Elements

When you have multiple root elements, Vue can't guess where attributes should go:

```vue
<script setup>
defineOptions({
  inheritAttrs: false
})
</script>

<template>
  <label>{{ label }}</label>
  <input v-bind="$attrs" />
  <span class="hint">{{ hint }}</span>
</template>
```

Without `inheritAttrs: false`, Vue emits a warning. With it, you explicitly route attrs to the input.

## Notes

**Safe Fallthrough Candidates:**
- `class` and `style` — usually safe, they merge
- `data-*` attributes — for testing, tracking, etc.
- `aria-*` attributes — accessibility
- `margin`, `transform`, `opacity`, `z-index` — layout that doesn't break design

**Unsafe Fallthrough:**
- `width`, `height`, `padding` — can break component internals
- `type`, `name`, `value` — can override component logic
- Event listeners on the wrong element — just don't work

**Best Practice:**
Most components should allow `class` and `style` to fall through for layout flexibility. Everything else should be explicitly controlled via props or routed via this pattern.

**Template vs Script:**
- Use `$attrs` in the template for simple forwarding
- Use `useAttrs()` in the script when you need to split, filter, or compute attributes

**Merging Behavior:**
- `class` and `style` merge with existing values
- All other attributes override
- Event listeners are additive (both parent and child handlers fire)

This pattern is essential for building library-quality components where the public API must be rock solid and attributes must land exactly where intended.
