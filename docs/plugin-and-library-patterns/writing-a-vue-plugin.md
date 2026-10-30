# Writing a Vue Plugin

A plugin is just an object with an `install` method. But a well-designed plugin composes several things together — directives, global components, provided state, and TypeScript augmentation — into a single `app.use()` call.

## When to Use

- Cross-cutting concerns that many parts of your app need (notifications, toasts, analytics)
- When you want a single `app.use()` to wire up everything
- When you need to support both Composition API and Options API consumers

## When Not to Use

- When only `<script setup>` components consume it. A composable plus [Typed Provide Inject](../state-sharing/typed-provide-inject.md) (or a Pinia store) gives the same result without global registration.
- Global components, directives and `$properties` are invisible in the importing file and harder to tree-shake. Register globally only what is used almost everywhere.

## Example — Notification Plugin

### Types and TypeScript Augmentation

```ts
// plugins/notifications/types.ts
import type { Ref } from 'vue'
import type NotificationContainer from './NotificationContainer.vue'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface NotificationService {
  add: (notification: Omit<Notification, 'id'>) => void
  remove: (id: string) => void
  notifications: Readonly<Ref<readonly Notification[]>>
}

// Augment Vue's type system so $notify and <NotificationContainer> are typed everywhere
declare module 'vue' {
  interface ComponentCustomProperties {
    $notify: (message: string, type: Notification['type']) => void
  }
  interface GlobalComponents {
    NotificationContainer: typeof NotificationContainer
  }
}
```

### The Service

```ts
// plugins/notifications/service.ts
import { readonly, ref } from 'vue'
import type { Notification, NotificationService } from './types'

export function createNotificationService(): NotificationService {
  // Created per call, so every app (and every SSR request, every test) gets its own list
  const notifications = ref<Notification[]>([])

  function add(notification: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID()
    notifications.value.push({ ...notification, id })

    if (notification.duration !== 0) {
      setTimeout(() => remove(id), notification.duration ?? 3000)
    }
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { add, remove, notifications: readonly(notifications) }
}
```

### The Plugin Install

```ts
// plugins/notifications/index.ts
import type { App, InjectionKey, Plugin } from 'vue'
import type { NotificationService } from './types'
import { createNotificationService } from './service'
import NotificationContainer from './NotificationContainer.vue'

export const NotificationKey: InjectionKey<NotificationService> = Symbol('NotificationService')

type NotifyOnClickElement = HTMLElement & {
  _notify?: { message: string; handler: () => void }
}

export const NotificationPlugin: Plugin = {
  install(app: App) {
    // One service per app
    const service = createNotificationService()

    // Provide it for composable access anywhere in the tree
    app.provide(NotificationKey, service)

    // Attach shorthand to globalProperties for Options API
    app.config.globalProperties.$notify = (message, type) => {
      service.add({ message, type })
    }

    // Register the display component globally
    app.component('NotificationContainer', NotificationContainer)

    // Register a directive for declarative notifications
    app.directive<NotifyOnClickElement, string>('notify-on-click', {
      mounted(el, binding) {
        const handler = () => service.add({ message: el._notify!.message, type: 'info' })
        el._notify = { message: binding.value, handler }
        el.addEventListener('click', handler)
      },
      updated(el, binding) {
        // Keep the message current when the bound value changes
        if (el._notify) el._notify.message = binding.value
      },
      unmounted(el) {
        if (el._notify) el.removeEventListener('click', el._notify.handler)
        delete el._notify
      }
    })
  }
}
```

```ts
// main.ts
app.use(NotificationPlugin)
```

### The Consumer API

```ts
// composables/useNotifications.ts
import { inject } from 'vue'
import { NotificationKey } from '@/plugins/notifications'

export function useNotifications() {
  const service = inject(NotificationKey)
  if (!service) throw new Error('NotificationPlugin not installed')
  return service
}
```

### The Display Component

```vue
<!-- plugins/notifications/NotificationContainer.vue -->
<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'

const { notifications, remove } = useNotifications()
</script>

<template>
  <Teleport to="body">
    <!-- A live region: screen readers announce notifications as they are added -->
    <ul class="notifications" role="status" aria-live="polite">
      <li v-for="n in notifications" :key="n.id" :class="`notification--${n.type}`">
        {{ n.message }}
        <button type="button" aria-label="Dismiss" @click="remove(n.id)">×</button>
      </li>
    </ul>
  </Teleport>
</template>
```

Place `<NotificationContainer />` once, in `App.vue`.

### Three Ways to Use It

```ts
// Composition API — idiomatic
const { add } = useNotifications()
add({ message: 'Saved!', type: 'success' })

// Options API — legacy support
this.$notify('Saved!', 'success')
```

```vue
<!-- Declarative — dead simple -->
<button v-notify-on-click="'Item added to cart'">Add to cart</button>
```

## Notes

The plugin is self-contained, typed end to end, and works with any usage style. The key architectural decision is that the state (`notifications`) is created inside `install`, once per app. Every component of that app shares it, but two apps never do: not two test cases, and not two SSR requests in Nuxt (each request creates its own app). A module-level [singleton](../state-sharing/singleton-composable.md) would leak notifications between them.

Outside components (a router guard, an API client), reach the same service through the app, for example `app.runWithContext(() => inject(NotificationKey))`, instead of importing module state.
