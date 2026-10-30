# Custom Directives for DOM Behavior Reuse

Directives are the right tool when you need to do something to the DOM that isn't about rendering — event listeners on elements you don't own, third party library initialization, focus management, intersection observation.

## When to Use

- DOM behavior you need on many elements across the app
- Third party library initialization on mount/unmount
- Event listeners, intersection observers, resize observers
- When a composable would be awkward because you need direct element access

## When Not to Use

- When a composable with a template ref works just as well. `useIntersectionObserver(target, cb)` or `onClickOutside(target, cb)` from VueUse are easier to type, test and combine with other state. VueUse also ships ready-made directives (`vOnClickOutside`, `vIntersectionObserver`).
- When the behaviour needs reactive state the component reads back. Directives are fire-and-forget DOM hooks; state belongs in a composable.
- On components: a directive on a component applies to its root element. On a component with several root elements it is ignored, with a warning.

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
import type { Directive } from 'vue'

type ClickOutsideElement = HTMLElement & {
  _clickOutside?: {
    callback: () => void
    handler: (event: PointerEvent) => void
  }
}

export const vClickOutside: Directive<ClickOutsideElement, () => void> = {
  mounted(el, binding) {
    const handler = (event: PointerEvent) => {
      if (!el.contains(event.target as Node)) {
        el._clickOutside?.callback()
      }
    }
    el._clickOutside = { callback: binding.value, handler }
    // pointerdown, not click: the click that opened this element must not close it again
    document.addEventListener('pointerdown', handler, { capture: true })
  },

  updated(el, binding) {
    // The listener stays; only swap the callback it calls
    if (el._clickOutside) el._clickOutside.callback = binding.value
  },

  unmounted(el) {
    if (!el._clickOutside) return
    document.removeEventListener('pointerdown', el._clickOutside.handler, { capture: true })
    delete el._clickOutside
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
import type { Directive } from 'vue'

type IntersectElement = HTMLElement & { _intersectObserver?: IntersectionObserver }

export const vIntersect: Directive<IntersectElement, (isVisible: boolean) => void, never, string> = {
  mounted(el, binding) {
    const observer = new IntersectionObserver(
      (entries) => {
        // Several entries can be queued for one element; the last one is the current state
        const latest = entries[entries.length - 1]
        if (latest) binding.value(latest.isIntersecting)
      },
      binding.arg ? { threshold: Number.parseFloat(binding.arg) } : {}
    )
    observer.observe(el)
    el._intersectObserver = observer
  },

  unmounted(el) {
    el._intersectObserver?.disconnect()
    delete el._intersectObserver
  }
}
```

```vue
<!-- Fire callback when 50% of element is visible -->
<div v-intersect:0.5="onVisible">...</div>
```

## Notes

The pattern of storing the handler on the element itself (`el._clickOutside`) is worth noting — it's how you maintain a reference to the exact function you added so you can remove it precisely in `unmounted`. Without this you'd create a new function reference each time and `removeEventListener` would silently fail. The `updated` hook runs on every update of the owning component, so it only swaps the callback instead of removing and re-adding the listener.

Click outside listens to `pointerdown` instead of `click` for a reason: Vue renders the dropdown in the same task as the click that opened it, so a `click` listener added in `mounted` can still receive that same click when it bubbles up to `document`, and close the dropdown immediately.

To use a directive, register it globally with `app.directive('click-outside', vClickOutside)`, or import it in `<script setup>`: any variable named `vSomething` is available as `v-something` in that template.

Directive hooks like `mounted` don't run during server-side rendering, which suits DOM-only behaviour. If a directive must affect the server-rendered HTML, add a `getSSRProps` hook ([Vue SSR guide](https://vuejs.org/guide/scaling-up/ssr.html#custom-directives)).
