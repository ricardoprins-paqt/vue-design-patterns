# Pausing and Resuming Watchers

`watch` and `watchEffect` return a stop handle, but Vue 3.5 added `pause` and `resume` too. This is useful when you want a watcher to exist but temporarily not react.

## When to Use

- During drag operations, bulk updates, or animations
- When you want to suppress a watcher temporarily without destroying and recreating it
- Batch import operations where you want one final save instead of saving on each change

## Example

### Basic Usage

```js
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

```js
const { pause, resume } = watch(formData, saveToServer, { deep: true })

async function importData(rows) {
  pause()                          // stop auto-saving during import

  for (const row of rows) {
    formData.value = { ...row }    // lots of changes, none trigger saves
  }

  await saveToServer(formData.value) // one manual save at the end
  resume()                          // auto-save resumes
}
```

## Notes

Without `pause`/`resume` you'd have to track a flag inside the watcher and return early — messier and error-prone.

This was added in Vue 3.5.
