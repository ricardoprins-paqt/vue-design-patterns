# Custom Directives for DOM Behavior Reuse

Directives are the right tool when you need to do something to the DOM that isn't about rendering — event listeners on elements you don't own, third party library initialization, focus management, intersection observation.

## When to Use

- DOM behavior you need on many elements across the app
- Third party library initialization on mount/unmount
- Event listeners, intersection observers, resize observers
- When a composable would be awkward because you need direct element access

## Examples

### Auto-Animate Integration

```ts
// directives/vAutoAnimate.ts
import autoAnimate from '@formkit/auto-animate'
import type { Directive } from 'vue'

export const vAutoAnimate: Directive = {
  mounted(el, binding) {
    autoAnimate(el, binding.value ?? {})
  }
}

// Usage: <ul v-auto-animate> or <ul v-auto-animate="{ duration: 200 }">
```

### Click Outside

A more complex directive that manages its own cleanup:

```ts
// directives/vClickOutside.ts
import type { Directive, DirectiveBinding } from 'vue'

type ClickOutsideElement = HTMLElement & {
  _clickOutsideHandler?: (e: MouseEvent) => void
}

export const vClickOutside: Directive = {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding<() => void>) {
    el._clickOutsideHandler = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutsideHandler)
  },

  updated(el: ClickOutsideElement, binding: DirectiveBinding<() => void>) {
    // Remove the old listener before replacing the handler
    document.removeEventListener('click', el._clickOutsideHandler!)
    el._clickOutsideHandler = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutsideHandler)
  },

  unmounted(el: ClickOutsideElement) {
    document.removeEventListener('click', el._clickOutsideHandler!)
    delete el._clickOutsideHandler
  }
}
```

```vue
<div v-click-outside="closeDropdown">
  <DropdownMenu />
</div>
```

### Intersection Observer

```ts
// directives/vIntersect.ts
export const vIntersect: Directive = {
  mounted(el, binding) {
    const observer = new IntersectionObserver(
      (entries) => binding.value(entries[0].isIntersecting),
      binding.arg ? { threshold: parseFloat(binding.arg) } : {}
    )
    observer.observe(el)
    el._intersectObserver = observer
  },

  unmounted(el) {
    el._intersectObserver?.disconnect()
  }
}
```

```vue
<!-- Fire callback when 50% of element is visible -->
<div v-intersect:0.5="onVisible">...</div>
```

## Notes

The pattern of storing the handler on the element itself (`el._clickOutsideHandler`) is worth noting — it's how you maintain a reference to the exact function you added so you can remove it precisely in `unmounted`. Without this you'd create a new function reference each time and `removeEventListener` would silently fail.
