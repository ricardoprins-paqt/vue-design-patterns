# Schema-Driven Forms

When forms are large or the form structure itself needs to be dynamic — admin panels, user-configured forms, settings pages — hardcoding each field becomes unwieldy. The schema-driven approach defines forms as data.

## When to Use

- Dynamic forms where the structure comes from an API or configuration
- Admin panels and form builders
- Settings pages with many fields
- When adding a new field type should be a one-line change

## Example

### The Schema

```js
const formSchema = [
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

```js
function validateField(value, rules) {
  if (rules.required && !value) return 'Required'
  if (rules.minLength && value.length < rules.minLength)
    return `Minimum ${rules.minLength} characters`
  if (rules.maxLength && value.length > rules.maxLength)
    return `Maximum ${rules.maxLength} characters`
  if (rules.email && !value.includes('@'))
    return 'Invalid email'
  return null
}
```

Then hook it into the form context's `validate` function, passing each field's rules from the schema:

```js
async function validate() {
  let valid = true
  for (const field of schema) {
    const error = validateField(values[field.name], field.rules ?? {})
    if (error) {
      errors[field.name] = error
      valid = false
    }
  }
  return valid
}
```

### The Component

```vue
<!-- DynamicForm.vue -->
<script setup>
const props = defineProps<{ schema: FieldSchema[], modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [Record<string, any>] }>()

const fieldComponents = {
  text: TextInput,
  email: EmailInput,
  select: SelectInput,
  textarea: TextareaInput,
}

function updateField(name, value) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}
</script>

<template>
  <form>
    <template v-for="field in schema" :key="field.name">
      <component
        :is="fieldComponents[field.type]"
        :label="field.label"
        :modelValue="modelValue[field.name]"
        @update:modelValue="updateField(field.name, $event)"
      />
    </template>
  </form>
</template>
```

The [Strategy Pattern](../component-splitting/strategy-pattern.md) does the heavy lifting — `fieldComponents` is the lookup that maps field type strings to the right component. Adding a new field type is one line in the lookup object.

### Conditional Fields

The more advanced version adds fields that show based on other field values:

```js
{
  name: 'companyName',
  type: 'text',
  label: 'Company Name',
  showWhen: (values) => values.accountType === 'business'
}
```

Avoid using `v-if` with `v-for` — instead, filter in the script with a computed:

```js
const visibleFields = computed(() =>
  schema.filter(field => !field.showWhen || field.showWhen(props.modelValue))
)
```

```vue
<template v-for="field in visibleFields" :key="field.name">
  <component
    :is="fieldComponents[field.type]"
    :label="field.label"
    :modelValue="modelValue[field.name]"
    @update:modelValue="updateField(field.name, $event)"
  />
</template>
```

The filtering logic lives in a computed that Vue caches, and since `props.modelValue` is reactive, `visibleFields` automatically recomputes when form values change — fields appear and disappear reactively as the user fills in the form. The `showWhen` function receives the current form values and returns a boolean — purely declarative from the schema's perspective.

## Notes

The schema can come from anywhere — hardcoded, from an API, from user configuration. The form doesn't care. This is how most headless CMS integrations and admin panel generators work.

All form patterns layer naturally. A real-world form might use:
- [Form Context](form-context.md) to own state and validation at any depth
- [V-Model Transformer](v-model-transformer.md) for format differences at the field level
- [Async Validation](async-validation.md) for server-side checks
- Schema-driven rendering when the structure is dynamic
- [Reactive State Machine](../advanced-reactivity/reactive-state-machine.md) to manage form lifecycle (idle, validating, submitting, success, error)
