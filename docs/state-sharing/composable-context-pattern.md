# Composable Context Pattern

The most elegant state sharing pattern — it combines the [[Singleton Composable]] and [[Typed Provide Inject]] into a single composable that can behave as both a provider and a consumer depending on where it's called.

The idea is that a feature's state is provided at a high level and consumed anywhere below — but the `provide` and `inject` are hidden inside the same composable so consumers don't need to know about injection keys at all.

## When to Use

- Feature-level state that needs to flow through a component subtree
- When you want to hide the complexity of `provide`/`inject` from consumers
- Form state, wizard step state, layout context

## Example

```ts
// composables/useFormContext.ts
import { provide, inject, ref, readonly } from 'vue'
import type { InjectionKey } from 'vue'

interface FormContext {
  isSubmitting: Ref<boolean>
  errors: Ref<Record<string, string>>
  setError: (field: string, message: string) => void
}

const FormKey: InjectionKey<FormContext> = Symbol('form')

// Called in the parent Form component
export function provideForm() {
  const isSubmitting = ref(false)
  const errors = ref<Record<string, string>>({})

  const setError = (field: string, message: string) => {
    errors.value[field] = message
  }

  const context: FormContext = {
    isSubmitting: readonly(isSubmitting),
    errors: readonly(errors),
    setError
  }

  provide(FormKey, context)
  return context
}

// Called in any child field component
export function useForm() {
  const context = inject(FormKey)
  if (!context) throw new Error('useForm() must be used inside a Form component')
  return context
}
```

```vue
<!-- Form.vue -->
<script setup>
const { isSubmitting, errors } = provideForm()
</script>

<!-- InputField.vue - anywhere inside Form -->
<script setup>
const { errors, setError } = useForm()
</script>
```

## Notes

The `Symbol` key is completely internal — consumers just call `useForm()`, they never deal with injection keys directly. This is exactly how Vue Router exposes `useRouter()` and `useRoute()` — they're injecting from context provided by the router plugin, you just never see the `Symbol`.

The four state sharing patterns cover a spectrum from simple to structured:
- [[Singleton Composable]] for small apps or simple shared state
- [[Typed Provide Inject]] for scoped context within a component tree
- [[Composable Context Pattern]] for feature-level state flowing through a subtree
- [[Mini Store with effectScope]] for stores that need proper lifecycle management
