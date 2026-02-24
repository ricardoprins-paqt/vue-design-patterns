# The Modal/Notification System Pattern

Combines `Teleport`, the [[Singleton Composable|singleton store pattern]], [[Controller Components|controller components]], and [[Custom Directives|custom directives]] into a complete system. Almost every app needs this and most implementations are messier than they need to be.

## The Problem

Naive modal implementations have the modal state live in the component that triggers it. This means it gets torn down when that component unmounts, and the modal has to live in the DOM near its trigger rather than at the body level.

## Solution

### The Modal Store

```ts
// composables/useModalStore.ts
interface ModalConfig {
  id: string
  component: Component
  props?: Record<string, any>
  onClose?: (result?: any) => void
}

const modals = ref<ModalConfig[]>([])

export function useModalStore() {
  function open(component: Component, props?: Record<string, any>): Promise<any> {
    return new Promise((resolve) => {
      const id = crypto.randomUUID()
      modals.value.push({
        id,
        component: markRaw(component), // markRaw — don't proxy the component
        props,
        onClose: resolve
      })
    })
  }

  function close(id: string, result?: any) {
    const modal = modals.value.find(m => m.id === id)
    modal?.onClose?.(result)
    modals.value = modals.value.filter(m => m.id !== id)
  }

  return { modals: readonly(modals), open, close }
}
```

### The Modal Controller

```vue
<!-- ModalController.vue — placed once at app root -->
<script setup>
const { modals, close } = useModalStore()
</script>

<template>
  <Teleport to="body">
    <template v-for="modal in modals" :key="modal.id">
      <!-- Backdrop -->
      <div class="backdrop" @click="close(modal.id)" />

      <!-- Dynamic modal content -->
      <component
        :is="modal.component"
        v-bind="modal.props"
        @close="(result) => close(modal.id, result)"
      />
    </template>
  </Teleport>
</template>
```

```vue
<!-- App.vue -->
<template>
  <RouterView />
  <ModalController />  <!-- once, at root -->
</template>
```

### Using It — Promise-Based API

Any component anywhere in the app can open a modal and await its result:

```js
const { open } = useModalStore()

// Open a modal and wait for the user's decision
const confirmed = await open(ConfirmDialog, {
  title: 'Delete item?',
  message: 'This cannot be undone.'
})

if (confirmed) {
  await deleteItem(itemId)
}
```

### The Modal Component

```vue
<!-- ConfirmDialog.vue -->
<script setup>
defineProps<{ title: string; message: string }>()
const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <div class="modal">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button @click="emit('close', false)">Cancel</button>
    <button @click="emit('close', true)">Confirm</button>
  </div>
</template>
```

## Notes

- The **Promise-based API** is the elegant part — opening a modal feels like an async function call. You await the user's decision rather than setting up event listeners or callbacks.
- **`markRaw`** on the component object is important — without it Vue would try to make the component definition itself reactive, which is wasteful and can cause issues.
- **`Teleport`** ensures modals always render at the body level regardless of where they were triggered, preventing z-index and overflow clipping issues.
