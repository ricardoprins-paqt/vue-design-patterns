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
<script setup lang="ts">
import { ref } from 'vue'

interface Filters {
  search: string
  category: string
}

const filters = ref<Filters>({ search: '', category: 'all' })
</script>

<template>
  <Sidebar>
    <FilterPanel v-model:search="filters.search" v-model:category="filters.category" />
  </Sidebar>
  <Content>
    <DataTable :filters="filters" />
  </Content>
</template>
```

`FilterPanel` doesn't own the state anymore; it reads and writes it through `defineModel`:

```vue
<!-- FilterPanel.vue -->
<script setup lang="ts">
const search = defineModel<string>('search', { required: true })
const category = defineModel<string>('category', { required: true })
</script>

<template>
  <input v-model="search" type="search" />
  <select v-model="category">
    <option value="all">All</option>
    <option value="books">Books</option>
  </select>
</template>
```

One `v-model` per field keeps every write going through an event. A single `v-model:filters` with `v-model="filters.search"` inside the panel would mutate the parent's object through the prop instead.

## Notes

The key decision is **how far to lift**. You lift just enough — to the nearest common ancestor, not all the way to a global store. Lifting too high creates unnecessary coupling and makes state changes affect parts of the tree that don't care about them.

**When to reach for a global store instead**: when the common ancestor is so far up the tree that lifting would cause the state to flow through many intermediate components that have no business knowing about it. That's prop drilling, and that's when [`provide`/`inject`](../state-sharing/typed-provide-inject.md) or Pinia becomes the better answer.
