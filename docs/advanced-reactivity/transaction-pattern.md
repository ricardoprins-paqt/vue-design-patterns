# Transaction Pattern

Queuing multiple state operations that happen in the same tick and processing them together once they've all settled. Combines operation queuing + `nextTick` + batch processing to handle scenarios where several changes need to be reconciled as a unit.

## When to Use

- Field arrays where one action triggers several add/remove/move operations
- Bulk operations on lists (select all, delete multiple, reorder)
- Any time `v-for` key changes make components unmount and mount in the same render, and their register/unregister logic must be reconciled together
- When you need the list of *operations* (not just the final state), for example to send one patch to the server

## When Not to Use

- If you only need to react to the final state, a `watch` already does this: Vue runs a watcher once per tick, no matter how many mutations happened in it.
- For bursts spread over time (typing, separate clicks, a drag that fires many events) `nextTick` doesn't help: every event is its own tick. Use debouncing or throttling.

## The Problem

Rapid state changes can cause race conditions or inconsistent intermediate states:

```vue
<script setup lang="ts">
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

Vue already batches the DOM update, so the user never *sees* those intermediate states. The problem is side effects: syncing after each operation sends three requests for one action.

In form libraries a harder version shows up: when `v-for` keys change, the field component for a path can unmount and a new one mount in the same render. Handling "unregister" and "register" one by one can wipe the field's value; processing them together once everything has settled avoids that.

## Solution

Queue operations and process them after `nextTick` when everything has settled:

### Basic Transaction Queue

```ts
import { nextTick } from 'vue'

interface Transaction {
  type: string
  payload: unknown
  timestamp: number
}

export function useTransactions() {
  // A plain array: the queue is internal bookkeeping, nothing renders it
  let transactionQueue: Transaction[] = []
  let processing = false
  
  function queueTransaction(operation: { type: string; payload: unknown }) {
    transactionQueue.push({
      type: operation.type,
      payload: operation.payload,
      timestamp: Date.now()
    })
    
    scheduleProcessing()
  }
  
  async function scheduleProcessing() {
    if (processing) return
    
    processing = true
    
    // Wait until the current tick's changes and the DOM update are done
    await nextTick()
    
    processTransactions()
    
    processing = false
  }
  
  function processTransactions() {
    const transactions = transactionQueue
    transactionQueue = []
    
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

```ts
// useFieldArray.ts
import { ref, nextTick } from 'vue'

export interface Field {
  id: number
  name: string
}

type FieldOperation =
  | { type: 'append'; field: Field }
  | { type: 'remove'; id: number }
  | { type: 'move'; from: number; to: number }

export function useFieldArray(initialFields: Field[] = []) {
  const fields = ref<Field[]>(initialFields)
  let pending: FieldOperation[] = []
  let processingScheduled = false
  
  function scheduleTransaction(operation: FieldOperation) {
    pending.push(operation)
    
    if (!processingScheduled) {
      processingScheduled = true
      nextTick(() => {
        processTransactions()
        processingScheduled = false
      })
    }
  }
  
  function processTransactions() {
    // All operations of this tick have settled: send them as one patch
    const operations = pending
    pending = []
    
    syncToServer(operations) // one request, in the order the user did them
  }
  
  function append(field: Field) {
    fields.value.push(field)
    scheduleTransaction({ type: 'append', field })
  }
  
  function remove(index: number) {
    const [removed] = fields.value.splice(index, 1)
    if (removed) scheduleTransaction({ type: 'remove', id: removed.id })
  }
  
  function move(fromIndex: number, toIndex: number) {
    const [field] = fields.value.splice(fromIndex, 1)
    if (!field) return
    fields.value.splice(toIndex, 0, field)
    scheduleTransaction({ type: 'move', from: fromIndex, to: toIndex })
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
<script setup lang="ts">
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
  
  // All three operations are queued in the same tick
  // nextTick() waits for them (and the DOM update) to settle
  // Then they are sent as a single batch
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

### When You Only Need the Final State

If you don't need the individual operations, skip the queue. A watcher already runs once per tick, after all synchronous mutations:

```ts
import { watch } from 'vue'

watch(fields, (list) => {
  syncOrder(list.map((field, position) => ({ id: field.id, position })))
}, { deep: true })

append(newField)
remove(0)
move(0, 1)
// → syncOrder runs once, with the final order
```

## Notes

**Why Not Process Immediately?**
Processing immediately would mean:
1. Multiple server requests for what should be one operation
2. Side effects acting on intermediate states that are meaningless
3. Race conditions if async operations overlap
4. Poor performance from repeated processing

**nextTick is the Key:**
`nextTick` ensures the transaction processing happens after:
1. All synchronous JavaScript of the current tick has run (all the `.splice()`, `.push()`, etc.)
2. Vue has updated the DOM, including components mounting and unmounting
3. Everything has "settled" into its final state

It only groups what happens in **one** tick. Operations from separate events are processed separately.

**Real-World Libraries:**
- **@formwerk/core** queues field state transactions (register, unregister, array mutations) and processes them in `nextTick` ([`useFormTransactions`](https://github.com/formwerkjs/formwerk/blob/main/packages/core/src/useForm/useFormTransactions.ts))
- That way a field that unmounts and a field that mounts for the same path in one render are reconciled together
- Fields keep their values when siblings are added, removed or reordered

**Debouncing vs Transaction Queue:**
- **Debouncing** delays execution until activity stops for a while, so it groups events spread over time
- **Transaction Queue** executes once at the end of the current tick, so it only groups operations that happen together
- Transactions are better when you need every operation captured, just processed together; debouncing when the burst spans several events

**Memory Considerations:**
If transactions can pile up (user keeps clicking rapidly), consider:
1. Max queue size
2. Time-based flushing
3. Deduplication of redundant operations

**Alternative: Immer-Style Producers:**
Instead of queuing operations, work on a draft copy and assign it once:

```ts
const draft = [...fields.value]
// Mutate draft
draft.splice(0, 1)
draft.push(newField)

fields.value = draft // Finalize: one change, one watcher run
```

This pattern transforms rapid-fire state changes into a single coherent update, making your app more predictable and your UX more stable.
