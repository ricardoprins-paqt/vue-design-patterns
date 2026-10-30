# Adapter Pattern

When you use a third-party component library, you're making a bet — that PrimeVue, Nuxt UI, or whatever you've chosen today will still be the right choice in two years. The Adapter Pattern protects you from that bet by ensuring your application never directly imports from a component library. Instead, every component goes through a thin wrapper you own.

## When to Use

- When a component library is used extensively throughout a large application
- When you want the ability to swap libraries without touching consumer code
- When you need to normalize different library APIs into a single consistent interface
- Rule of thumb: if a library component appears in more than five places, wrap it

## When Not to Use

- One-off uses or small projects: the indirection costs more than a future migration would
- Complex, deeply configurable components (data tables, editors): an adapter that exposes everything ends up mirroring the library's whole API, so it no longer protects you. Wrap the few configurations your app actually uses instead
- When you need consumers to reach every native attribute and event, a [Transparent Wrapper](transparent-wrapper-components.md) is the better fit

## The Problem

Without this pattern, your codebase ends up with direct imports scattered across dozens of files:

```vue
<script setup lang="ts">
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
</script>
```

When you decide to swap PrimeVue for something else, you need to find and update every single one of those imports — and reconcile potentially different prop APIs in each location.

## Example

Create a wrapper component that re-exports the third-party component through your own API:

```vue
<!-- components/ui/AppButton.vue -->
<script setup lang="ts">
import Button from 'primevue/button'

const { variant = 'primary' } = defineProps<{
  label: string
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ click: [event: MouseEvent] }>()
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
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
</script>

<template>
  <AppButton label="Save" variant="primary" :loading="isSaving" @click="save" />
</template>
```

When you need to replace PrimeVue with Nuxt UI, the change is contained to a single file:

```vue
<!-- components/ui/AppButton.vue -->
<script setup lang="ts">
// Swap the import — your app doesn't know or care
import { UButton } from '#components'

const { variant = 'primary' } = defineProps<{
  label: string
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <UButton
    :label="label"
    :loading="loading"
    :disabled="disabled"
    :class="`btn-${variant}`"
    @click="emit('click', $event)"
  />
</template>
```

Every component in your application continues to work without changes.

### Normalizing APIs

The Adapter Pattern also lets you normalize inconsistencies between how different libraries name the same concept. PrimeVue might use `severity`, Nuxt UI might use `variant`, your design system calls it `tone`. Your wrapper picks one name and maps it:

```vue
<script setup lang="ts">
import { Button } from 'some-library'

type Tone = 'primary' | 'secondary' | 'danger'

const { tone = 'primary' } = defineProps<{ tone?: Tone }>()

// Map your API to the library's API. The Record type makes
// TypeScript complain if a tone is added without a mapping.
const variantMap: Record<Tone, string> = {
  primary: 'solid',
  secondary: 'outline',
  danger: 'destructive'
}
</script>

<template>
  <Button :variant="variantMap[tone]" />
</template>
```

## Notes

The [Transparent Wrapper Component](transparent-wrapper-components.md) pattern forwards all attributes and slots through to a single root element without filtering them. The Adapter Pattern is intentionally *not* transparent — it defines a deliberate API surface, hides the underlying implementation, and only exposes what your application needs. You're trading flexibility for stability and replaceability.

Vue still forwards undeclared attributes (`class`, `id`, listeners) to the library component's root by default. That is usually what you want for layout classes, but it is also a way for library-specific props to leak past your API. If the adapter must stay strict, add `defineOptions({ inheritAttrs: false })` and route only what you allow (see [Attribute Routing](attribute-routing.md)).
