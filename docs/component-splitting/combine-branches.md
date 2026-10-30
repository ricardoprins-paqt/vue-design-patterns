# Combine Branches

When you have multiple `v-if` branches in a template, each branch is often really its own thing — its own set of props, its own logic, its own layout. Extracting each branch into its own component makes the parent template read like a state machine.

## When to Use

- When a template has multiple `v-if`/`v-else-if` branches with different UI
- When each branch has different concerns and different data needs
- State-based rendering (loading, error, empty, success)

## Example

**Before** — all branches inline:

```vue
<template>
  <div>
    <div v-if="state === 'loading'">
      <Spinner />
      <p>Loading your data...</p>
    </div>

    <div v-else-if="state === 'error'">
      <ErrorIcon />
      <p>{{ error.message }}</p>
      <button @click="retry">Try again</button>
    </div>

    <div v-else-if="state === 'empty'">
      <EmptyIllustration />
      <p>No results found</p>
    </div>

    <div v-else>
      <DataTable :rows="data" />
    </div>
  </div>
</template>
```

**After** — each branch is a component:

```vue
<script setup lang="ts">
// state: 'loading' | 'error' | 'empty' | 'success'
const { state, error, data, retry } = useSearchResults()
</script>

<template>
  <LoadingState v-if="state === 'loading'" />
  <ErrorState v-else-if="state === 'error'" :error="error" @retry="retry" />
  <EmptyState v-else-if="state === 'empty'" />
  <DataTable v-else :rows="data" />
</template>
```

Now the parent reads like a state machine — you can see all the possible states at a glance without wading through their implementations. Each state component can be developed and tested independently.

## Notes

**Caveat**: if the branches share a lot of the same markup or state, extracting them might cause more duplication than it saves. Use judgment — the goal is clarity, not extraction for its own sake. See [When Not to Split](when-not-to-split.md).

**Type the state**: a plain string `state` next to a separate `error` and `data` allows impossible combinations (`state === 'error'` with no `error`). A discriminated union such as `{ status: 'error'; error: Error } | { status: 'success'; data: Row[] }` lets TypeScript narrow `error` and `data` inside each branch. [Reactive State Machine](../advanced-reactivity/reactive-state-machine.md) takes this further.
