# Review of all pattern pages (October 2026)

Every one of the 52 pages was read in full and checked against Vue 3.5, Vue Router, Pinia, Nuxt 4 and TypeScript 5.9
(strict). How it was done:

1. One reviewer per category read every page and listed findings with file and line.
2. Each finding was then verified, by running the code (vue-tsc in strict mode, vitest with happy-dom) or against
   the Vue, Vue Router and Nuxt docs and sources. Findings that turned out to be wrong are listed as **Dropped**.
3. Confirmed findings were fixed in place, keeping each page's voice and structure. Findings that are true but not
   worth a change are listed as **Left**, with the reason.

## Summary

| Category | Fixed | Dropped | Left |
|---|---|---|---|
| Component API Design | 31 | 1 | 1 |
| State Sharing | 14 | 2 | 0 |
| Architectural Patterns | 20 | 2 | 0 |
| Component Splitting | 11 | 2 | 4 |
| Composable Design | 25 | 0 | 2 |
| Async and Data Fetching | 20 | 0 | 0 |
| Advanced Reactivity | 29 | 1 | 2 |
| Form Patterns | 24 | 0 | 0 |
| Performance Patterns | 20 | 0 | 1 |
| Plugin & Library Patterns | 18 | 3 | 1 |
| **Total** | **212** | **11** | **11** |

Counts are entries below; some entries group a few small related fixes on the same page.

### What changed across the site

- **Code examples are TypeScript and complete enough to compile**: `lang="ts"` on every `<script setup>` that uses
  type-based `defineProps`/`defineEmits` (several did not compile), the imports a reader needs, typed refs
  (`ref<User | null>(null)` instead of `ref(null)`).
- **Wrong or outdated claims corrected**, for example: `watch()` on a destructured prop is a compile error in 3.5
  (the page said it works), `onErrorCaptured` does catch async setup errors under `<Suspense>`, `<KeepAlive>` must
  wrap the `RouterView` slot, `defineModel` is built on `customRef`, a chain of `filter`/`sort` computeds does not
  reuse the sorted cache when the filter changes.
- **Bugs fixed** in examples that did not do what the text said: the awaitable `useAsyncData` resolved to
  `undefined`, the optimistic UI rollback could restore a never-saved value, aborted requests reset `pending`, the
  mini store's `effectScope` died with the first component, schema forms could never submit after one error,
  compound tabs could never show a panel, `useCart` did not return `removeItem`.
- **SSR**: module-level state now carries a one-line warning that links to the Singleton Composable page; the SSR
  caching examples use Nitro caching instead of a per-server cache shared between users.
- **"When Not to Use" sections** were added where a page only said when to use a pattern, each with the simpler
  alternative.

### Not verified

- The Adapter Pattern snippets use PrimeVue and Nuxt UI, which were not installed; they were checked by reading only.
- The `pointerdown` reasoning in the click-outside directive follows the DOM event spec; happy-dom cannot reproduce
  the original `click` problem, so it was not tested.

The findings per page follow, in the order of the site sidebar.

## Component API Design

Checks: a scratch project (vue-tsc strict + vitest/happy-dom, 6 tests passing for Tabs/TabPanel, BaseButton, Toggle, BaseInput, allowlist button, Lifting State) and `@vue/compiler-sfc` for the destructured-prop watch.

### reactive-props-destructuring.md
- **Fixed** (bug, high): `watch(count, ...)` on a 3.5 destructured prop was shown as working and the caveat said "the compiler auto-wraps it for watch". It is a compile error ("count is a destructured prop and should not be passed directly to watch()"). -> `watch(() => count, ...)` and the caveat rewritten: the compiler rewrites access to `props.count`, so passing `count` passes a value; watch and composables both need a getter. Evidence: ran `compileScript`; https://vuejs.org/guide/components/props.html#passing-destructured-props-into-functions
- **Fixed** (bug, medium): duplicate `const userId` (l.46-48) and duplicate `const { user }` (route example) -> second variant turned into a comment.
- **Fixed** (bug, low): pre-3.5 "problem" snippet called `watch(count)` with a plain number (invalid source, warns) -> `watch(() => count)` which shows the real problem (never fires). `<script setup>` with type-based `defineProps` -> `lang="ts"`, missing `watch`/`toRef` imports added.
- **Fixed** (outdated, low): "Vue 3.5+: just use a getter" for route params -> getters work since 3.3 with MaybeRefOrGetter; `route.params.id` (string | string[]) wrapped in `String()`.
- **Fixed** (missing judgement): added When Not to Use (3.5+, one prop -> toRef/getter, template-only use).

### adapter-pattern.md
- **Fixed** (bug, medium): `import { Button } from 'primevue/button'` -> default imports, as the page's own example does (PrimeVue components are default exports).
- **Fixed** (inconsistency, medium): Nuxt UI version dropped `variant`, so "every component continues to work" was false -> same props and class mapping as the PrimeVue version (`label`, `loading`, `disabled` are UButton props).
- **Fixed** (improvement, medium): Notes said the adapter is "intentionally not transparent", but attributes still fall through to the library root -> note on `inheritAttrs: false` with a link to Attribute Routing.
- **Fixed**: props/emits typed (`variant?: 'primary' | 'secondary'`, `Record<Tone, string>` map instead of a runtime validator).
- **Fixed** (missing judgement): When Not to Use (small projects, complex components where the adapter mirrors the whole API, need for full passthrough -> Transparent Wrapper). The old closing line "for one-off uses..." moved there.

### attribute-routing.md
- **Fixed** (wrong statement, medium): "`@change` falls through to the div and is wasted" is wrong, `change` bubbles so the listener still fires -> example uses `@blur` (doesn't bubble), with a sentence on why bubbling hides the problem.
- **Fixed** (bug, medium): multi-root example used `label` and `hint` without declaring them (they'd land in `$attrs` and on the `<input>`) -> `defineProps`.
- **Fixed** (wrong statement, medium): "without `inheritAttrs: false` Vue emits a warning" on multi-root. Ran it: binding `$attrs` on one root gives no warning; the warning only appears when `$attrs` isn't bound anywhere. -> text corrected, `defineOptions` removed from that example. https://vuejs.org/guide/components/attrs.html#attribute-inheritance-on-multiple-root-nodes
- **Fixed** (bug, medium): the allowlist dropped `onClick`, so a consumer's `@click` silently did nothing (ran: 0 calls) -> allowlist includes `onClick`, comment explains listeners are attrs; implemented with a typed `Set` filter (the destructuring version fails vue-tsc once `onClick` is added).
- **Fixed** (wrong statement, low): "Safe/Unsafe fallthrough" listed CSS properties (`margin`, `z-index`, `padding`) as attributes -> rewritten in terms of `class`/`style` usage; non-bubbling listeners named.
- **Fixed** (missing judgement): When Not to Use.
- **Dropped**: "computed over `useAttrs()` goes stale". Ran it: the computed updates when the parent changes an attribute (the attrs proxy is tracked).
- **Left**: "allowlist claim vs binding order": the allowlist does keep `type="button"` (ran: type stays `button`); wording kept.

### compound-components.md
- **Fixed** (bug, high): `registerTab` was a stub returning nothing, so `activeTab === id` could never be true and no panel ever showed; tab headers were "render somehow". -> working minimal implementation (typed `InjectionKey`, `useId`, tab buttons rendered from registrations, first tab active), ran: switching works.
- **Fixed** (inconsistency, medium): string injection key `'tabs-context'` while Typed Provide/Inject recommends `InjectionKey` -> typed key + link; missing-provider error.
- **Fixed** (improvement, medium): no accessibility -> `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`; note that keyboard navigation and unregistering are left out.
- **Fixed** (missing judgement): When Not to Use (data-driven items -> `items` prop; headless libraries for production a11y). Rule of thumb refined ("with its own content").

### polymorphic-components.md
- **Fixed** (bug, medium): `type: [String, Object]` rejects functional components (ran: "Invalid prop: type check failed") -> type-based `as?: string | Component`, which also allows functions.
- **Fixed** (improvement, medium): default `<button>` had no `type` and submits forms -> `:type="as === 'button' ? 'button' : undefined"` (ran: consumer `type="submit"` still wins, `<a>` gets no type).
- **Fixed** (improvement, low): redundant `v-bind="$attrs"` removed (ran: harmless, single root forwards anyway) with a sentence why.
- **Fixed**: When Not to Use (two variants, TS checking of element attributes) and an accessibility note.

### renderless-components.md
- **Fixed** (inconsistency, medium): the Toggle example is pure state, which the page's own Notes say belongs in a composable -> slot now also hands out `triggerAttrs`/`contentAttrs` (`aria-expanded`, `aria-controls`, id via `useId`), which is the part a composable can't give; Notes point to `useToggle` for state-only cases.
- **Fixed** (improvement): typed with `defineSlots`, `lang="ts"`, destructured prop default. Ran: aria attributes update on toggle.

### transparent-wrapper-components.md
- **Fixed** (bug, medium): `useAttrs` used without import; `lang="ts"`, `defineModel<string>()`.
- **Fixed** (improvement, medium): label not linked to the input -> `useId()`, `for`/`id`, error linked via `aria-describedby` (ran).
- **Fixed** (inconsistency, low): "These four component API design patterns" (category has seven) -> "These component API design patterns".
- **Fixed** (improvement, low): `class` landing on the input is now stated as a choice, with a link to Attribute Routing for the split; one line on `v-model` modifiers (`defineModel` returns them).
- **Fixed**: When Not to Use (wrapper adds nothing; limited API -> Adapter).

## State Sharing

### composable-context-pattern.md
- **Fixed** (bug, medium): `Ref` used in the interface but not imported.
- **Fixed** (inconsistency, medium): intro said the pattern combines Singleton + provide/inject "into a single composable that behaves as both provider and consumer"; the code has no singleton and two functions. Intro now describes a provider/consumer pair in one module, scoped per provider (two forms don't share state).
- **Fixed** (missing judgement, medium): explained that the providing component can't `inject` its own `provide` (why `provideForm()` returns the context); "When Not to Use"; mention of VueUse `createInjectionState`.
- **Fixed** (low): SFC snippets now `lang="ts"` with imports; context typed `Readonly<Ref<...>>` so consumers can't assign at type level.
- **Dropped**: "`readonly(errors)` may not type-check as `Ref<Record<…>>`" — it does (ran vue-tsc on the original interface).

### mini-store-with-effectscope.md
- **Fixed** (bug, high): `effectScope()` was not detached. If the store is first created in a component's setup, its scope is a child of that component's scope and its watchers stop on unmount, while other components still use it. Now `effectScope(true)` with an explanation. Evidence: ran a vitest: non-detached scope, after unmount the watcher fires 0 times; detached, 1 time (computeds keep working in 3.5 either way).
- **Fixed** (wrong statement, medium): "watchers would leak" while the example has none; note now says which watchers it is about (e.g. persisting to localStorage).
- **Fixed** (missing judgement, low): "When Not to Use" (Pinia, VueUse createGlobalState), stale references after dispose, SSR note.
- **Fixed** (low): converted to typed TS (`CartStore` interface, `??=`), Pinia internals sentence made precise.

### singleton-composable.md
- **Fixed** (bug, low): missing imports for `ref`/`computed`/`readonly` and `authService`; `ref(null)` typed `Ref<null>`. Now typed TS with `ref<User | null>(null)`.
- **Fixed** (wrong statement, medium): "readonly is the same principle as Pinia's store pattern" — Pinia state is writable from outside by default. Reworded.
- **Fixed** (low): "Nuxt 3" -> "Nuxt"; added "When Not to Use" (SSR, scoped state, many stores / devtools / tests -> Pinia) and the test-isolation caveat.

### typed-provide-inject.md
- **Fixed** (inconsistency, medium): provided a writable ref, while sibling pages stress readonly. Now `readonly(theme)` with key typed `Readonly<Ref<Theme>>`.
- **Fixed** (bug, low): `injectStrict` snippet lacked `inject`/`InjectionKey` imports.
- **Fixed** (improvement, low): vague VueUse claim replaced by Vue Router / Pinia (which really use InjectionKey symbols); `app.provide` mentioned; "When Not to Use" linking to Composable Context Pattern.
- **Dropped**: "`inject(key, fallback)` with optional fallback is a strict-mode type error" — vue-tsc accepts it. Passing `undefined` explicitly does skip Vue's "injection not found" warning, but the helper throws its own error, so nothing is lost.

## Architectural Patterns

### thin-composables.md
- **Fixed** (bug, high): text says to unit test `calculateTotal`/`applyDiscount`, but they were not exported -> split into `cart.ts` (exported pure functions) and `useCart.ts`. Ran: vitest on the pure functions passes.
- **Fixed** (bug, medium): `discounts[code] ?? 0` on a plain object finds `Object.prototype` keys; code `constructor` gave `NaN` (ran in node) -> `Map` lookup, note explains why.
- **Fixed** (inconsistency, medium): `useCart` returned no `removeItem` that the controller page uses -> added `removeItem(id)`.
- **Fixed** (improvement, medium): plain JS with an `import` in the middle of the file -> typed TS (`CartItem`), imports at the top. vue-tsc clean.
- **Fixed** (missing judgement, medium): added `## When Not to Use`.
- **Fixed** (improvement, low): one-line note that real money should be calculated in cents.

### humble-components.md
- **Fixed** (bug, high): `<script setup>` without `lang="ts"` but typed `defineProps<>()` -> compile error (ran @vue/compiler-sfc: "Unexpected token") -> `lang="ts"`.
- **Fixed** (improvement, medium): `disabled` required -> optional with a destructure default; `type="button"`.
- **Fixed** (missing judgement, medium): "any presentation component" / "no awareness" too absolute -> local UI state allowed, `## When Not to Use` added.
- **Fixed** (inconsistency, low): controller uses `<DiscountInput v-model>` but no humble `v-model` shown -> added a `defineModel` example.
- **Fixed** (improvement, low): one line that accessibility belongs in the humble component.
- **Dropped**: "re-emitting click loses the native event". Emitting intent instead of the DOM event is the point of the pattern.

### controller-components.md
- **Fixed** (bug, high): `removeItem` destructured from `useCart()` but never returned -> now returned by the thin composable (see above).
- **Fixed** (bug, medium): no imports, `lang="ts"` missing, `user.value.id` on a possibly null user, no submitting state -> typed example with imports, null guard, `isSubmitting` with `try/finally`. vue-tsc clean (ran with CartDisplay, DiscountInput, CheckoutButton stand-ins).
- **Fixed** (missing judgement, high): added `## When Not to Use` (small pages; provide/inject or Pinia instead of a prop relay).
- **Fixed** (inconsistency, medium): "just wiring" vs a service call -> intro says "wiring and orchestration".
- **Fixed** (improvement, low): one line that `CartDisplay` emits `remove-item` with the id.
- **Dropped**: `:disabled="items.length === 0"` as "presentation logic". Deciding when checkout is allowed is controller work.

### the-mvc-triad.md
- **Fixed** (inconsistency, medium): diagram put `useCart()`/`useAuth()` in the Controller column -> composables in the Thin Composables column, `CartController.vue` / `handleCheckout()` as the controller.
- **Fixed** (inconsistency, medium): "reactively rather than through callbacks" contradicted props down / events up -> rewritten.
- **Fixed** (missing judgement, medium): cost of three layers, and where UI-only state lives, added to Notes.
- **Fixed** (improvement, low): problem snippet marked as Nuxt `useFetch`, `lang="ts"`; one line that this is the site's own loose use of "MVC".

## Component Splitting

### combine-branches.md
- **Fixed** (improvement, low): `state`, `error`, `data`, `retry` came from nowhere -> short `<script setup lang="ts">` with a composable.
- **Fixed** (improvement, low): string `state` allows impossible combinations -> note on a discriminated union, link to Reactive State Machine; caveat links When Not to Split.
- **Dropped**: "dropping the wrapper `<div>` breaks attribute fallthrough". A `v-if`/`v-else` chain is a single root, so attributes go to the rendered branch; nothing breaks.
- **Left**: `<Suspense>`/`onErrorCaptured` as alternatives: out of scope for a splitting page (covered in Error Boundaries).

### hidden-components.md
- **Fixed** (inconsistency, medium): text says `isFollowing` moves with the profile but the After never showed it -> `UserProfile.vue` snippet owning `isFollowing`.
- **Fixed** (a11y, low): `<img>` without `alt` -> `alt=""` (decorative, the name is right next to it).
- **Left**: "nuance contradicts Combine Branches": it doesn't; Combine Branches extracts branches that have their own identity, the nuance is about fragments without one.

### lifting-state.md
- **Fixed** (bug, medium): `ref` used without import; `lang="ts"`, typed `Filters`.
- **Fixed** (improvement, medium): `v-model:filters` relied on an unshown child that would have to mutate the parent's object -> one `v-model` per field and a `FilterPanel.vue` with `defineModel` (ran: both fields update the parent).
- **Fixed** (low): link to Typed Provide/Inject as the next step.
- **Dropped**: SSR caveat. Lifted state lives in a component instance, not module scope, so it is per request.

### strategy-pattern.md
- **Fixed** (missing judgement, medium): When Not to Use (3-4 stable branches; variants with different props/events lose type checking with `<component :is>`).
- **Fixed** (improvement, medium): untyped lookup -> `Record<PaymentMethod, Component>` in `<script setup lang="ts">` (vue-tsc clean); guard for keys from outside; keep the map a plain constant (link markRaw page); `defineAsyncComponent` values (link Granular Code Splitting).
- **Fixed** (overclaim, low): "never touch the template ... clean forever" softened to what's true.
- **Left**: "really a dispatch table, not classic Strategy": the name is the author's choice and common in the Vue community. "receive it as a prop" example: fine as a one-line pointer.

### when-not-to-split.md
- **Fixed** (inconsistency, medium): "small, focused, and only used in one place" contradicted Hidden Components (extract named/stateful sections even when used once) -> "has no state or logic of its own", with a link.
- **Left**: "8+ props" threshold (it's presented as a heuristic), no code example, only costs listed (that's the page's purpose).

## Composable Design

### composing-composables.md
- **Fixed** (bug, high): text says `x`/`y` may be hardcoded values, but the code read `x.value`, so a number gave `undefined`. Now `MaybeRefOrGetter` + `toValue()`, which also makes the closing note about `MaybeRefOrGetter` true. Evidence: ran `useElementUnderMouse(100, () => 200)` through vue-tsc.
- **Fixed** (improvement, low): code is now typed TS with imports; note that `document` is client-only and that `element` doesn't update when the DOM changes under a still mouse.
- **Fixed** (missing judgement, medium): added "When Not to Use" (pieces always used together; calling a composable internally is normal composition).
- **Left**: listener cleanup in `useMousePosition` stays a `// ...` comment (now says add/remove in onMounted/onUnmounted); full listener code would distract from the point.

### dynamic-return-pattern.md
- **Fixed** (bug, high): the thenable resolved to `undefined` (`.then`/`.catch` returned nothing), so `const { data } = await useAsyncData(...)` threw; `promise.data = ...` didn't type-check. Now resolves to the state and uses `Object.assign(promise, state)`, generic and typed. Evidence: ran a vitest (await, non-await and rejection paths pass) and vue-tsc.
- **Fixed** (inconsistency, medium): the "basic form" was not a dynamic return. Added a real dynamic return (`useTimestamp()` returns a ref, `{ controls: true }` returns ref + pause/resume) with TS overloads, like VueUse's `useNow`. Kept the thenable as "Awaitable Return".
- **Fixed** (wrong statement, medium): "the exact pattern Nuxt uses internally" -> "Nuxt's useFetch/useAsyncData work this way; a simplified version".
- **Fixed** (outdated, medium): note that top-level `await` needs `<Suspense>` (still experimental) outside Nuxt. https://vuejs.org/guide/built-ins/suspense.html
- **Fixed** (bug, medium): `window.innerWidth` at setup crashes in SSR; now read in `onMounted`, with resize listener and cleanup.
- **Fixed** (missing judgement): "When Not to Use" + note that the awaitable never rejects.

### inline-composables.md
- **Fixed** (inconsistency, low): destructuring `add`, `remove`, `open`, `close` lost the meaningful names the "before" code had, and `logout` was silently dropped. Now renamed on destructure (`add: addToCart`) and `logout` kept.
- **Fixed** (missing judgement, medium): "When Not to Use" (short components; inline composables group but don't isolate).
- **Left**: `computed(...)` placeholders; deliberately partial snippets.

### maybereforgetter.md
- **Fixed** (bug, medium): full example used `isRef` and `Ref` without importing them (runtime error for `isRef`). The full example is rewritten (below), and the helper snippet now has its imports.
- **Fixed** (bug, medium): `ref(null)` is `Ref<null>`, so assigning a product fails in strict TS. Now `ref<Product | null>(null)` and `ref<unknown>(null)` for errors. Evidence: vue-tsc.
- **Fixed** (bug, medium): `useProduct(() => route.params.id)` passed `string | string[]` to a `number`; now `Number(route.params.id)`. Usage SFC lacked `lang="ts"` while using `defineProps<>()`.
- **Fixed** (improvement, medium): full example now watches `() => toValue(id)` with `immediate: true` (no type guard needed, a static value never re-fires) and uses `onWatcherCleanup` (3.5+) to drop stale responses; links to Race Condition Handling. https://vuejs.org/api/reactivity-core.html#onwatchercleanup
- **Fixed** (inconsistency, medium): steps 2-3 fetch in `onMounted`, full example during setup; now explained (immediate also runs during SSR without awaiting; in Nuxt use useAsyncData/useFetch).
- **Fixed** (low): `MaybeRefOrGetter` imported as a type; type guard includes `ComputedRef`; JS-tagged TS blocks retagged; pre-3.3 note now also defines `toValue()` (also 3.3+); "industry standard" toned down; note about 3.5 reactive props destructure (`() => id`).
- **Fixed** (missing judgement): "When Not to Use".

### options-object-pattern.md
- **Fixed** (wrong statement, medium): the page used VueUse's real `useRefHistory` name with options it doesn't have (`debounce`, `eventFilter: 'click'`, `flush: false`) and an invented positional signature. Now a made-up `useUndoHistory` with consistent options, and a link to the real `useRefHistory`. https://vueuse.org/core/useRefHistory/
- **Fixed** (inconsistency, low): implementation now destructures every option the call passes; added a typed, documented options interface.
- **Fixed** (missing judgement, medium): "When Not to Use" (one or two obvious args; keep required args positional) + note on reactive options via MaybeRefOrGetter.

### reactivity-boundary-pattern.md
- **Fixed** (missing judgement, high): `toRaw` inside a computed makes it stale on in-place mutation, and the page sold it as free. Added the "replace, don't mutate" contract and the escape-hatch warning. Evidence: ran a vitest: after `data.value.items.push(3)` the computed still returns 2. https://vuejs.org/api/reactivity-advanced.html#toraw
- **Fixed** (missing judgement, medium): `shallowRef` / `shallowReactive` now named as the usual alternative ("When Not to Use"), with links to the performance pages.
- **Fixed** (wrong statement, low): comment "runs outside Vue's tracking system" -> runs inside the computed but reads a non-proxy; intro claim of "unnecessary re-renders" made accurate.
- **Fixed** (inconsistency, low): parameter typed `Ref<Dataset>`; Notes now explain how `toRaw` and `markRaw` differ instead of calling them "the same idea"; why class instances break in a proxy.

## Async and Data Fetching

### async-composable.md
- **Fixed** (bug, medium): `pending` starts `false` and `execute` runs in `onMounted`, so the first render mounted `UserCard` with `user = null` -> last branch is `v-else-if="data"`, with an explanation. Note added that `onMounted` never runs on the server.
- **Fixed** (bug, medium): `watch(source, execute)` forwards `(newValue, oldValue, onCleanup)` into `execute(...args)` and so into the fetcher -> `watch(source, () => execute(), ...)` with a comment.
- **Fixed** (missing judgement, medium): `useAsyncWatch` has the race condition the next page describes -> explicit warning linking Race Condition Handling (kept the base composable simple on purpose).
- **Fixed** (improvement, low): errors are stored, so Error Boundaries never see them -> note on when to rethrow.
- **Fixed** (improvement): generic TS (`useAsync<T, Args>`, `shallowRef` for data/error, typed props); `## When Not to Use` (Nuxt: useFetch/useAsyncData; shared server state: TanStack Query / Pinia Colada). Type-checked.

### error-boundaries.md
- **Fixed** (wrong statement, high): the page said `onErrorCaptured` does not catch errors from async setup under Suspense unless re-thrown. Evidence: ran a vitest: a rejected async setup inside `<Suspense>` reaches the ancestor's `onErrorCaptured` and the fallback renders -> rewritten as "let errors reach the boundary", plus what `onErrorCaptured` does and does not catch.
- **Fixed** (outdated, medium): Nuxt note missed `<NuxtErrorBoundary>` (https://nuxt.com/docs/4.x/api/components/nuxt-error-boundary) -> added with its `#error="{ error, clearError }"` slot.
- **Fixed** (outdated, medium): Suspense is still experimental (https://vuejs.org/guide/built-ins/suspense.html) -> note.
- **Fixed** (missing judgement, medium): `return false` keeps the error from `app.config.errorHandler` (monitoring) -> `reportError(e)` in the boundary + note.
- **Fixed** (inconsistency, low): intro promised `defineAsyncComponent` retry, never shown -> note on its `errorComponent`/`timeout`/`onError(error, retry, fail, attempts)` options.
- **Fixed** (improvement, low): `reset` explained (remounts the subtree, async setup runs again); TS `<script setup lang="ts">` with imports and `shallowRef<Error | null>`.

### optimistic-ui.md
- **Fixed** (bug, high): the version-counter fix rolls back to an unsaved optimistic value when two overlapping updates both fail. Evidence: ran a vitest of both scenarios -> replaced by "last confirmed value + only the latest update rolls back"; tests pass for two failures (back to original) and success-then-failure (shows first).
- **Fixed** (bug, medium): `useOptimistic(props.post)` copies the prop once -> note (watch the prop or key the component).
- **Fixed** (improvement, low): the rethrown error was never handled in `toggleLike` -> try/catch with user feedback. (Lead said "uncaught": partly wrong, Vue sends rejected handler promises to `app.config.errorHandler`, but the user got no feedback.)
- **Fixed** (missing judgement, medium): `## When Not to Use` (server decides result, irreversible actions, fast requests); note that neither version controls server-side ordering; Nuxt `refresh()` approach. TS generics.

### race-condition-handling.md
- **Fixed** (bug, high): the aborted run's `finally` set `pending = false` while the newer request was loading -> only a non-aborted run resets `pending`.
- **Fixed** (bug, medium): "only the latest request can write" was only true if `fetchUser` honours `signal` -> `signal.aborted` check after the `await`; note to pass the signal through every layer.
- **Fixed** (improvement, medium): no error state, and `throw e` inside a watcher only reaches the global error handler -> `error` ref.
- **Fixed** (outdated, low): `onWatcherCleanup` is Vue 3.5+ -> note with the `onCleanup` argument for older versions (https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup).
- **Fixed** (outdated, low): Nuxt note -> `useAsyncData` passes an `AbortSignal` to its handler and cancels with the default `dedupe: 'cancel'` (https://nuxt.com/docs/4.x/api/composables/use-async-data). TS types; type-checked.

## Advanced Reactivity

All code blocks on these pages are now TypeScript (`ts` / `<script setup lang="ts">`) with imports, and type-checked
with vue-tsc (Vue 3.5.44, TS 5.9 strict). Runtime claims were checked with vitest (happy-dom, vue/server-renderer).

### computed-as-interceptor.md
- **Fixed** (outdated, high): text said a `watch` in SSR runs "too late". In SSR, watchers created in component setup never run unless `immediate` or `flush: 'sync'`. Rewrote the problem text, the SSR note and the comparison table. Evidence: ran `renderToString` with a default and a `flush: 'sync'` watcher; only the sync one fired. Source: runtime-core `doWatch` (`isInSSRComponentSetup` branch).
- **Fixed** (missing judgement, high): `watch(..., { flush: 'sync' })` was never mentioned as the built-in alternative. Added a "When Not to Use" section and a table row.
- **Fixed** (wrong, medium): "Must always update `innerRef.value` or create infinite loop". Not writing just drops the value (which is what the validation example relies on). Reworded.
- **Fixed** (bug, medium): the usage comment said later requests use the cached value, but the code always refetched. Added `if (categories.value.length === 0)`.
- **Fixed** (missing, medium): the server cache is module-level and shared by all requests/users, and the client never receives the value. Added a note with a link to Singleton Composable and Cached Ref Pattern.
- **Fixed** (TS): generic typed versions of all three composables (`ref(x) as Ref<T>`).

### custom-ref.md
- **Fixed** (bug, medium): `customRef` was not imported; added imports and generic types. The debounced ref now keeps its own `value` instead of reassigning the parameter.
- **Fixed** (missing, medium): a debounced `customRef` with `v-model` loses typed text when anything re-renders the component during the delay. Evidence: ran a vitest with `@vue/test-utils` (focused input, unrelated re-render → input reset to ''). Added a warning.
- **Fixed** (missing judgement): added "When Not to Use" (VueUse `refDebounced`/`watchDebounced`, Writable Computed).

### nexttick-timing.md
- **Fixed** (missing judgement, high): `watch(..., { flush: 'post' })` / `watchPostEffect` is the idiomatic fix for the watcher example and was not mentioned. Added after Example 2 and in "When You Don't Need nextTick".
- **Fixed** (TS): `ref(null)` template refs typed as `Ref<null>` broke under TS; switched to `useTemplateRef<HTMLElement>()` (Vue 3.5) with optional chaining.
- **Fixed** (wrong, low): "Browsers enforce a minimum ~4ms delay" applies to nested timers only; reworded.
- **Fixed** (unsourced, low): "Form libraries" claim now names formwerk with a link.
- **Dropped**: "VueUse `until` claim has no source". Checked: VueUse `until` calls `nextTick(() => stop())` when the condition already matches. Claim is correct.
- **Left**: vue-router claim. Correct: the router awaits `nextTick()` before calling `scrollBehavior`.

### pausing-and-resuming-watchers.md
- **Fixed** (bug, high): `importData` saved twice — the manual save, and again when `resume()` replays the paused change. Evidence: vitest, `save` called 2 times. Removed the manual save, explained the resume behaviour.
- **Fixed** (bug, medium): no `try/finally`, so a failing import left auto-save paused. Added.
- **Fixed** (improvement): added a note that pause/resume replays, so use a flag or a new watcher to discard changes. Added imports/types.

### reactive-state-machine.md
- **Fixed** (bug, high): `loading` had no `RESET`; clearing the query mid-request aborted the request and left the machine in `loading` forever. Added `RESET` to `loading` and explained why.
- **Fixed** (bug, medium): if `searchFn` ignores the signal, a stale response could still win; added `if (controller.signal.aborted) return` after the `await`, and use the aborted flag instead of `e.name` (which doesn't type-check on `unknown`).
- **Fixed** (TS): typed `useStateMachine<S, E>` (invalid events are now type errors), returns `readonly(state)`. Imports added.
- **Fixed** (missing judgement): added "When to Use" / "When Not to Use" (boolean for two states, XState for complex).

### reactivity-debugging.md
- **Fixed** (wrong, medium): "`onTrack` fires when a dependency is first accessed". It fires on every tracked read, on every run. Evidence: vitest, computed reading `a` twice → 2 calls per run.
- **Fixed** (low): workflow step 1 now names `onRenderTriggered`/`onRenderTracked` correctly; the advice now suggests restructuring/`shallowRef` before `toRaw`.

### transaction-pattern.md
- **Fixed** (wrong, high): the problem was overstated. Vue already batches synchronous mutations into one DOM update, so intermediate states are never rendered. Reframed: the problem is side effects per operation, and register/unregister when `v-for` keys change.
- **Fixed** (wrong, high): "executes once after a burst of activity" / drag-and-drop example. `nextTick` only groups operations in one tick; separate events are separate ticks. Rewrote the debouncing comparison and added "When Not to Use".
- **Fixed** (bug, high): the queued transactions were never used in the field-array and drag-and-drop examples. The field-array example now sends the operations as one patch (typed union `FieldOperation`). Replaced the drag-and-drop example with "When You Only Need the Final State": a deep `watch` already runs once per tick. Evidence: vitest, 3 mutations → watcher called once.
- **Fixed** (low): Immer-style alternative awaited `nextTick` for no reason; removed. Queues are now plain arrays (they are internal bookkeeping, not rendered).
- **Fixed** (unsourced): the formwerk claim. Verified that formwerk queues field transactions and processes them in `nextTick` (`packages/core/src/useForm/useFormTransactions.ts`); reworded to what it actually does, with a link.

### writable-computed.md
- **Fixed** (wrong, medium): "This is exactly how `defineModel` works internally — it's a computed". `useModel` is a `customRef` (checked runtime-core source). Reworded, and showed `defineModel`'s own `get`/`set` options plus a computed over the model for type changes.
- **Fixed** (low): TS code in ```js blocks; imports added.
- **Left**: no "When Not to Use"; the page is short and already points to V-Model Transformer.

## Form Patterns

### async-validation.md
- **Fixed** (bug, medium): an outdated validator result could still be written when the validator ignores the `signal`, and the aborted run's `finally` could reset `validating` -> `signal.aborted` checks after the `await` and in `finally`. Evidence: ran a vitest with a validator that ignores the signal; the stale "taken" answer no longer overwrites the newer result.
- **Fixed** (bug, medium): "Available!" stayed visible for the previous value during the debounce -> every new value resets `error`/`valid` to `null` first; explained in Notes.
- **Fixed** (improvement, low): code in TS (typed `AsyncValidator`, `ref<string | null>`, local timer instead of a shared `debounceTimer`), `<script setup lang="ts">` with import.
- **Fixed** (improvement, low, a11y): label, `aria-invalid`, `aria-describedby` and an `aria-live="polite"` status region.
- **Fixed** (missing judgement): `## When Not to Use` (client-side rules, server validates on submit anyway); Notes on not trusting a pending result on submit.

### form-context.md
- **Fixed** (bug, medium): errors were only created on submit, so blur did nothing visible and a fixed field kept its error until the next submit -> `validateField(field)` runs on blur (and per field in `validate`). Evidence: ran a vitest: blur shows "Required", fixing + blur clears it.
- **Fixed** (bug, medium): `type="email"` without `novalidate` lets the browser block the submit, so the custom "Invalid email" never shows -> `novalidate` on the form + note.
- **Fixed** (bug, low, new): `onSubmit` used in the template but never defined -> defined.
- **Fixed** (inconsistency, low): intro promised "dynamic field arrays", which the page never shows -> removed from intro; field arrays now point to form libraries in When Not to Use.
- **Fixed** (improvement): TS with a typed `InjectionKey<FormContext>`, typed rules and `useField<V>()`; label and aria attributes on `EmailField`. Type-checked with vue-tsc.
- **Fixed** (missing judgement): `## When Not to Use` (small forms; use VeeValidate/FormKit/Formwerk instead of growing this into a library).

### schema-driven-forms.md
- **Fixed** (bug, high): `validate()` never cleared errors, so after one failure the form could never submit -> `delete errors[field.name]` for valid fields, like Form Context.
- **Fixed** (bug, high): hidden conditional fields were still validated, so a hidden required field blocked submit with an invisible error -> shared `isVisible()` used by `validate` and `visibleFields`; note about stripping hidden values.
- **Fixed** (bug, high): `<script setup>` without `lang="ts"` used `defineProps<...>()` (compile error) -> `lang="ts"`; `FieldSchema`/`FieldRules` interfaces added (they were used but never declared).
- **Fixed** (bug, medium): `validateField` returned "Minimum 2 characters" for an empty optional field and threw a TypeError for a missing value (`undefined.length`) -> empty values return `Required` or `null` before other rules.
- **Fixed** (bug, medium): `visibleFields` used `schema` instead of `props.schema` (undefined in `<script setup>`).
- **Fixed** (bug, medium): `options` never passed to the field component, so the select could not render its options.
- **Fixed** (inconsistency, low): `showWhen` is a function but the page says the schema can come from an API -> note to describe conditions as data for JSON schemas.
- **Fixed** (missing judgement): `## When Not to Use` (fixed forms with custom layout; don't re-implement FormKit).
- Type-checked `DynamicForm.vue` and the validation code with vue-tsc.

### v-model-transformer.md
- **Fixed** (bug, high): `toFixed(2)` in the getter rewrites the focused number input: typing `1` becomes `1.00`, so `15` cannot be typed. Evidence: ran a vitest (input value after typing "1" is "1.00"); Vue's `vModelText.beforeUpdate` compares `looseToNumber(el.value)` (1) with the string "1.00" and overwrites.
- **Fixed** (bug, high): clearing the input emitted `NaN` to the parent (ran: parent got NaN) -> prop/emit typed `number | null`, empty input emits `null`. New version tested: typing 15, 10.99 and clearing all work.
- **Fixed** (bug, medium): `tags.value.push(...)` silently does nothing because the getter returns a new array -> `addTag` assigns a new array, with an explanation.
- **Fixed** (inconsistency, low): "core building block of Form Context" — form-context.md does not use it -> reworded to "combines well with".
- **Fixed** (improvement): added the `defineModel` `get`/`set` transformer variant (Vue 3.4+), tested at runtime; `## When Not to Use`.

## Performance Patterns

All changed code is TypeScript and type-checked with vue-tsc (Vue 3.5.44, vue-router 5, chart.js, idb-keyval, TS 5.9 strict).

### cached-ref-pattern.md
- **Fixed** (bug, high): the SSR usage always refetched (`categories.value = await fetchCategories()` on every request) although the text said later requests use the cache.
- **Fixed** (bug, high): the SSR variant returned the plain default ref on the client, so server HTML and client state differ (hydration mismatch) and the client never gets the data. It also imported `@/server/cache` (Nitro server code) into app code.
- **Fixed** (missing, high): the module-level server cache is shared by all users; no warning.
  For all three, the Nuxt section now uses the idiomatic tool: a Nitro `defineCachedEventHandler` API route plus `useFetch`, which transfers the data in the payload. Links to Computed as Interceptor for the framework-agnostic version. The Server-Side notes now warn about caching user data.
- **Fixed** (wrong, medium): "JSON.stringify needed because Vue adds non-serializable properties". The real reason: IndexedDB uses structured clone, which can't clone Proxies.
- **Fixed** (missing): `localStorage` doesn't exist during SSR; note added. Added "When Not to Use" (VueUse `useLocalStorage`, Nitro cache, no user data in shared caches). Generic types, `getItem` null check.

### computed-caching.md
- **Fixed** (wrong, high): the comment "If filter changes, Vue recomputes filtered but uses cached sorted" is impossible (`sorted` depends on `filtered`, and `filter` returns a new array). Rewrote the three comments; completed the `slice(...)` call.
- **Fixed** (improvement): explained the `Object.is` rule (same primitive doesn't propagate since Vue 3.4, new arrays always do), ordering the chain, and not wrapping trivial expressions.

### granular-code-splitting.md
- **Fixed** (outdated, medium): `<Suspense>` is still experimental in Vue 3.5; now said, with the per-component `loadingComponent` alternative.
- **Fixed** (bug, medium): the nested Suspense default slot had two root nodes; Vue warns "<Suspense> slots expect a single root node" (runtime-core source). Wrapped in a `div`; mentioned `suspensible`.
- **Fixed** (missing judgement): added "When Not to Use" (small/above-the-fold components; Nuxt `Lazy` prefix and lazy hydration). Imports added.

### keepalive-strategies.md
- **Fixed** (bug, high): `<KeepAlive><RouterView /></KeepAlive>` is not supported; vue-router warns (`warnDeprecatedUsage` in vue-router source). All three examples now use `<RouterView v-slot="{ Component }">`.
- **Fixed** (bug, high): `include`/`exclude` match component names, but the route-driven example built the list from route names. Explained the name rule (`<script setup>` file name, `defineOptions({ name })`) and made the convention explicit. Removed the needless `computed` around `router.getRoutes()` (not reactive), typed `RouteMeta`, and `String(route.name)` for TS.
- **Fixed** (missing judgement): added "When Not to Use" (fresh data → `onActivated`, cheap pages, scroll position) and the Nuxt `<NuxtPage keepalive>` / `definePageMeta({ keepalive })` way.

### markraw-for-third-party-instances.md
- **Fixed** (wrong, medium): `WebSocket` (and `Date`, DOM elements) are never proxied by Vue (`getTargetType` only proxies Object/Array/Map/Set/WeakMap/WeakSet). Removed it from the list, added a one-line explanation.
- **Fixed** (bug, medium): the watcher could run before `onMounted` created the chart (`chart.value` null). Added guards; the full example is now a typed SFC with `useTemplateRef<HTMLCanvasElement>`, props, a deep watcher on `props.data` and `chart.value?.destroy()`.
- **Fixed** (inconsistency, low): explained that `shallowRef` alone already avoids proxying and `markRaw` is a safety net; mentioned a plain variable as the simplest option.

### shallowref-and-triggerref.md
- **Fixed** (wrong, medium): "Vue proxies every nested object" on assignment. Proxies are created lazily on access (though render accesses them all, and every read is tracked). Reworded.
- **Fixed** (missing, medium): after in-place mutation + `triggerRef`, a `computed` returning the same array doesn't notify its dependents. Evidence: vitest, effect ran once. Added the note and the simpler `rows.value = rows.value.toSorted(...)` alternative.
- **Fixed** (missing judgement): added "When Not to Use" (rows edited in place, small collections). Typed examples.

### v-memo-for-large-lists.md
- **Fixed** (improvement, low): added a "Stale rows" note: the memo array must cover everything the row shows (the example relies on `updatedAt` changing).
- **Left**: the example code is correct (`v-memo` on the same element as `v-for`, with a key).

## Plugin & Library Patterns

### custom-directives.md
- **Fixed** (bug, medium): `vIntersect` used `Directive` without importing it, and `el._intersectObserver` does not type-check on `HTMLElement` -> typed element and binding, import added. vue-tsc clean.
- **Fixed** (bug, medium): click-outside listened to `click`. Vue flushes the render in a microtask after the opening click's handler, so the new `document` listener still receives that click while it bubbles and closes the dropdown at once (DOM event dispatch: microtask checkpoint after each listener) -> `pointerdown` in capture phase, as VueUse's `onClickOutside` does.
- **Fixed** (improvement, medium): `updated` removed and re-added the listener on every component update -> it now only swaps the callback.
- **Fixed** (improvement, low): `entries[0]` -> last entry (several can be queued for one element).
- **Fixed** (missing judgement, medium): added `## When Not to Use` (VueUse composables/directives, state, multi-root components ignore directives: https://vuejs.org/guide/reusability/custom-directives.html).
- **Fixed** (improvement, low): registration (`app.directive` / `vX` in `<script setup>`) and SSR (`getSSRProps`, https://vuejs.org/guide/scaling-up/ssr.html#custom-directives) in Notes.

### modal-and-notification-system.md
- **Fixed** (bug, high): `ConfirmDialog.vue` had typed `defineProps<>()` without `lang="ts"` (compile error, ran compiler-sfc) -> `lang="ts"`.
- **Fixed** (accessibility, high): no focus trap, Escape or `aria-modal` -> `ConfirmDialog` uses native `<dialog>` + `showModal()`, `@cancel` closes with `false`, `aria-labelledby` via `useId()`. The controller's hand-made backdrop div is gone (`::backdrop`), so the controller has no UI of its own, matching the controller-components page.
- **Fixed** (bug, medium): missing imports (`ref`, `readonly`, `markRaw`, `Component`); `any` -> `unknown`, `open<TResult>()` typed. vue-tsc clean.
- **Fixed** (inconsistency, medium): intro said the system uses custom directives; none appear -> intro lists what is used.
- **Fixed** (improvement, medium): SSR note for the module-level `modals` list, linking to Singleton Composable.
- **Fixed** (improvement, low): prop typing trade-off noted (`vue-component-type-helpers`), usage block tagged `ts`.
- **Dropped**: "`readonly()` breaks `:is` typing". vue-tsc passes.
- **Dropped**: "pending promises never settle if the modal is removed another way". `close()` is the only way to remove one.
- **Dropped**: `crypto.randomUUID` secure context: localhost and HTTPS are secure contexts, which covers any real deployment.

### writing-a-vue-plugin.md
- **Fixed** (bug, high): state was module-level while `createNotificationService()` looked like a factory: shared between apps, tests and SSR requests, and the Notes presented that as a feature -> `ref` created inside the service (one per app); Notes rewritten, with `app.runWithContext` for use outside components.
- **Fixed** (bug, medium): `Readonly<Ref<Notification[]>>` does not accept `readonly(ref)` (ran vue-tsc: "readonly ... cannot be assigned to the mutable type") -> `Readonly<Ref<readonly Notification[]>>`. Missing imports (`Ref`, `ref`, `readonly`, `inject`, `createNotificationService`) added.
- **Fixed** (bug, medium): `v-notify-on-click` kept the message from mount time -> `updated` keeps it current; typed element.
- **Fixed** (improvement, medium): `NotificationContainer` and `app.use()` were never shown -> added, with `role="status"` / `aria-live="polite"` and a labelled dismiss button.
- **Fixed** (improvement, low): `GlobalComponents` augmentation for the global component; a `js` block that mixed a template line -> `ts` + `vue` blocks.
- **Fixed** (missing judgement, medium): added `## When Not to Use`.
- **Left**: `Notification` shadows the DOM global. It is an explicit export and import, and renaming it would ripple through the page for little gain.

