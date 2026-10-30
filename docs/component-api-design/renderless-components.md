# Renderless Components

A component that owns all the behavior but renders nothing itself — it exposes everything through a scoped slot so the parent decides how it looks.

## When to Use

- When you need the consumer to control the exact DOM structure that the logic operates on
- When building headless UI libraries (like Headless UI)
- When the same logic needs completely different visual representations

## Example

```vue
<!-- Toggle.vue - renderless component -->
<script setup lang="ts">
import { ref, useId } from 'vue'

const { initial = false } = defineProps<{ initial?: boolean }>()

const isOpen = ref(initial)
const contentId = useId()

const toggle = () => { isOpen.value = !isOpen.value }
const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false }

defineSlots<{
  default(props: {
    isOpen: boolean
    toggle: () => void
    open: () => void
    close: () => void
    triggerAttrs: { 'aria-expanded': boolean; 'aria-controls': string }
    contentAttrs: { id: string }
  }): unknown
}>()
</script>

<template>
  <slot
    :is-open="isOpen"
    :toggle="toggle"
    :open="open"
    :close="close"
    :trigger-attrs="{ 'aria-expanded': isOpen, 'aria-controls': contentId }"
    :content-attrs="{ id: contentId }"
  />
</template>
```

```vue
<!-- Consumer decides how it looks, gets all the logic for free -->
<Toggle v-slot="{ isOpen, toggle, triggerAttrs, contentAttrs }">
  <button v-bind="triggerAttrs" @click="toggle">{{ isOpen ? 'Hide' : 'Show' }}</button>
  <div v-if="isOpen" v-bind="contentAttrs">Content here</div>
</Toggle>
```

The same `Toggle` component can be used with a checkbox, a button, an icon — anything — without changing the logic. `defineSlots` gives the consumer type-checked slot props.

The `triggerAttrs` and `contentAttrs` bundles are what make this more than a composable: the component hands out the attributes that wire the consumer's DOM together (here `aria-expanded` and `aria-controls`), so every consumer gets the accessibility right without knowing the details. Headless libraries such as Reka UI work the same way.

## Notes

Nowadays composables are generally preferred over renderless components for pure logic reuse, because renderless components create an extra component instance with overhead. If you only need `isOpen` and `toggle`, write a `useToggle()` composable (or use VueUse's `useToggle`) instead. The renderless pattern still wins when the logic is inherently tied to slot content — when you need the consumer to control the exact DOM structure that the logic operates on.
