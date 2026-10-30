# Humble Components

A Humble Component does one thing: render UI and emit user intent. It has no business logic, no data fetching, no awareness of the outside world. It only knows about its props, what to emit, and at most some local UI state of its own (is this dropdown open, which tab is active).

## When to Use

- For presentation-level components: buttons, cards, list rows, form inputs
- When you want components that are trivially testable and completely reusable
- As the "View" layer in [The MVC Triad](the-mvc-triad.md)

## When Not to Use

- Small, one-off components where splitting into a "smart" and a "humble" part only adds a file and a layer of props. A component that fetches its own data and renders it in twenty lines is fine.
- Don't push UI-only state (open/closed, hover, active tab) up to a controller just to keep a component "humble". That state belongs where it is rendered.

## Example

```vue
<!-- HumbleButton.vue — knows nothing, does nothing except render and emit -->
<script setup lang="ts">
const { label, disabled = false } = defineProps<{ label: string; disabled?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" :disabled="disabled" @click="$emit('click')">
    {{ label }}
  </button>
</template>
```

Two-way bound inputs are humble too. `defineModel` gives them a `v-model` without any knowledge of where the value lives:

```vue
<!-- DiscountInput.vue -->
<script setup lang="ts">
const code = defineModel<string>({ required: true })
</script>

<template>
  <label>
    Discount code
    <input v-model.trim="code" />
  </label>
</template>
```

## Notes

The key idea is **props down, events up** taken to its logical extreme. The component doesn't decide what happens when clicked — it just announces that a click happened and lets whoever owns the state decide what to do.

The benefit is that humble components are trivially testable and completely reusable because they have no side effects or dependencies. You can render them with any props and they always behave predictably.

Humble does not mean careless: accessibility (labels, roles, keyboard handling) is presentation, so it belongs here, not in the controller.

See also: [Controller Components](controller-components.md) and [Thin Composables](thin-composables.md) for the other layers in the triad.
