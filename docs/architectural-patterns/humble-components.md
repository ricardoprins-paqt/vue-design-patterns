# Humble Components

A Humble Component does one thing: render UI and emit user intent. It has no business logic, no data fetching, no awareness of the outside world. It only knows about its props and what to emit.

## When to Use

- For any presentation-level component
- When you want components that are trivially testable and completely reusable
- As the "View" layer in [The MVC Triad](the-mvc-triad.md)

## Example

```vue
<!-- HumbleButton.vue — knows nothing, does nothing except render and emit -->
<script setup>
defineProps<{ label: string; disabled: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button :disabled="disabled" @click="$emit('click')">
    {{ label }}
  </button>
</template>
```

## Notes

The key idea is **props down, events up** taken to its logical extreme. The component doesn't decide what happens when clicked — it just announces that a click happened and lets whoever owns the state decide what to do.

The benefit is that humble components are trivially testable and completely reusable because they have no side effects or dependencies. You can render them with any props and they always behave predictably.

See also: [Controller Components](controller-components.md) and [Thin Composables](thin-composables.md) for the other layers in the triad.
