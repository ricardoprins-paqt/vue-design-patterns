# Renderless Components

A component that owns all the behavior but renders nothing itself — it exposes everything through a scoped slot so the parent decides how it looks.

## When to Use

- When you need the consumer to control the exact DOM structure that the logic operates on
- When building headless UI libraries (like Headless UI)
- When the same logic needs completely different visual representations

## Example

```vue
<!-- Toggle.vue - renderless component -->
<script setup>
import { ref } from 'vue'

const props = defineProps({ initial: { type: Boolean, default: false } })
const isOpen = ref(props.initial)
const toggle = () => isOpen.value = !isOpen.value
const open = () => isOpen.value = true
const close = () => isOpen.value = false
</script>

<template>
  <slot :isOpen="isOpen" :toggle="toggle" :open="open" :close="close" />
</template>
```

```vue
<!-- Consumer decides how it looks, gets all the logic for free -->
<Toggle :initial="false" v-slot="{ isOpen, toggle }">
  <button @click="toggle">{{ isOpen ? 'Hide' : 'Show' }}</button>
  <div v-if="isOpen">Content here</div>
</Toggle>
```

The same `Toggle` component can be used with a checkbox, a button, an icon — anything — without changing the logic.

## Notes

Nowadays composables are generally preferred over renderless components for pure logic reuse, because renderless components create an extra component instance with overhead. The renderless pattern still wins when the logic is inherently tied to slot content — when you need the consumer to control the exact DOM structure that the logic operates on.
