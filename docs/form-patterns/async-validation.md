# Async Validation

Some validation can't be synchronous — checking if a username is taken, validating a coupon code, verifying an address. The challenge is doing this without flooding the server and without showing stale error states.

## When to Use

- Username availability checks
- Coupon code validation
- Address verification
- Any validation that requires a server round-trip

## When Not to Use

- When the rule can be checked on the client (format, length, required): keep that synchronous and only go to the server for what really needs it.
- When the server validates on submit anyway and an early hint adds little: a single check on submit is simpler and avoids a request per keystroke pause.

## Example

### The Composable

Combines debounced watching with the abort/cleanup pattern from [Race Condition Handling](../async-and-data-fetching/race-condition-handling.md):

```ts
import { ref, watch, onWatcherCleanup, type Ref } from 'vue'

type AsyncValidator<T> = (
  value: T,
  options: { signal: AbortSignal }
) => Promise<{ error: string | null }>

export function useAsyncValidation<T>(
  value: Ref<T>,
  asyncValidator: AsyncValidator<T>,
  delay = 500
) {
  const error = ref<string | null>(null)
  const validating = ref(false)
  const valid = ref<boolean | null>(null) // null = unknown, true = valid, false = invalid

  watch(value, (current) => {
    // A new value is unknown until checked: don't keep showing the old result
    error.value = null
    valid.value = null

    if (!current) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      validating.value = true

      try {
        const result = await asyncValidator(current, { signal: controller.signal })
        if (controller.signal.aborted) return // value changed meanwhile

        error.value = result.error
        valid.value = result.error === null
      } catch (e) {
        if (controller.signal.aborted) return
        error.value = 'Validation failed'
        valid.value = false
      } finally {
        if (!controller.signal.aborted) validating.value = false
      }
    }, delay)

    // Runs before the next run of this watcher (and when the scope is disposed)
    onWatcherCleanup(() => {
      clearTimeout(timer)
      controller.abort()
      validating.value = false
    })
  })

  return { error, validating, valid }
}
```

### Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'

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
    <label for="username">Username</label>
    <input
      id="username"
      v-model="username"
      :aria-invalid="valid === false"
      aria-describedby="username-status"
    />
    <span id="username-status" aria-live="polite">
      <span v-if="validating">Checking...</span>
      <span v-else-if="error" class="error">{{ error }}</span>
      <span v-else-if="valid" class="success">Available!</span>
    </span>
  </div>
</template>
```

## Notes

The three-state `valid` ref (`null`/`true`/`false`) is worth noting. `null` means "not yet validated" which is different from "invalid". Without this distinction you'd show a success checkmark on an empty field, which looks wrong. That is also why every new value resets `valid` to `null` straight away: otherwise "Available!" stays visible for the previous username during the debounce.

The `signal.aborted` checks after the `await` matter even when you pass the signal on: a validator that ignores it still resolves, and its outdated answer must not overwrite the result for the current value.

The `aria-live` region makes screen readers announce "Checking..." and the result without the user having to leave the field.

**On submit**, don't trust a result that is still pending: disable the submit button while `validating` is true (or the debounce is running), or run the validator once more in the submit handler. The server must validate again anyway; the async check is only a convenience for the user.
