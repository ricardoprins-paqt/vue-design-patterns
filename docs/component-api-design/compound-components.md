# Compound Components

UI elements made up of multiple components that share state with each other — like `Tabs` + `TabPanel`, `Accordion` + `AccordionItem`, or `Select` + `Option`. Instead of managing state at the top level and passing it through props, the parent provides its state and the children inject it.

## When to Use

- When you have a group of related components that need to share internal state
- When you find yourself with an array prop where each item maps to a child component
- Complex widgets like dropdowns, tab bars, accordions

## When Not to Use

- When the items are plain data (tabs coming from an API, each with just a label and a value): an `items` prop is simpler, and the parent can render them with a `v-for`
- When a single slot or a couple of props already cover it: compound components add an injection key, registration and ordering concerns
- For accessible widgets with keyboard navigation (tabs, menus, comboboxes) in production, consider a headless library such as [Reka UI](https://reka-ui.com) that already implements the WAI-ARIA patterns

## Example

The consumer-facing API is clean and expressive:

```vue
<Tabs>
  <TabPanel title="Profile">Profile content</TabPanel>
  <TabPanel title="Settings">Settings content</TabPanel>
</Tabs>
```

Internally, `Tabs` provides its state and `TabPanel` injects it. A typed injection key keeps both sides in sync (see [Typed Provide/Inject](../state-sharing/typed-provide-inject.md)):

```ts
// tabs-context.ts
import type { InjectionKey, Ref } from 'vue'

export interface TabsContext {
  activeTab: Ref<string | undefined>
  registerTab: (title: string) => string
}

export const TabsKey: InjectionKey<TabsContext> = Symbol('Tabs')
```

```vue
<!-- Tabs.vue -->
<script setup lang="ts">
import { provide, ref, useId } from 'vue'
import { TabsKey } from './tabs-context'

const baseId = useId()
const tabs = ref<{ id: string; title: string }[]>([])
const activeTab = ref<string>()

function registerTab(title: string): string {
  const id = `${baseId}-${tabs.value.length}`
  tabs.value.push({ id, title })
  activeTab.value ??= id // first tab is active by default
  return id
}

provide(TabsKey, { activeTab, registerTab })
</script>

<template>
  <div role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :id="`${tab.id}-tab`"
      type="button"
      role="tab"
      :aria-selected="activeTab === tab.id"
      :aria-controls="tab.id"
      @click="activeTab = tab.id"
    >
      {{ tab.title }}
    </button>
  </div>
  <slot /> <!-- TabPanels go here -->
</template>
```

```vue
<!-- TabPanel.vue -->
<script setup lang="ts">
import { inject } from 'vue'
import { TabsKey } from './tabs-context'

const { title } = defineProps<{ title: string }>()

const tabs = inject(TabsKey)
if (!tabs) throw new Error('<TabPanel> must be used inside <Tabs>')

const { activeTab, registerTab } = tabs
const id = registerTab(title)
</script>

<template>
  <div v-show="activeTab === id" :id="id" role="tabpanel" :aria-labelledby="`${id}-tab`">
    <slot />
  </div>
</template>
```

## Notes

`TabPanel` doesn't need to know anything about its siblings. The shared state lives in `Tabs` and flows through `inject`. This scales much better than passing an `activeTab` prop to every panel manually.

**Rule of thumb**: if you find yourself with an array prop where each item maps to a child component *with its own content*, compound components are probably the better API.

The example keeps registration minimal: panels register in setup order and never unregister. If panels can appear and disappear (`v-if`, `v-for` over changing data), also return an `unregisterTab` and call it in `onUnmounted`. A complete tabs widget also needs arrow-key navigation between tabs, which is left out here.
