# Attribute Routing

When a component has multiple root elements or needs fine-grained control over where attributes land, disable automatic attribute fallthrough and manually route attributes to the correct elements. Combines `inheritAttrs: false` + `useAttrs()` + manual `v-bind`.

## When to Use

- Components with multiple root elements (fragments)
- Wrapper components where attributes should go to a nested input/element, not the root
- When you need to split attributes between different elements
- Form components where `placeholder`, `type`, etc. must go to the input, not a wrapper div
- Library components that need precise control over their public API

## When Not to Use

- Single-root components where attributes already land on the right element: the default fallthrough is simpler and less code to maintain
- App-level components with a fixed set of consumers: declare the props you need instead of forwarding arbitrary attributes
- Allowlists (see below) only pay off for shared library components; elsewhere they mostly cause "why does my `@click` do nothing?" bugs

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
<InputGroup placeholder="Enter name" @blur="validate" />
```

The `placeholder` and `@blur` fall through to the `<div>`, not the `<input>`. They're wasted: a `<div>` has no placeholder, and `blur` doesn't bubble up from the input. (Bubbling events like `change` or `input` would still reach the `<div>` listener, which hides the problem until you use one that doesn't bubble.)

## Solution

### Basic Routing

```vue
<!-- InputGroup.vue -->
<script setup lang="ts">
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

Now `placeholder` and `@blur` correctly apply to the input.

### Split Routing

Route different attributes to different elements:

```vue
<script setup lang="ts">
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

Now `class` and `style` go to the wrapper, everything else (including `aria-*` attributes, which belong on the focusable element) goes to the input.

### Safe Attribute Filtering

Only allow specific attributes to pass through:

```vue
<script setup lang="ts">
import { useAttrs, computed } from 'vue'

defineOptions({
  inheritAttrs: false
})

const attrs = useAttrs()

// Allowlist: only these can fall through. Listeners are attrs too (`onClick`),
// so leave them out and the consumer's @click silently stops working.
const allowed = new Set(['class', 'style', 'data-test-id', 'onClick'])

const safeAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => allowed.has(key)))
)
</script>

<template>
  <button v-bind="safeAttrs" type="button">
    <slot />
  </button>
</template>
```

This prevents consumers from accidentally overriding your `type="button"` by passing `type="submit"`, or adding any other attribute you didn't plan for.

### Template-Only Routing with `$attrs`

For simple cases, use `$attrs` directly in the template:

```vue
<script setup lang="ts">
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
<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
</script>

<template>
  <label>{{ label }}</label>
  <input v-bind="$attrs" />
  <span v-if="hint" class="hint">{{ hint }}</span>
</template>
```

On a multi-root component Vue applies attributes nowhere by itself. It warns about "extraneous non-props attributes" only when you don't bind `$attrs` anywhere ([Vue docs](https://vuejs.org/guide/components/attrs.html#attribute-inheritance-on-multiple-root-nodes)). Binding `$attrs` on the input is enough; `inheritAttrs: false` isn't needed here. Declare `label` and `hint` as props, or they end up in `$attrs` too and get bound onto the `<input>`.

## Notes

**Safe Fallthrough Candidates:**
- `class` and `style` for outer layout (margin, positioning, grid placement) — they merge
- `data-*` attributes — for testing, tracking, etc.
- `aria-*` attributes — accessibility, as long as they land on the element they describe

**Unsafe Fallthrough:**
- `class` and `style` that reach into the component's internals (padding, sizing of inner parts) — they couple the consumer to your markup
- `type`, `name`, `value` — can override component logic
- Event listeners on the wrong element — non-bubbling events like `focus` and `blur` just don't fire

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
