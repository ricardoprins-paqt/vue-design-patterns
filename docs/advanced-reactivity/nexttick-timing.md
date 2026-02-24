# nextTick Timing Pattern

Coordinating reactive state changes with DOM manipulation by using `nextTick` to wait for Vue's batched DOM updates. Solves timing issues when accessing element refs, measuring DOM, or triggering animations immediately after state changes.

## When to Use

- Accessing element refs that just became visible (`v-if` toggled to true)
- Measuring DOM elements after data changes
- Triggering animations after rendering new content
- Scrolling to newly rendered elements
- Focus management after conditional rendering
- Any time you need to interact with the DOM immediately after changing reactive state

## The Problem

Vue batches DOM updates for performance. When you change reactive state, the DOM doesn't update immediately:

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
const buttonRef = ref(null)

function increment() {
  count.value++ // State changes
  
  console.log(buttonRef.value.textContent) // ❌ Still shows old value!
  // The DOM hasn't updated yet
}
</script>

<template>
  <button ref="buttonRef" @click="increment">
    Count: {{ count }}
  </button>
</template>
```

**Another common case:**

```vue
<script setup>
import { ref, watch } from 'vue'

const show = ref(false)
const boxRef = ref(null)

watch(show, (isShown) => {
  if (isShown) {
    // ❌ CRASH! boxRef.value is still null
    boxRef.value.classList.add('animate')
  }
})
</script>

<template>
  <button @click="show = true">Show Box</button>
  <div v-if="show" ref="boxRef" class="box">Animated Box</div>
</template>
```

The element exists in state but not yet in the DOM.

## Solution

Use `nextTick()` to wait for the next DOM update cycle:

### Example 1: Accessing Updated DOM Content

```vue
<script setup>
import { ref, nextTick } from 'vue'

const count = ref(0)
const buttonRef = ref(null)

async function increment() {
  count.value++
  
  await nextTick() // Wait for DOM update
  
  console.log(buttonRef.value.textContent) // ✅ Shows new value!
}
</script>

<template>
  <button ref="buttonRef" @click="increment">
    Count: {{ count }}
  </button>
</template>
```

### Example 2: Animating Newly Visible Elements

```vue
<script setup>
import { ref, watch, nextTick } from 'vue'

const show = ref(false)
const boxRef = ref(null)

watch(show, async (isShown) => {
  if (isShown) {
    await nextTick() // Wait for element to mount
    boxRef.value.classList.add('animate') // ✅ Now it exists
  }
})
</script>

<template>
  <button @click="show = true">Show Box</button>
  <div v-if="show" ref="boxRef" class="box">Animated Box</div>
</template>
```

### Example 3: Scrolling to Dynamic Content

```vue
<script setup>
import { ref, nextTick } from 'vue'

const items = ref([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
])

async function addAndScroll() {
  const newId = items.value.length + 1
  items.value.push({ id: newId, name: `Item ${newId}` })
  
  await nextTick() // Wait for item to render
  
  const newItem = document.querySelector(`[data-id="${newId}"]`)
  newItem.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <button @click="addAndScroll">Add Item</button>
  <div v-for="item in items" :key="item.id" :data-id="item.id">
    {{ item.name }}
  </div>
</template>
```

### Example 4: Focus Management

```vue
<script setup>
import { ref, nextTick } from 'vue'

const showInput = ref(false)
const inputRef = ref(null)

async function reveal() {
  showInput.value = true
  
  await nextTick() // Wait for input to mount
  
  inputRef.value.focus() // ✅ Input is now in the DOM
}
</script>

<template>
  <button @click="reveal">Show Input</button>
  <input v-if="showInput" ref="inputRef" />
</template>
```

## How nextTick Works

`nextTick` uses **microtasks** (same timing as `Promise.then()`) to schedule callbacks after the current event loop tick.

**Execution Order:**

```js
console.log('1. Synchronous')

setTimeout(() => console.log('4. setTimeout (macrotask)'), 0)

nextTick(() => console.log('2. nextTick (microtask)'))

Promise.resolve().then(() => console.log('3. Promise (microtask)'))
```

Output:
```
1. Synchronous
2. nextTick (microtask)
3. Promise (microtask)
4. setTimeout (macrotask)
```

Microtasks run **before** the next macrotask, so `nextTick` is faster than `setTimeout(fn, 0)`.

## Notes

**Two Ways to Use nextTick:**

```js
// 1. As a promise (recommended)
await nextTick()
doSomethingWithDOM()

// 2. As a callback
nextTick(() => {
  doSomethingWithDOM()
})
```

The promise version is cleaner and avoids callback nesting.

**Why Not setTimeout?**
`setTimeout(fn, 0)` works but:
1. It's slower (macrotask vs microtask)
2. Browsers enforce a minimum ~4ms delay
3. It's less explicit about intent

**Common Use Cases in Libraries:**
- **vue-router**: Waits for UI to update before scrolling to anchor links
- **VueUse's `until`**: Uses `nextTick` to stop watchers after conditions are met
- **Form libraries**: Process field transactions after array operations settle

**When You Don't Need nextTick:**
- Lifecycle hooks like `onMounted` — the DOM is already ready
- Inside `watch` callbacks when you're only working with reactive data, not DOM
- Anywhere you're not touching the DOM after state changes

**Batching Behavior:**
Vue batches all synchronous state changes and applies them in one DOM update. This is why multiple `count++` operations only trigger one re-render:

```js
count.value++ // 1
count.value++ // 2
count.value++ // 3
// DOM updates once, not three times
```

This pattern is essential for any code that needs to coordinate reactive state with real DOM manipulation. When in doubt: change state, await `nextTick()`, then touch the DOM.
