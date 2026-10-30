# KeepAlive with max and Strategic include/exclude

The performance angle on `KeepAlive` that's easy to miss: keeping too many component instances in memory is itself a performance problem. The `max` prop gives you an LRU cache — when you hit the limit, the least recently used instance is destroyed.

## When to Use

- Route-level caching for fast back-navigation
- Dashboard and list pages with expensive data loading
- When you want bounded memory growth instead of unbounded caching

## When Not to Use

- Pages whose data must be fresh on every visit (or refresh it in `onActivated`, which runs each time a cached instance is shown again).
- Pages that are cheap to re-render: caching them only costs memory.
- Only for keeping scroll position or form input: router `scrollBehavior` or a small store is often enough.

## Example

### LRU Cache with max

With vue-router, wrap the component that `RouterView` renders, through its slot. Putting `<RouterView />` directly inside `<KeepAlive>` is not supported (vue-router warns about it):

```vue
<RouterView v-slot="{ Component }">
  <KeepAlive :max="5">
    <component :is="Component" />
  </KeepAlive>
</RouterView>
```

With `max="5"` you keep the 5 most recently visited routes in memory. The 6th evicts the oldest. Fast back-navigation for recent pages without unbounded memory growth.

### Surgical Caching with include/exclude

```vue
<!-- Only cache these specific components -->
<RouterView v-slot="{ Component }">
  <KeepAlive :include="['UserDashboard', 'ProductList']">
    <component :is="Component" />
  </KeepAlive>
</RouterView>

<!-- Cache everything except these -->
<RouterView v-slot="{ Component }">
  <KeepAlive :exclude="['CheckoutPage', 'PaymentForm']">
    <component :is="Component" />
  </KeepAlive>
</RouterView>
```

`include` and `exclude` match the **component's name**, not the route. A `<script setup>` component gets its name from its file name (`ProductList.vue` → `ProductList`); set it explicitly with `defineOptions({ name: 'ProductList' })` if they differ.

Payment and checkout pages should almost never be cached — you want them to remount fresh every time for security and correctness reasons. Dashboard and list pages with expensive data loading are ideal candidates.

### Route-Driven Caching

Drive the include list from route meta so caching behavior is declared at the route level:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

// Drive the include list from route meta.
// Convention: a route's name is the name of the component it renders.
const router = useRouter()
const cachedViews = router.getRoutes()
  .filter((route) => route.meta.keepAlive)
  .map((route) => String(route.name))
</script>

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive :include="cachedViews" :max="10">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
```

```ts
// In your route definitions
{ path: '/products', name: 'ProductList', component: ProductList, meta: { keepAlive: true } }
{ path: '/checkout', name: 'Checkout', component: Checkout, meta: { keepAlive: false } }

// Type the meta field once
declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
  }
}
```

## Notes

Now caching behavior is declared at the route level rather than hardcoded in the layout component. This is much easier to maintain as your app grows. It relies on route names matching component names, so keep that convention (or store the component name in `meta` as well).

In Nuxt, use `<NuxtPage keepalive />` and `definePageMeta({ keepalive: true })` per page instead of building this yourself.
