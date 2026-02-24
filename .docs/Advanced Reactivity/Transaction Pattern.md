# Transaction Pattern

Queuing multiple rapid state operations and processing them together after they've all settled. Combines operation queuing + `nextTick` + batch processing to handle scenarios where state changes come in bursts and need to be reconciled as a unit.

## When to Use

- Field arrays where users can add/remove/reorder fields rapidly
- Drag-and-drop reordering that triggers multiple state changes
- Bulk operations on lists (select all, delete multiple, reorder)
- Any time `v-for` key changes could cause state corruption if processed immediately
- When you need to wait for a "stable" state before acting

## The Problem

Rapid state changes can cause race conditions or inconsistent intermediate states:

```vue
<script setup>
import { ref } from 'vue'

const fields = ref([
  { id: 1, value: 'First' },
  { id: 2, value: 'Second' },
  { id: 3, value: 'Third' }
])

function reorderFields() {
  fields.value.splice(0, 1) // Remove first
  fields.value.push({ id: 4, value: 'Fourth' }) // Add new
  fields.value.splice(1, 1) // Remove another
  
  // ❌ If we try to sync with a server here, which state do we send?
  // The intermediate states between these operations are meaningless
}
</script>
```

In form libraries, this gets worse — field components might unmount/remount as the array changes, losing focus and creating a bad UX.

## Solution

Queue operations and process them after `nextTick` when everything has settled:

### Basic Transaction Queue

```js
import { ref, nextTick } from 'vue'

export function useTransactions() {
  const transactionQueue = ref([])
  let processing = false
  
  function queueTransaction(operation) {
    transactionQueue.value.push({
      type: operation.type,
      payload: operation.payload,
      timestamp: Date.now()
    })
    
    scheduleProcessing()
  }
  
  async function scheduleProcessing() {
    if (processing) return
    
    processing = true
    
    // Wait for all DOM updates to complete
    await nextTick()
    
    processTransactions()
    
    processing = false
  }
  
  function processTransactions() {
    const transactions = [...transactionQueue.value]
    transactionQueue.value = []
    
    // Process all queued transactions as a single batch
    console.log(`Processing ${transactions.length} transactions`)
    
    // Your batch logic here — could be syncing to server,
    // updating derived state, or reconciling field positions
    transactions.forEach(tx => {
      console.log(`Execute: ${tx.type}`, tx.payload)
    })
  }
  
  return {
    queueTransaction
  }
}
```

### Form Field Array Example

A real-world use case from form libraries:

```js
// useFieldArray.js
import { ref, nextTick } from 'vue'

export function useFieldArray(initialFields = []) {
  const fields = ref(initialFields)
  const transactions = ref([])
  let processingScheduled = false
  
  function scheduleTransaction(type, payload) {
    transactions.value.push({ type, payload })
    
    if (!processingScheduled) {
      processingScheduled = true
      nextTick(() => {
        processTransactions()
        processingScheduled = false
      })
    }
  }
  
  function processTransactions() {
    // All operations have settled, now reconcile the final state
    const txs = [...transactions.value]
    transactions.value = []
    
    // Example: sync field positions with the server
    const fieldPositions = fields.value.map((f, idx) => ({
      id: f.id,
      position: idx
    }))
    
    console.log('Syncing final state:', fieldPositions)
    // syncToServer(fieldPositions)
  }
  
  function append(field) {
    fields.value.push(field)
    scheduleTransaction('append', { field })
  }
  
  function remove(index) {
    const removed = fields.value.splice(index, 1)[0]
    scheduleTransaction('remove', { field: removed })
  }
  
  function move(fromIndex, toIndex) {
    const [field] = fields.value.splice(fromIndex, 1)
    fields.value.splice(toIndex, 0, field)
    scheduleTransaction('move', { from: fromIndex, to: toIndex })
  }
  
  return {
    fields,
    append,
    remove,
    move
  }
}
```

Usage:

```vue
<script setup>
import { useFieldArray } from '@/composables/useFieldArray'

const { fields, append, remove, move } = useFieldArray([
  { id: 1, name: 'Field 1' },
  { id: 2, name: 'Field 2' }
])

function bulkOperation() {
  // User performs rapid operations
  append({ id: 3, name: 'Field 3' })
  remove(0)
  move(0, 1)
  
  // All operations are queued
  // nextTick() waits for DOM to settle
  // Then transactions are processed as a single batch
}
</script>

<template>
  <div v-for="(field, index) in fields" :key="field.id">
    <input v-model="field.name" />
    <button @click="remove(index)">Remove</button>
  </div>
  <button @click="append({ id: Date.now(), name: '' })">Add</button>
</template>
```

### Drag-and-Drop Example

```js
import { ref, nextTick } from 'vue'

export function useDragDropList(initialItems) {
  const items = ref(initialItems)
  const reorderQueue = ref([])
  
  function onDragEnd(fromIndex, toIndex) {
    // Move the item
    const [item] = items.value.splice(fromIndex, 1)
    items.value.splice(toIndex, 0, item)
    
    // Queue the reorder operation
    reorderQueue.value.push({ from: fromIndex, to: toIndex })
    
    // Schedule processing
    nextTick(() => {
      // All drag operations have settled
      const finalOrder = items.value.map((item, idx) => ({
        id: item.id,
        order: idx
      }))
      
      // Sync final order to server
      console.log('Final order:', finalOrder)
      
      reorderQueue.value = []
    })
  }
  
  return {
    items,
    onDragEnd
  }
}
```

## Notes

**Why Not Process Immediately?**
Processing immediately would mean:
1. Multiple server requests for what should be one operation
2. Intermediate states that are meaningless
3. Race conditions if async operations overlap
4. Poor performance from repeated processing

**nextTick is the Key:**
`nextTick` ensures the transaction processing happens after:
1. All synchronous JavaScript has run (all the `.splice()`, `.push()`, etc.)
2. Vue has updated the DOM
3. Everything has "settled" into its final state

**Real-World Libraries:**
- **@formwerk/core** uses this exact pattern for field array stability
- It allows the library to be resistant to rapid array operations
- Fields don't lose focus or state when siblings are added/removed

**Debouncing vs Transaction Queue:**
- **Debouncing** delays execution until activity stops
- **Transaction Queue** executes once after a burst of activity
- Transactions are better when you need every operation captured, just processed together

**Memory Considerations:**
If transactions can pile up (user keeps clicking rapidly), consider:
1. Max queue size
2. Time-based flushing
3. Deduplication of redundant operations

**Alternative: Immer-Style Producers:**
Instead of queuing operations, use a draft state that's finalized in `nextTick`:

```js
const draft = { ...fields.value }
// Mutate draft
draft.splice(0, 1)
draft.push(newField)

await nextTick()

fields.value = draft // Finalize
```

This pattern transforms rapid-fire state changes into a single coherent update, making your app more predictable and your UX more stable.
