# Schema-Driven Forms

When forms are large or the form structure itself needs to be dynamic — admin panels, user-configured forms, settings pages — hardcoding each field becomes unwieldy. The schema-driven approach defines forms as data.

## When to Use

- Dynamic forms where the structure comes from an API or configuration
- Admin panels and form builders
- Settings pages with many fields
- When adding a new field type should be a one-line change

## When Not to Use

- Forms with a fixed structure and a lot of custom layout or behaviour: a schema turns every exception into a new schema option, and a hand-written template is easier to read and change.
- When you would re-implement a form library: if you need schema-driven forms with many field types, look at FormKit's schema or a JSON Schema based renderer first.

## Example

### The Schema

```ts
// types.ts
export interface FieldRules {
  required?: boolean
  minLength?: number
  maxLength?: number
  email?: boolean
}

export interface FieldSchema {
  name: string
  type: 'text' | 'email' | 'select' | 'textarea'
  label: string
  options?: { value: string; label: string }[]
  rules?: FieldRules
  showWhen?: (values: Record<string, unknown>) => boolean
}
```

```ts
const formSchema: FieldSchema[] = [
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
    rules: { required: true, minLength: 2 }
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    rules: { required: true, email: true }
  },
  {
    name: 'role',
    type: 'select',
    label: 'Role',
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'user', label: 'User' },
    ],
    rules: { required: true }
  },
  {
    name: 'bio',
    type: 'textarea',
    label: 'Bio',
    rules: { maxLength: 500 }
  }
]
```

### Schema-Driven Validation

The schema drives both rendering AND validation. A `validateField` function interprets the rules object:

```ts
function validateField(value: unknown, rules: FieldRules): string | null {
  const text = value == null ? '' : String(value)

  if (!text) return rules.required ? 'Required' : null // empty optional fields are valid
  if (rules.minLength && text.length < rules.minLength)
    return `Minimum ${rules.minLength} characters`
  if (rules.maxLength && text.length > rules.maxLength)
    return `Maximum ${rules.maxLength} characters`
  if (rules.email && !text.includes('@'))
    return 'Invalid email'
  return null
}
```

Then hook it into the [Form Context](form-context.md)'s `validate` function, passing each field's rules from the schema. Like the original, it clears the error of a field that is valid again, and it skips fields that are hidden (see [Conditional Fields](#conditional-fields) below):

```ts
async function validate(): Promise<boolean> {
  let valid = true
  for (const field of schema) {
    // Hidden fields are not validated: the user can't see or fix their errors
    const error = isVisible(field, values)
      ? validateField(values[field.name], field.rules ?? {})
      : null
    if (error) {
      errors[field.name] = error
      valid = false
    } else {
      delete errors[field.name]
    }
  }
  return valid
}

function isVisible(field: FieldSchema, values: Record<string, unknown>): boolean {
  return !field.showWhen || field.showWhen(values)
}
```

### The Component

```vue
<!-- DynamicForm.vue -->
<script setup lang="ts">
import { type Component } from 'vue'
import type { FieldSchema } from './types'

const props = defineProps<{ schema: FieldSchema[]; modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ 'update:modelValue': [Record<string, unknown>] }>()

const fieldComponents: Record<FieldSchema['type'], Component> = {
  text: TextInput,
  email: EmailInput,
  select: SelectInput,
  textarea: TextareaInput,
}

function updateField(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}
</script>

<template>
  <form>
    <component
      :is="fieldComponents[field.type]"
      v-for="field in schema"
      :key="field.name"
      :label="field.label"
      :options="field.options"
      :model-value="modelValue[field.name]"
      @update:model-value="updateField(field.name, $event)"
    />
  </form>
</template>
```

The [Strategy Pattern](../component-splitting/strategy-pattern.md) does the heavy lifting — `fieldComponents` is the lookup that maps field type strings to the right component. Adding a new field type is one line in the lookup object, and typing it as `Record<FieldSchema['type'], Component>` makes TypeScript complain when a type in the schema has no component. Every field component gets the same props (`label`, `options`, `modelValue`); components that don't need `options` simply ignore it.

### Conditional Fields

The more advanced version adds fields that show based on other field values:

```ts
{
  name: 'companyName',
  type: 'text',
  label: 'Company Name',
  showWhen: (values) => values.accountType === 'business'
}
```

Avoid using `v-if` with `v-for` — instead, filter in the script with a computed:

```ts
const visibleFields = computed(() =>
  props.schema.filter((field) => isVisible(field, props.modelValue))
)
```

```vue
<component
  :is="fieldComponents[field.type]"
  v-for="field in visibleFields"
  :key="field.name"
  :label="field.label"
  :options="field.options"
  :model-value="modelValue[field.name]"
  @update:model-value="updateField(field.name, $event)"
/>
```

The filtering logic lives in a computed that Vue caches, and since `props.modelValue` is reactive, `visibleFields` automatically recomputes when form values change — fields appear and disappear reactively as the user fills in the form. The `showWhen` function receives the current form values and returns a boolean — purely declarative from the schema's perspective. The same `isVisible` check is used by `validate`, so a hidden required field never blocks the submit. Decide as well whether hidden values should be sent: usually you strip them from the submitted data.

## Notes

The schema can come from anywhere — hardcoded, from an API, from user configuration. The form doesn't care. This is how most headless CMS integrations and admin panel generators work. One caveat: a function like `showWhen` can't be sent as JSON. When the schema comes from an API, describe conditions as data instead (for example `showWhen: { field: 'accountType', equals: 'business' }`) and let `isVisible` interpret them.

All form patterns layer naturally. A real-world form might use:
- [Form Context](form-context.md) to own state and validation at any depth
- [V-Model Transformer](v-model-transformer.md) for format differences at the field level
- [Async Validation](async-validation.md) for server-side checks
- Schema-driven rendering when the structure is dynamic
- [Reactive State Machine](../advanced-reactivity/reactive-state-machine.md) to manage form lifecycle (idle, validating, submitting, success, error)
