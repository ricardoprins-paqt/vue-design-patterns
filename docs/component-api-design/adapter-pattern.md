# Adapter Pattern

When you use a third-party component library, you're making a bet — that PrimeVue, Nuxt UI, or whatever you've chosen today will still be the right choice in two years. The Adapter Pattern protects you from that bet by ensuring your application never directly imports from a component library. Instead, every component goes through a thin wrapper you own.

## When to Use

- When a component library is used extensively throughout a large application
- When you want the ability to swap libraries without touching consumer code
- When you need to normalize different library APIs into a single consistent interface
- Rule of thumb: if a library component appears in more than five places, wrap it

## The Problem

Without this pattern, your codebase ends up with direct imports scattered across dozens of files:

```vue
<script setup>
import { Button } from 'primevue/button'
import { DataTable } from 'primevue/datatable'
</script>
```

When you decide to swap PrimeVue for something else, you need to find and update every single one of those imports — and reconcile potentially different prop APIs in each location.

## Example

Create a wrapper component that re-exports the third-party component through your own API:

```vue
<!-- components/ui/AppButton.vue -->
<script setup>
import Button from 'primevue/button'

defineProps({
  label: String,
  variant: {
    type: String,
    default: 'primary'
  },
  loading: Boolean,
  disabled: Boolean,
})

const emit = defineEmits(['click'])
</script>

<template>
  <Button
    :label="label"
    :loading="loading"
    :disabled="disabled"
    :class="`btn-${variant}`"
    @click="emit('click', $event)"
  />
</template>
```

Your application then only ever imports from your own components:

```vue
<script setup>
import AppButton from '@/components/ui/AppButton.vue'
</script>

<template>
  <AppButton label="Save" variant="primary" :loading="isSaving" @click="save" />
</template>
```

When you need to replace PrimeVue with Nuxt UI, the change is contained to a single file:

```vue
<!-- components/ui/AppButton.vue -->
<script setup>
// Swap the import — your app doesn't know or care
import { UButton } from '#components'

defineProps({
  label: String,
  variant: {
    type: String,
    default: 'primary'
  },
  loading: Boolean,
  disabled: Boolean,
})

const emit = defineEmits(['click'])
</script>

<template>
  <UButton v-bind="{ disabled, loading }" @click="emit('click', $event)">
    {{ label }}
  </UButton>
</template>
```

Every component in your application continues to work without changes.

### Normalizing APIs

The Adapter Pattern also lets you normalize inconsistencies between how different libraries name the same concept. PrimeVue might use `severity`, Nuxt UI might use `variant`, your design system calls it `tone`. Your wrapper picks one name and maps it:

```vue
<script setup>
import { Button } from 'some-library'

const props = defineProps({
  tone: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger'].includes(v)
  }
})

// Map your API to the library's API
const variantMap = {
  primary: 'solid',
  secondary: 'outline',
  danger: 'destructive'
}
</script>

<template>
  <Button :variant="variantMap[props.tone]" />
</template>
```

## Notes

The [Transparent Wrapper Component](transparent-wrapper-components.md) pattern forwards all attributes and slots through to a single root element without filtering them. The Adapter Pattern is intentionally *not* transparent — it defines a deliberate API surface, hides the underlying implementation, and only exposes what your application needs. You're trading flexibility for stability and replaceability.

For one-off uses or small projects, the indirection may not be worth it.
