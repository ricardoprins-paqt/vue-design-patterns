# The MVC Triad

The three roles — [[Humble Components]], [[Thin Composables]], and [[Controller Components]] — map loosely to the View, Model, and Controller of MVC, adapted to Vue's way of thinking.

## The Problem

Most Vue apps start clean and slowly become a mess of components that fetch data, manage state, handle business logic, AND render UI all in one place:

```vue
<script setup>
// fetching data
const { data } = await useFetch('/api/cart')

// business logic
const total = computed(() => data.value.items.reduce(...))
const discounted = computed(() => total.value * (1 - discount.value))

// UI state
const isOpen = ref(false)
const activeTab = ref('items')

// side effects
watch(total, (val) => {
  if (val > 100) analytics.track('high-value-cart')
})

// form handling
const onSubmit = async () => { ... }
</script>
```

Everything is tangled together. Testing any one piece requires the whole component. Changing the discount logic means hunting through a 300-line component.

## The Solution

```
Thin Composable          Controller Component       Humble Components
(pure business logic) → (orchestrates & connects) → (renders UI)
    calculateTotal()         useCart()                 CartDisplay
    applyDiscount()          useAuth()                 CheckoutButton
    validateEmail()          handleCheckout()          DiscountInput
```

The triad gives you clear places for each concern:
- **Logic** lives in [[Thin Composables]]
- **Wiring** lives in [[Controller Components]]
- **Presentation** lives in [[Humble Components]]

## Why "Not-Quite-MVC"

Traditional MVC has the View directly observing the Model. In Vue's version, the Controller sits between them and the data flows reactively rather than through callbacks. It's the spirit of MVC applied to a reactive component system.

## Notes

You don't need all three layers everywhere. A simple static page just needs humble components. A form with local state might just need a composable. The triad is most valuable when business logic starts getting complex enough that you wish you could test it in isolation.
