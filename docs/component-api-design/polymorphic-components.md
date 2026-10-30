# Polymorphic Components

Lets the consumer decide what HTML element or component a UI component renders as. Very common in component libraries — a `<Button>` that can render as an `<a>`, a `<RouterLink>`, or a `<button>` depending on context.

## When to Use

- When a component needs to render as different elements depending on context
- Avoids building separate `ButtonLink`, `ButtonAnchor` variants

## When Not to Use

- When there are only two fixed variants: two small components (or a `href` prop that switches between `<a>` and `<button>`) are easier to type and read
- When TypeScript checking of element-specific attributes matters: with a free-form `as`, `href` on a `<button>` or `to` on an `<a>` is not caught

## Example

```vue
<!-- BaseButton.vue -->
<script setup lang="ts">
import type { Component } from 'vue'

const { as = 'button' } = defineProps<{ as?: string | Component }>()
</script>

<template>
  <!-- type="button" stops a plain <button> from submitting forms; a consumer's type="submit" still wins -->
  <component :is="as" :type="as === 'button' ? 'button' : undefined">
    <slot />
  </component>
</template>
```

```vue
<!-- All of these work -->
<BaseButton>Click me</BaseButton>                        <!-- renders as <button> -->
<BaseButton as="a" href="/home">Go home</BaseButton>     <!-- renders as <a> -->
<BaseButton :as="RouterLink" to="/home">Go home</BaseButton> <!-- renders as RouterLink -->
```

## Notes

The `<component :is>` directive is the engine here — it accepts both string tag names and component objects. This avoids building separate component variants for every element type.

There is no `v-bind="$attrs"` on purpose: with a single root element, Vue already forwards `href`, `to`, listeners and every other undeclared attribute to it.

**Accessibility**: the consumer picks the element, so they also pick its semantics. `as="a"` needs an `href` to be a link, and rendering as a non-interactive element (`as="div"`) with a click handler is not keyboard accessible. Stick to `button`, `a` and router links.
