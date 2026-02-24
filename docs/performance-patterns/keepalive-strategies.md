# KeepAlive with max and Strategic include/exclude

The performance angle on `KeepAlive` that's easy to miss: keeping too many component instances in memory is itself a performance problem. The `max` prop gives you an LRU cache — when you hit the limit, the least recently used instance is destroyed.

## When to Use

- Route-level caching for fast back-navigation
- Dashboard and list pages with expensive data loading
- When you want bounded memory growth instead of unbounded caching

## Example

### LRU Cache with max

```vue
<KeepAlive :max="5">
  <RouterView />
</KeepAlive>
```

With `max="5"` you keep the 5 most recently visited routes in memory. The 6th evicts the oldest. Fast back-navigation for recent pages without unbounded memory growth.

### Surgical Caching with include/exclude

```vue
<!-- Only cache these specific components -->
<KeepAlive :include="['UserDashboard', 'ProductList']">
  <RouterView />
</KeepAlive>

<!-- Cache everything except these -->
<KeepAlive :exclude="['CheckoutPage', 'PaymentForm']">
  <RouterView />
</KeepAlive>
```

Payment and checkout pages should almost never be cached — you want them to remount fresh every time for security and correctness reasons. Dashboard and list pages with expensive data loading are ideal candidates.

### Route-Driven Caching

Drive the include list from route meta so caching behavior is declared at the route level:

```vue
<KeepAlive
  :include="cachedRoutes"
  :max="10"
>
  <RouterView />
</KeepAlive>
```

```js
// Drive the include list from route meta
const router = useRouter()
const cachedRoutes = computed(() =>
  router.getRoutes()
    .filter(r => r.meta.keepAlive)
    .map(r => r.name)
)
```

```js
// In your route definitions
{ path: '/products', name: 'ProductList', meta: { keepAlive: true } }
{ path: '/checkout', name: 'Checkout', meta: { keepAlive: false } }
```

## Notes

Now caching behavior is declared at the route level rather than hardcoded in the layout component. This is much easier to maintain as your app grows.
