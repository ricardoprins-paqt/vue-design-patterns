# defineAsyncComponent + Suspense for Granular Code Splitting

The naive approach to code splitting is splitting at the route level — each page is a separate chunk. But for heavy pages with optional sections, you can go more granular.

## When to Use

- Heavy pages with optional or secondary sections
- Components that include large libraries (chart libs, rich text editors)
- When you want coordinated loading states across multiple async components

## When Not to Use

- Small components or content above the fold: every async component is an extra request and a later paint, which can cost more than the bytes it saves.
- In Nuxt, prefix the component with `Lazy` (`<LazyHeavyChart />`) instead of calling `defineAsyncComponent` yourself. Lazy hydration (`<LazyHeavyChart hydrate-on-visible />`) also delays the JavaScript work for server-rendered content.
- `<Suspense>` is still marked **experimental** in Vue 3.5. If you'd rather not depend on it, give each async component its own `loadingComponent` / `delay` options instead.

## Example

### Basic Async Components

```ts
import { defineAsyncComponent } from 'vue'

// These components are only loaded when they're first rendered
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
const DataGrid = defineAsyncComponent(() => import('./DataGrid.vue'))
const RichTextEditor = defineAsyncComponent(() => import('./RichTextEditor.vue'))
```

### Coordinated Loading with Suspense

The issue with naive async components is that each one manages its own loading state independently — you get a janky page where different sections pop in at different times. `Suspense` coordinates them:

```vue
<Suspense>
  <template #default>
    <div class="dashboard">
      <HeavyChart :data="chartData" />   <!-- loads lazily -->
      <DataGrid :rows="rows" />           <!-- loads lazily -->
    </div>
  </template>

  <template #fallback>
    <DashboardSkeleton />  <!-- shows until both are ready -->
  </template>
</Suspense>
```

Both chunks load in parallel. The skeleton shows until both are ready, then the whole dashboard appears at once. No janky partial renders.

### Nested Suspense for Priority Loading

For even more control, nest `Suspense` boundaries — critical content loads first, secondary content loads independently:

```vue
<Suspense>
  <template #default>
    <!-- Suspense slots need a single root node -->
    <div class="profile-page">
      <!-- Critical content — page waits for this -->
      <UserProfile :user="user" />

      <!-- Secondary content — loads independently, doesn't block above -->
      <Suspense>
        <template #default>
          <RecommendationEngine />
        </template>
        <template #fallback>
          <RecommendationSkeleton />
        </template>
      </Suspense>
    </div>
  </template>

  <template #fallback>
    <ProfileSkeleton />
  </template>
</Suspense>
```

`UserProfile` loading doesn't wait for `RecommendationEngine`. But `RecommendationEngine` has its own skeleton so it doesn't cause layout shift when it arrives. (If you *do* want the outer boundary to wait for the inner one, add the `suspensible` prop to the inner `<Suspense>`.)

## Notes

See also: [Error Boundaries](../async-and-data-fetching/error-boundaries.md) for handling failures in async components.
