# Inline Composables

Refactoring within a component rather than extracting to a separate file. When a component's setup is getting large and hard to follow, you can group related logic into inline functions — composables that live in the same file.

## When to Use

- When a component's `<script setup>` is getting long and hard to scan
- When you want to group related logic before deciding if it's worth extracting
- As a stepping stone toward full extraction

## Example

**Before** — everything dumped at the top level:

```js
const cartItems = ref([])
const cartTotal = computed(...)
const addToCart = () => ...
const removeFromCart = () => ...

const user = ref(null)
const isLoggedIn = computed(...)
const login = () => ...
const logout = () => ...

const modalOpen = ref(false)
const openModal = () => ...
const closeModal = () => ...
```

**After** — inline composables create clear boundaries:

```js
function useCart() {
  const items = ref([])
  const total = computed(...)
  const add = () => ...
  const remove = () => ...
  return { items, total, add, remove }
}

function useAuth() {
  const user = ref(null)
  const isLoggedIn = computed(...)
  const login = () => ...
  const logout = () => ...
  return { user, isLoggedIn, login, logout }
}

function useModal() {
  const isOpen = ref(false)
  const open = () => isOpen.value = true
  const close = () => isOpen.value = false
  return { isOpen, open, close }
}

const { items, total, add, remove } = useCart()
const { user, isLoggedIn, login } = useAuth()
const { isOpen, open, close } = useModal()
```

## Notes

The component setup now reads like a table of contents. Each concern is grouped, named, and scannable. And when a piece of logic grows complex enough to warrant its own file, the extraction is trivial — just move the function.
