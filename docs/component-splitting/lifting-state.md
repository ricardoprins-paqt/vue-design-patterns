# Lifting State

Solves the "cousin components" problem — when two components that aren't parent/child need to share state. The solution is to lift the state up to their nearest common ancestor.

## When to Use

- When sibling or cousin components need to share state
- When the common ancestor is close enough that prop drilling is manageable
- Before reaching for a global store

## Example

```
        Page
       /    \
  Sidebar   Content
     |          |
  FilterPanel  DataTable
```

If `FilterPanel` and `DataTable` need to share filter state, lift it up to `Page`:

```vue
<!-- Page.vue — owns the shared state -->
<script setup>
const filters = ref({ search: '', category: 'all' })
</script>

<template>
  <Sidebar>
    <FilterPanel v-model:filters="filters" />
  </Sidebar>
  <Content>
    <DataTable :filters="filters" />
  </Content>
</template>
```

## Notes

The key decision is **how far to lift**. You lift just enough — to the nearest common ancestor, not all the way to a global store. Lifting too high creates unnecessary coupling and makes state changes affect parts of the tree that don't care about them.

**When to reach for a global store instead**: when the common ancestor is so far up the tree that lifting would cause the state to flow through many intermediate components that have no business knowing about it. That's prop drilling, and that's when `provide`/`inject` or Pinia becomes the better answer.
