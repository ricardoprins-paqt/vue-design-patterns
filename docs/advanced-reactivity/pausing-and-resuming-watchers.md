# Pausing and Resuming Watchers

`watch` and `watchEffect` return a stop handle, but Vue 3.5 added `pause` and `resume` too. This is useful when you want a watcher to exist but temporarily not react.

## When to Use

- During drag operations, bulk updates, or animations
- When you want to suppress a watcher temporarily without destroying and recreating it
- Batch import operations where you want one final save instead of saving on each change

## Example

### Basic Usage

```ts
import { ref, watchEffect } from 'vue'

const count = ref(0)

const { stop, pause, resume } = watchEffect(() => {
  console.log('count is', count.value)
})

pause()
count.value++  // watcher doesn't fire
count.value++  // watcher doesn't fire

resume()
// watcher fires once with the latest value

stop()
// watcher is gone entirely
```

### Practical Example — Suppressing Auto-Save During Bulk Import

```ts
const formData = ref<FormData>({ ...emptyForm })

const { pause, resume } = watch(formData, (data) => saveToServer(data), { deep: true })

function importData(rows: FormData[]) {
  pause()                          // stop auto-saving during import

  try {
    for (const row of rows) {
      formData.value = { ...row }  // lots of changes, none trigger saves
    }
  } finally {
    resume()                       // auto-save resumes and runs ONCE for the paused changes
  }
}
```

There is no manual save at the end: when you `resume()`, Vue runs the watcher once if its sources changed while paused. Saving by hand as well would save twice. The `try/finally` makes sure a failed import doesn't leave auto-save switched off.

## Notes

Without `pause`/`resume` you'd have to track a flag inside the watcher and return early — messier and error-prone.

If you want the paused changes to be *discarded* instead of applied on resume, `pause`/`resume` is the wrong tool: stop the watcher and create a new one, or use the flag.

This was added in Vue 3.5.
