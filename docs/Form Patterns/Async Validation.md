# Async Validation

Some validation can't be synchronous — checking if a username is taken, validating a coupon code, verifying an address. The challenge is doing this without flooding the server and without showing stale error states.

## When to Use

- Username availability checks
- Coupon code validation
- Address verification
- Any validation that requires a server round-trip

## Example

### The Composable

Combines debounced watching with the abort/cleanup pattern from [[Race Condition Handling]]:

```js
function useAsyncValidation(value, asyncValidator, delay = 500) {
  const error = ref(null)
  const validating = ref(false)
  const valid = ref(null) // null = unknown, true = valid, false = invalid

  let debounceTimer = null

  watch(value, async () => {
    if (!value.value) {
      error.value = null
      valid.value = null
      return
    }

    clearTimeout(debounceTimer)

    debounceTimer = setTimeout(async () => {
      const controller = new AbortController()
      onWatcherCleanup(() => {
        controller.abort()
        validating.value = false
      })

      validating.value = true
      error.value = null

      try {
        const result = await asyncValidator(value.value, {
          signal: controller.signal
        })

        error.value = result.error ?? null
        valid.value = !result.error
      } catch (e) {
        if (e.name !== 'AbortError') {
          error.value = 'Validation failed'
          valid.value = false
        }
      } finally {
        validating.value = false
      }
    }, delay)
  })
}
```

### Usage

```vue
<script setup>
const username = ref('')
const { error, validating, valid } = useAsyncValidation(
  username,
  async (val, { signal }) => {
    const taken = await checkUsernameAvailable(val, { signal })
    return { error: taken ? 'Username already taken' : null }
  }
)
</script>

<template>
  <div>
    <input v-model="username" />
    <span v-if="validating">Checking...</span>
    <span v-else-if="error" class="error">{{ error }}</span>
    <span v-else-if="valid" class="success">Available!</span>
  </div>
</template>
```

## Notes

The three-state `valid` ref (`null`/`true`/`false`) is worth noting. `null` means "not yet validated" which is different from "invalid". Without this distinction you'd show a success checkmark on an empty field, which looks wrong.
