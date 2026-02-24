# Form Context

When forms get complex — nested field components, validation that spans multiple fields, dynamic field arrays — prop drilling becomes painful fast. The form context pattern has the form own all state and provide it to any depth of field components.

## When to Use

- Complex forms with deeply nested field components
- When multiple fields need to interact (cross-field validation)
- When field components should have zero props (everything comes from context)

## Example

### The Composable

```js
// composables/useFormContext.js
const FormKey = Symbol('form')

export function provideForm(initialValues, validationRules) {
  const values = reactive({ ...initialValues })
  const errors = reactive({})
  const touched = reactive({})
  const isSubmitting = ref(false)

  function setError(field, message) {
    errors[field] = message
  }

  function clearError(field) {
    delete errors[field]
  }

  function touch(field) {
    touched[field] = true
  }

  async function validate() {
    let valid = true
    for (const [field, rule] of Object.entries(validationRules)) {
      const error = await rule(values[field], values)
      if (error) {
        errors[field] = error
        valid = false
      } else {
        delete errors[field]
      }
    }
    return valid
  }

  async function handleSubmit(onSubmit) {
    Object.keys(values).forEach(touch)
    const valid = await validate()
    if (!valid) return

    isSubmitting.value = true
    try {
      await onSubmit(values)
    } finally {
      isSubmitting.value = false
    }
  }

  const context = {
    values,
    errors: readonly(errors),
    touched: readonly(touched),
    isSubmitting: readonly(isSubmitting),
    setError,
    clearError,
    touch,
    handleSubmit,
  }

  provide(FormKey, context)
  return context
}

export function useField(name) {
  const form = inject(FormKey)
  if (!form) throw new Error('useField must be used inside a form')

  const value = computed({
    get: () => form.values[name],
    set: (val) => form.values[name] = val
  })

  const error = computed(() => form.errors[name])
  const isTouched = computed(() => form.touched[name])

  function onBlur() {
    form.touch(name)
  }

  return { value, error, isTouched, onBlur }
}
```

### Usage

```vue
<!-- Form.vue -->
<script setup>
const { handleSubmit, isSubmitting } = provideForm(
  { email: '', password: '' },
  {
    email: (val) => !val ? 'Required' : !val.includes('@') ? 'Invalid email' : null,
    password: (val) => !val ? 'Required' : val.length < 8 ? 'Too short' : null,
  }
)
</script>

<template>
  <form @submit.prevent="handleSubmit(onSubmit)">
    <EmailField />
    <PasswordField />
    <button :disabled="isSubmitting">Submit</button>
  </form>
</template>
```

```vue
<!-- EmailField.vue — no props needed, injects everything it needs -->
<script setup>
const { value, error, isTouched, onBlur } = useField('email')
</script>

<template>
  <div>
    <input v-model="value" type="email" @blur="onBlur" />
    <span v-if="isTouched && error" class="error">{{ error }}</span>
  </div>
</template>
```

## Notes

`EmailField` has zero props. It knows its own name and pulls everything it needs from the form context. You can nest it as deep as you want and it just works. This is how libraries like VeeValidate and FormKit work internally.

This is a direct application of the [[Composable Context Pattern]].
