---
layout: doc
---

# Vue Patterns

A collection of Vue 3 patterns organized by category, from component design to advanced reactivity.

## Component API Design

Patterns for designing clean, flexible component APIs.

- [Renderless Components](./component-api-design/renderless-components.md)
- [Compound Components](./component-api-design/compound-components.md)
- [Polymorphic Components](./component-api-design/polymorphic-components.md)
- [Transparent Wrapper Components](./component-api-design/transparent-wrapper-components.md)
- [Attribute Routing](./component-api-design/attribute-routing.md)
- [Reactive Props Destructuring](./component-api-design/reactive-props-destructuring.md)

## State Sharing

Patterns for sharing state between components without (or beyond) Pinia.

- [Singleton Composable](./state-sharing/singleton-composable.md)
- [Mini Store with effectScope](./state-sharing/mini-store-with-effectscope.md)
- [Typed Provide Inject](./state-sharing/typed-provide-inject.md)
- [Composable Context Pattern](./state-sharing/composable-context-pattern.md)

## Architectural Patterns

Structuring the layers of your application — separating business logic, orchestration, and presentation.

- [Humble Components](./architectural-patterns/humble-components.md)
- [Controller Components](./architectural-patterns/controller-components.md)
- [Thin Composables](./architectural-patterns/thin-composables.md)
- [The MVC Triad](./architectural-patterns/the-mvc-triad.md)

## Component Splitting

Knowing when and how to break components apart — and when not to.

- [Hidden Components](./component-splitting/hidden-components.md)
- [Combine Branches](./component-splitting/combine-branches.md)
- [Lifting State](./component-splitting/lifting-state.md)
- [Strategy Pattern](./component-splitting/strategy-pattern.md)
- [When Not to Split](./component-splitting/when-not-to-split.md)

## Composable Design

Patterns for writing composables that are flexible, testable, and composable with each other.

- [Options Object Pattern](./composable-design/options-object-pattern.md)
- [Dynamic Return Pattern](./composable-design/dynamic-return-pattern.md)
- [Reactivity Boundary Pattern](./composable-design/reactivity-boundary-pattern.md)
- [Inline Composables](./composable-design/inline-composables.md)
- [Composing Composables](./composable-design/composing-composables.md)
- [MaybeRefOrGetter](./composable-design/maybereforgetter.md)

## Async and Data Fetching

Handling async operations, race conditions, and error states.

- [Async Composable](./async-and-data-fetching/async-composable.md)
- [Race Condition Handling](./async-and-data-fetching/race-condition-handling.md)
- [Optimistic UI](./async-and-data-fetching/optimistic-ui.md)
- [Error Boundaries](./async-and-data-fetching/error-boundaries.md)

## Advanced Reactivity

Going deeper into Vue's reactivity system for specialized use cases.

- [Custom Ref](./advanced-reactivity/custom-ref.md)
- [Writable Computed](./advanced-reactivity/writable-computed.md)
- [Reactive State Machine](./advanced-reactivity/reactive-state-machine.md)
- [Pausing and Resuming Watchers](./advanced-reactivity/pausing-and-resuming-watchers.md)
- [Reactivity Debugging](./advanced-reactivity/reactivity-debugging.md)
- [nextTick Timing](./advanced-reactivity/nexttick-timing.md)
- [Transaction Pattern](./advanced-reactivity/transaction-pattern.md)
- [Lazy Evaluation with Computed](./advanced-reactivity/lazy-evaluation-with-computed.md)

## Form Patterns

Patterns for building scalable, maintainable form systems.

- [V-Model Transformer](./form-patterns/v-model-transformer.md)
- [Form Context](./form-patterns/form-context.md)
- [Async Validation](./form-patterns/async-validation.md)
- [Schema-Driven Forms](./form-patterns/schema-driven-forms.md)

## Performance Patterns

Optimizing rendering, reactivity tracking, and bundle size.

- [shallowRef and triggerRef](./performance-patterns/shallowref-and-triggerref.md)
- [markRaw for Third Party Instances](./performance-patterns/markraw-for-third-party-instances.md)
- [v-memo for Large Lists](./performance-patterns/v-memo-for-large-lists.md)
- [KeepAlive Strategies](./performance-patterns/keepalive-strategies.md)
- [Granular Code Splitting](./performance-patterns/granular-code-splitting.md)
- [Computed Caching](./performance-patterns/computed-caching.md)
- [Cached Ref Pattern](./performance-patterns/cached-ref-pattern.md)

## Plugin & Library Patterns

Building reusable plugins, directives, and app-wide systems.

- [Writing a Vue Plugin](./plugin-and-library-patterns/writing-a-vue-plugin.md)
- [Custom Directives](./plugin-and-library-patterns/custom-directives.md)
- [Modal and Notification System](./plugin-and-library-patterns/modal-and-notification-system.md)
