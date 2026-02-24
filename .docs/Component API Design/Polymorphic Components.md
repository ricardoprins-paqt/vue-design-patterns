# Polymorphic Components

Lets the consumer decide what HTML element or component a UI component renders as. Very common in component libraries — a `<Button>` that can render as an `<a>`, a `<RouterLink>`, or a `<button>` depending on context.

## When to Use

- When a component needs to render as different elements depending on context
- Avoids building separate `ButtonLink`, `ButtonAnchor` variants

## Example

```vue
<script setup>
const props = defineProps({
  as: { type: [String, Object], default: 'button' }
})
</script>

<template>
  <component :is="props.as" v-bind="$attrs">
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
