# Writing a Vue Plugin

A plugin is just an object with an `install` method. But a well-designed plugin composes several things together — directives, global components, provided state, and TypeScript augmentation — into a single `app.use()` call.

## When to Use

- Cross-cutting concerns that many parts of your app need (notifications, toasts, analytics)
- When you want a single `app.use()` to wire up everything
- When you need to support both Composition API and Options API consumers

## Example — Notification Plugin

### Types and TypeScript Augmentation

```ts
// plugins/notifications/types.ts
export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface NotificationService {
  add: (notification: Omit<Notification, 'id'>) => void
  remove: (id: string) => void
  notifications: Readonly<Ref<Notification[]>>
}

// Augment Vue's type system so $notify is typed everywhere
declare module 'vue' {
  interface ComponentCustomProperties {
    $notify: (message: string, type: Notification['type']) => void
  }
}
```

### Singleton State

```ts
// plugins/notifications/state.ts
const notifications = ref<Notification[]>([])

export function createNotificationService(): NotificationService {
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
import type { App } from 'vue'
import NotificationContainer from './NotificationContainer.vue'

export const NotificationPlugin = {
  install(app: App) {
    // Create the service
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
    app.directive('notify-on-click', {
      mounted(el, binding) {
        el.addEventListener('click', () => {
          service.add({ message: binding.value, type: 'info' })
        })
      },
      unmounted(el) {
        // cleanup
      }
    })
  }
}
```

### The Consumer API

```ts
// composables/useNotifications.ts
export function useNotifications() {
  const service = inject(NotificationKey)
  if (!service) throw new Error('NotificationPlugin not installed')
  return service
}
```

### Three Ways to Use It

```js
// Composition API — idiomatic
const { add } = useNotifications()
add({ message: 'Saved!', type: 'success' })

// Options API — legacy support
this.$notify('Saved!', 'success')

// Declarative — dead simple
<button v-notify-on-click="'Item added to cart'">Add to cart</button>
```

## Notes

The plugin is self-contained, typed end to end, and works with any usage style. The key architectural decision is that the state (`notifications`) lives at module level as a [[Singleton Composable|singleton]] — this means it survives across component trees and is accessible even outside of components.
