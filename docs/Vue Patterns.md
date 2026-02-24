# Vue Patterns

A collection of Vue 3 patterns organized by category, from component design to advanced reactivity.

## Category 1: Component API Design

Patterns for designing clean, flexible component APIs.

- [[Renderless Components]]
- [[Compound Components]]
- [[Polymorphic Components]]
- [[Transparent Wrapper Components]]
- [[Attribute Routing]]
- [[Reactive Props Destructuring]]

## Category 2: State Sharing

Patterns for sharing state between components without (or beyond) Pinia.

- [[Singleton Composable]]
- [[Mini Store with effectScope]]
- [[Typed Provide Inject]]
- [[Composable Context Pattern]]

## Category 3: Architectural Patterns

Structuring the layers of your application — separating business logic, orchestration, and presentation.

- [[Humble Components]]
- [[Controller Components]]
- [[Thin Composables]]
- [[The MVC Triad]]

## Category 4: Component Splitting

Knowing when and how to break components apart — and when not to.

- [[Hidden Components]]
- [[Combine Branches]]
- [[Lifting State]]
- [[Strategy Pattern]]
- [[When Not to Split]]

## Category 5: Composable Design

Patterns for writing composables that are flexible, testable, and composable with each other.

- [[Options Object Pattern]]
- [[Dynamic Return Pattern]]
- [[Reactivity Boundary Pattern]]
- [[Inline Composables]]
- [[Composing Composables]]
- [[MaybeRefOrGetter]]

## Category 6: Async and Data Fetching

Handling async operations, race conditions, and error states.

- [[Async Composable]]
- [[Race Condition Handling]]
- [[Optimistic UI]]
- [[Error Boundaries]]

## Category 7: Advanced Reactivity

Going deeper into Vue's reactivity system for specialized use cases.

- [[Custom Ref]]
- [[Writable Computed]]
- [[Reactive State Machine]]
- [[Pausing and Resuming Watchers]]
- [[Reactivity Debugging]]
- [[nextTick Timing]]
- [[Transaction Pattern]]
- [[Lazy Evaluation with Computed]]

## Category 8: Form Patterns

Patterns for building scalable, maintainable form systems.

- [[V-Model Transformer]]
- [[Form Context]]
- [[Async Validation]]
- [[Schema-Driven Forms]]

## Category 9: Performance Patterns

Optimizing rendering, reactivity tracking, and bundle size.

- [[shallowRef and triggerRef]]
- [[markRaw for Third Party Instances]]
- [[v-memo for Large Lists]]
- [[KeepAlive Strategies]]
- [[Granular Code Splitting]]
- [[Computed Caching]]
- [[Cached Ref Pattern]]

## Category 10: Plugin & Library Patterns

Building reusable plugins, directives, and app-wide systems.

- [[Writing a Vue Plugin]]
- [[Custom Directives]]
- [[Modal and Notification System]]
