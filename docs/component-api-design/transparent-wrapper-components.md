# Transparent Wrapper Components

When you build a wrapper around a native element like `<input>`, you want the component to behave as if it *is* that input — accepting all the same attributes, events, and supporting `v-model`. Without care you end up with a leaky wrapper where `class` lands on the wrong element, `v-model` doesn't work, and aria attributes get lost.

## When to Use

- When wrapping native elements (inputs, buttons, selects) with extra UI
- When you need to control where attributes land (on the actual input, not the wrapper div)

## When Not to Use

- When the wrapper adds nothing but a class: use the native element with that class
- When you want a deliberate, limited API instead of "everything an `<input>` accepts": that is the [Adapter Pattern](adapter-pattern.md)

## Example

The pattern combines `inheritAttrs: false`, `defineModel`, and `useAttrs`:

```vue
<!-- BaseInput.vue -->
<script setup lang="ts">
import { useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false }) // stop auto-forwarding
const model = defineModel<string>()    // handle v-model
const attrs = useAttrs()               // grab attrs manually
const id = useId()                     // link the label (and error) to the input
</script>

<template>
  <div class="input-wrapper">
    <label v-if="$slots.label" :for="id"><slot name="label" /></label>
    <!-- forward attrs and model to the actual input, not the div -->
    <input
      :id="id"
      v-bind="attrs"
      v-model="model"
      :aria-describedby="$slots.error ? `${id}-error` : undefined"
    />
    <span v-if="$slots.error" :id="`${id}-error`"><slot name="error" /></span>
  </div>
</template>
```

```vue
<!-- Consumer uses it exactly like a native input -->
<BaseInput
  v-model="email"
  type="email"
  class="big"
  @blur="validate"
>
  <template #label>Email address</template>
  <template #error>Invalid email</template>
</BaseInput>
```

## Notes

Without `inheritAttrs: false`, the `class="big"` and the blur listener would land on the wrapper `<div>`. With this pattern everything reaches the actual `<input>`. If you'd rather have `class` and `style` style the wrapper while the rest goes to the input, split them as shown in [Attribute Routing](attribute-routing.md).

`useId()` (Vue 3.5+) gives each instance a stable, SSR-safe id, so the label is clickable and screen readers announce the error text with the input. If a consumer passes its own `id`, it overrides the generated one on the input but not on the label, so either declare `id` as a prop or leave ids to the component.

`v-model` modifiers like `.trim` arrive in the wrapper, not on the inner `<input>`: read them with `const [model, modifiers] = defineModel<string>()` and apply them in a `set` transformer if you need them.

These component API design patterns build on each other in real component libraries. A library might use the [as prop](polymorphic-components.md) for element flexibility, transparent wrapper for input components, [compound components](compound-components.md) for complex widgets like dropdowns, and [renderless components](renderless-components.md) for behavior-only primitives.
