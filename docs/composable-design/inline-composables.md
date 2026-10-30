# Inline Composables

Refactoring within a component rather than extracting to a separate file. When a component's setup is getting large and hard to follow, you can group related logic into inline functions — composables that live in the same file.

## When to Use

- When a component's `<script setup>` is getting long and hard to scan
- When you want to group related logic before deciding if it's worth extracting
- As a stepping stone toward full extraction

## When Not to Use

- When the component is short. Wrapping a single `ref(false)` in `useModal()` adds a layer and saves nothing.
- When the groups depend heavily on each other. An inline composable only groups code visually; it does not isolate it, so tangled logic stays tangled. Untangle it first, or split the component (see [Hidden Components](../component-splitting/hidden-components.md)).

## Example

**Before** — everything dumped at the top level:

```ts
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

```ts
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

// Rename on destructure where generic names would be ambiguous in the component
const { items: cartItems, total: cartTotal, add: addToCart, remove: removeFromCart } = useCart()
const { user, isLoggedIn, login, logout } = useAuth()
const { isOpen: modalOpen, open: openModal, close: closeModal } = useModal()
```

## Notes

The component setup now reads like a table of contents. Each concern is grouped, named, and scannable. The template keeps using the same names as before (`addToCart`, `openModal`), so the refactor doesn't ripple into it. And when a piece of logic grows complex enough to warrant its own file, the extraction is trivial — just move the function.
