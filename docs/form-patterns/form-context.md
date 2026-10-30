# Form Context

When forms get complex — nested field components, validation that spans multiple fields — prop drilling becomes painful fast. The form context pattern has the form own all state and provide it to any depth of field components.

## When to Use

- Complex forms with deeply nested field components
- When multiple fields need to interact (cross-field validation)
- When field components should have zero props (everything comes from context)

## When Not to Use

- Small, flat forms: a few `ref`s and `v-model`s in one component are simpler, and nothing needs to be injected.
- When you need field arrays, nested objects, async rules and schema validation (Zod, Valibot) together: use a form library such as VeeValidate, FormKit or Formwerk instead of growing this composable into one.

## Example

### The Composable

```ts
// composables/useFormContext.ts
import {
  computed, inject, provide, reactive, readonly, ref,
  type InjectionKey,
} from 'vue'

type Values = Record<string, unknown>
type Rule<T extends Values> = (value: unknown, values: T) => string | null | Promise<string | null>
type Rules<T extends Values> = Partial<Record<keyof T & string, Rule<T>>>

interface FormContext {
  values: Values
  errors: Readonly<Record<string, string | undefined>>
  touched: Readonly<Record<string, boolean | undefined>>
  touch: (field: string) => void
  validateField: (field: string) => Promise<boolean>
}

const FormKey: InjectionKey<FormContext> = Symbol('form')

export function provideForm<T extends Values>(initialValues: T, validationRules: Rules<T>) {
  const values = reactive({ ...initialValues }) as T
  const errors = reactive<Record<string, string | undefined>>({})
  const touched = reactive<Record<string, boolean | undefined>>({})
  const isSubmitting = ref(false)

  function setError(field: string, message: string) {
    errors[field] = message
  }

  function clearError(field: string) {
    delete errors[field]
  }

  function touch(field: string) {
    touched[field] = true
  }

  async function validateField(field: string): Promise<boolean> {
    const rule = validationRules[field as keyof T & string]
    const error = rule ? await rule(values[field], values) : null
    if (error) setError(field, error)
    else clearError(field)
    return !error
  }

  async function validate(): Promise<boolean> {
    const results = await Promise.all(Object.keys(validationRules).map(validateField))
    return results.every(Boolean)
  }

  async function handleSubmit(onSubmit: (values: T) => void | Promise<void>) {
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
    validateField,
    handleSubmit,
  }

  provide(FormKey, context)
  return context
}

export function useField<V = unknown>(name: string) {
  const form = inject(FormKey)
  if (!form) throw new Error('useField must be used inside a form')

  const value = computed<V>({
    get: () => form.values[name] as V,
    set: (val) => { form.values[name] = val },
  })

  const error = computed(() => form.errors[name])
  const isTouched = computed(() => form.touched[name] ?? false)

  const onBlur = () => {
    form.touch(name)
    void form.validateField(name)
  }

  return { value, error, isTouched, onBlur }
}
```

### Usage

```vue
<!-- Form.vue -->
<script setup lang="ts">
import { provideForm } from '@/composables/useFormContext'

const { handleSubmit, isSubmitting } = provideForm(
  { email: '', password: '' },
  {
    email: (val) => !val ? 'Required' : !String(val).includes('@') ? 'Invalid email' : null,
    password: (val) => !val ? 'Required' : String(val).length < 8 ? 'Too short' : null,
  }
)

async function onSubmit(values: { email: string; password: string }) {
  await api.login(values)
}
</script>

<template>
  <!-- novalidate: our rules show the messages, not the browser's built-in validation -->
  <form novalidate @submit.prevent="handleSubmit(onSubmit)">
    <EmailField />
    <PasswordField />
    <button :disabled="isSubmitting">Submit</button>
  </form>
</template>
```

```vue
<!-- EmailField.vue — no props needed, injects everything it needs -->
<script setup lang="ts">
import { useField } from '@/composables/useFormContext'

const { value, error, isTouched, onBlur } = useField<string>('email')
</script>

<template>
  <div>
    <label for="email">Email</label>
    <input
      id="email"
      v-model="value"
      type="email"
      :aria-invalid="isTouched && !!error"
      aria-describedby="email-error"
      @blur="onBlur"
    />
    <span v-if="isTouched && error" id="email-error" class="error">{{ error }}</span>
  </div>
</template>
```

## Notes

`EmailField` has zero props. It knows its own name and pulls everything it needs from the form context. You can nest it as deep as you want and it just works. This is how libraries like VeeValidate and FormKit work internally.

Validation runs per field on blur, and for all fields on submit. A field that was wrong shows its error as soon as the user leaves it, and the error disappears once it is fixed instead of staying until the next submit.

The `novalidate` attribute matters: with `type="email"` and no `novalidate`, the browser blocks the submit with its own tooltip and your `Invalid email` message never appears.

This is a direct application of the [Composable Context Pattern](../state-sharing/composable-context-pattern.md).
