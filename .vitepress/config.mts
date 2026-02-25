import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  base: process.env.GITHUB_ACTIONS ? '/vue-design-patterns/' : '/',

  title: "Vue Design Patterns",
  description: "Vue Design Patterns",
  themeConfig: {
    nav: [],

    sidebar: [
      {
        text: 'Component API Design',
        collapsed: true,
        items: [
          { text: 'Renderless Components', link: '/component-api-design/renderless-components' },
          { text: 'Compound Components', link: '/component-api-design/compound-components' },
          { text: 'Polymorphic Components', link: '/component-api-design/polymorphic-components' },
          { text: 'Adapter Pattern', link: '/component-api-design/adapter-pattern' },
          { text: 'Transparent Wrapper Components', link: '/component-api-design/transparent-wrapper-components' },
          { text: 'Attribute Routing', link: '/component-api-design/attribute-routing' },
          { text: 'Reactive Props Destructuring', link: '/component-api-design/reactive-props-destructuring' },
        ]
      },
      {
        text: 'State Sharing',
        collapsed: true,
        items: [
          { text: 'Singleton Composable', link: '/state-sharing/singleton-composable' },
          { text: 'Mini Store with effectScope', link: '/state-sharing/mini-store-with-effectscope' },
          { text: 'Typed Provide Inject', link: '/state-sharing/typed-provide-inject' },
          { text: 'Composable Context Pattern', link: '/state-sharing/composable-context-pattern' },
        ]
      },
      {
        text: 'Architectural Patterns',
        collapsed: true,
        items: [
          { text: 'Humble Components', link: '/architectural-patterns/humble-components' },
          { text: 'Controller Components', link: '/architectural-patterns/controller-components' },
          { text: 'Thin Composables', link: '/architectural-patterns/thin-composables' },
          { text: 'The MVC Triad', link: '/architectural-patterns/the-mvc-triad' },
        ]
      },
      {
        text: 'Component Splitting',
        collapsed: true,
        items: [
          { text: 'Hidden Components', link: '/component-splitting/hidden-components' },
          { text: 'Combine Branches', link: '/component-splitting/combine-branches' },
          { text: 'Lifting State', link: '/component-splitting/lifting-state' },
          { text: 'Strategy Pattern', link: '/component-splitting/strategy-pattern' },
          { text: 'When Not to Split', link: '/component-splitting/when-not-to-split' },
        ]
      },
      {
        text: 'Composable Design',
        collapsed: true,
        items: [
          { text: 'Options Object Pattern', link: '/composable-design/options-object-pattern' },
          { text: 'Dynamic Return Pattern', link: '/composable-design/dynamic-return-pattern' },
          { text: 'Reactivity Boundary Pattern', link: '/composable-design/reactivity-boundary-pattern' },
          { text: 'Inline Composables', link: '/composable-design/inline-composables' },
          { text: 'Composing Composables', link: '/composable-design/composing-composables' },
          { text: 'MaybeRefOrGetter', link: '/composable-design/maybereforgetter' },
        ]
      },
      {
        text: 'Async and Data Fetching',
        collapsed: true,
        items: [
          { text: 'Async Composable', link: '/async-and-data-fetching/async-composable' },
          { text: 'Race Condition Handling', link: '/async-and-data-fetching/race-condition-handling' },
          { text: 'Optimistic UI', link: '/async-and-data-fetching/optimistic-ui' },
          { text: 'Error Boundaries', link: '/async-and-data-fetching/error-boundaries' },
        ]
      },
      {
        text: 'Advanced Reactivity',
        collapsed: true,
        items: [
          { text: 'Custom Ref', link: '/advanced-reactivity/custom-ref' },
          { text: 'Writable Computed', link: '/advanced-reactivity/writable-computed' },
          { text: 'Reactive State Machine', link: '/advanced-reactivity/reactive-state-machine' },
          { text: 'Pausing and Resuming Watchers', link: '/advanced-reactivity/pausing-and-resuming-watchers' },
          { text: 'Reactivity Debugging', link: '/advanced-reactivity/reactivity-debugging' },
          { text: 'nextTick Timing', link: '/advanced-reactivity/nexttick-timing' },
          { text: 'Transaction Pattern', link: '/advanced-reactivity/transaction-pattern' },
          { text: 'Computed as Interceptor', link: '/advanced-reactivity/computed-as-interceptor' },
        ]
      },
      {
        text: 'Form Patterns',
        collapsed: true,
        items: [
          { text: 'V-Model Transformer', link: '/form-patterns/v-model-transformer' },
          { text: 'Form Context', link: '/form-patterns/form-context' },
          { text: 'Async Validation', link: '/form-patterns/async-validation' },
          { text: 'Schema-Driven Forms', link: '/form-patterns/schema-driven-forms' },
        ]
      },
      {
        text: 'Performance Patterns',
        collapsed: true,
        items: [
          { text: 'shallowRef and triggerRef', link: '/performance-patterns/shallowref-and-triggerref' },
          { text: 'markRaw for Third Party Instances', link: '/performance-patterns/markraw-for-third-party-instances' },
          { text: 'v-memo for Large Lists', link: '/performance-patterns/v-memo-for-large-lists' },
          { text: 'KeepAlive Strategies', link: '/performance-patterns/keepalive-strategies' },
          { text: 'Granular Code Splitting', link: '/performance-patterns/granular-code-splitting' },
          { text: 'Computed Caching', link: '/performance-patterns/computed-caching' },
          { text: 'Cached Ref Pattern', link: '/performance-patterns/cached-ref-pattern' },
        ]
      },
      {
        text: 'Plugin & Library Patterns',
        collapsed: true,
        items: [
          { text: 'Writing a Vue Plugin', link: '/plugin-and-library-patterns/writing-a-vue-plugin' },
          { text: 'Custom Directives', link: '/plugin-and-library-patterns/custom-directives' },
          { text: 'Modal and Notification System', link: '/plugin-and-library-patterns/modal-and-notification-system' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
