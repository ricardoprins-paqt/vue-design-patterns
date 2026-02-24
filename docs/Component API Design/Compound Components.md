# Compound Components

UI elements made up of multiple components that share state with each other — like `Tabs` + `TabPanel`, `Accordion` + `AccordionItem`, or `Select` + `Option`. Instead of managing state at the top level and passing it through props, the parent provides its state and the children inject it.

## When to Use

- When you have a group of related components that need to share internal state
- When you find yourself with an array prop where each item maps to a child component
- Complex widgets like dropdowns, tab bars, accordions

## Example

The consumer-facing API is clean and expressive:

```vue
<Tabs>
  <TabPanel title="Profile">Profile content</TabPanel>
  <TabPanel title="Settings">Settings content</TabPanel>
</Tabs>
```

Internally, `Tabs` provides its state and `TabPanel` injects it:

```vue
<!-- Tabs.vue -->
<script setup>
const activeTab = ref(0)
const registerTab = (id) => { /* track tabs */ }

provide('tabs-context', { activeTab, registerTab })
</script>

<template>
  <div>
    <!-- render tab headers somehow -->
    <slot /> <!-- TabPanels go here -->
  </div>
</template>
```

```vue
<!-- TabPanel.vue -->
<script setup>
const props = defineProps({ title: String })
const { activeTab, registerTab } = inject('tabs-context')

const id = registerTab(props.title)
</script>

<template>
  <div v-if="activeTab === id">
    <slot />
  </div>
</template>
```

## Notes

`TabPanel` doesn't need to know anything about its siblings. The shared state lives in `Tabs` and flows through `inject`. This scales much better than passing an `activeTab` prop to every panel manually.

**Rule of thumb**: if you find yourself with an array prop where each item maps to a child component, compound components are probably the better API.
