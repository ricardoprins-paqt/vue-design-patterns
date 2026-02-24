# Transparent Wrapper Components

When you build a wrapper around a native element like `<input>`, you want the component to behave as if it *is* that input — accepting all the same attributes, events, and supporting `v-model`. Without care you end up with a leaky wrapper where `class` lands on the wrong element, `v-model` doesn't work, and aria attributes get lost.

## When to Use

- When wrapping native elements (inputs, buttons, selects) with extra UI
- When you need to control where attributes land (on the actual input, not the wrapper div)

## Example

The pattern combines `inheritAttrs: false`, `defineModel`, and `useAttrs`:

```vue
<script setup>
defineOptions({ inheritAttrs: false }) // stop auto-forwarding
const model = defineModel()            // handle v-model
const attrs = useAttrs()               // grab attrs manually
</script>

<template>
  <div class="input-wrapper">
    <label v-if="$slots.label"><slot name="label" /></label>
    <!-- forward attrs and model to the actual input, not the div -->
    <input v-bind="attrs" v-model="model" />
    <span v-if="$slots.error"><slot name="error" /></span>
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

Without `inheritAttrs: false`, the `class="big"` and the blur listener would land on the wrapper `<div>`. With this pattern everything reaches the actual `<input>`.

These four component API design patterns build on each other in real component libraries. A library might use the [as prop](polymorphic-components.md) for element flexibility, transparent wrapper for input components, [compound components](compound-components.md) for complex widgets like dropdowns, and [renderless components](renderless-components.md) for behavior-only primitives.
