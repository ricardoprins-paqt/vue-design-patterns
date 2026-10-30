# The Modal/Notification System Pattern

Combines `Teleport`, the native `<dialog>` element, the [singleton store pattern](../state-sharing/singleton-composable.md) and [controller components](../architectural-patterns/controller-components.md) into a complete system. Almost every app needs this and most implementations are messier than they need to be.

## The Problem

Naive modal implementations have the modal state live in the component that triggers it. This means it gets torn down when that component unmounts, and the modal has to live in the DOM near its trigger rather than at the body level.

## Solution

### The Modal Store

```ts
// composables/useModalStore.ts
import { markRaw, readonly, ref, type Component } from 'vue'

interface ModalConfig {
  id: string
  component: Component
  props?: Record<string, unknown>
  onClose: (result?: unknown) => void
}

const modals = ref<ModalConfig[]>([])

export function useModalStore() {
  function open<TResult = unknown>(
    component: Component,
    props?: Record<string, unknown>
  ): Promise<TResult | undefined> {
    return new Promise((resolve) => {
      modals.value.push({
        id: crypto.randomUUID(),
        component: markRaw(component), // markRaw — don't proxy the component
        props,
        onClose: (result) => resolve(result as TResult | undefined)
      })
    })
  }

  function close(id: string, result?: unknown) {
    const modal = modals.value.find((m) => m.id === id)
    modal?.onClose(result)
    modals.value = modals.value.filter((m) => m.id !== id)
  }

  return { modals: readonly(modals), open, close }
}
```

### The Modal Controller

```vue
<!-- ModalController.vue — placed once at app root -->
<script setup lang="ts">
import { useModalStore } from '@/composables/useModalStore'

const { modals, close } = useModalStore()
</script>

<template>
  <Teleport to="body">
    <component
      :is="modal.component"
      v-for="modal in modals"
      :key="modal.id"
      v-bind="modal.props"
      @close="(result?: unknown) => close(modal.id, result)"
    />
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

```ts
const { open } = useModalStore()

// Open a modal and wait for the user's decision
const confirmed = await open<boolean>(ConfirmDialog, {
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
<script setup lang="ts">
import { onMounted, useId, useTemplateRef } from 'vue'

defineProps<{ title: string; message: string }>()
const emit = defineEmits<{ close: [confirmed: boolean] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

// showModal() gives focus trapping, Escape to cancel, an inert page and ::backdrop for free
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    @cancel.prevent="emit('close', false)"
  >
    <h2 :id="titleId">{{ title }}</h2>
    <p>{{ message }}</p>
    <button type="button" @click="emit('close', false)">Cancel</button>
    <button type="button" @click="emit('close', true)">Confirm</button>
  </dialog>
</template>
```

## Notes

- The **Promise-based API** is the elegant part — opening a modal feels like an async function call. You await the user's decision rather than setting up event listeners or callbacks.
- **`markRaw`** on the component object is important — without it Vue would try to make the component definition itself reactive, which is wasteful and can cause issues.
- **Native `<dialog>` with `showModal()`** handles the accessibility work a hand-built `<div class="modal">` has to do itself: it moves focus into the dialog and keeps it there, closes on Escape (the `cancel` event, turned into `close(false)` here), makes the rest of the page inert and renders a `::backdrop`. It also renders in the browser's top layer, so z-index and `overflow: hidden` on ancestors no longer matter.
- **`Teleport`** still keeps the modal DOM at body level, out of the trigger's component tree, which keeps styling and DOM inspection predictable.
- **Typing**: `props` is a loose `Record<string, unknown>`, so a typo in a prop name is not caught. Typing it per component (props inferred from `component`) needs a helper such as `ComponentProps` from `vue-component-type-helpers`; worth it in a larger app.
- **SSR**: the `modals` list is module-level state, which the server shares between requests; see the SSR warning on [Singleton Composable](../state-sharing/singleton-composable.md). Modals usually open only after a user action in the browser, so the server-side list stays empty. If anything can open a modal during server rendering, keep the list per app instead (for example with Nuxt's `useState`).
