# defineAsyncComponent + Suspense for Granular Code Splitting

The naive approach to code splitting is splitting at the route level — each page is a separate chunk. But for heavy pages with optional sections, you can go more granular.

## When to Use

- Heavy pages with optional or secondary sections
- Components that include large libraries (chart libs, rich text editors)
- When you want coordinated loading states across multiple async components

## Example

### Basic Async Components

```js
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
  </template>

  <template #fallback>
    <ProfileSkeleton />
  </template>
</Suspense>
```

`UserProfile` loading doesn't wait for `RecommendationEngine`. But `RecommendationEngine` has its own skeleton so it doesn't cause layout shift when it arrives.

## Notes

See also: [[Error Boundaries]] for handling failures in async components.
