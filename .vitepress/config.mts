import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",

  title: "Vue Design Patterns",
  description: "Vue Design Patterns",
  themeConfig: {
    nav: [],

    sidebar: [
      {
        text: 'Component API Design',
        collapsed: true,
        items: [
          { text: 'Renderless Components', link: '/Component API Design/Renderless Components' },
          { text: 'Compound Components', link: '/Component API Design/Compound Components' },
          { text: 'Polymorphic Components', link: '/Component API Design/Polymorphic Components' },
          { text: 'Transparent Wrapper Components', link: '/Component API Design/Transparent Wrapper Components' },
          { text: 'Attribute Routing', link: '/Component API Design/Attribute Routing' },
          { text: 'Reactive Props Destructuring', link: '/Component API Design/Reactive Props Destructuring' },
        ]
      },
      {
        text: 'State Sharing',
        collapsed: true,
        items: [
          { text: 'Singleton Composable', link: '/State Sharing/Singleton Composable' },
          { text: 'Mini Store with effectScope', link: '/State Sharing/Mini Store with effectScope' },
          { text: 'Typed Provide Inject', link: '/State Sharing/Typed Provide Inject' },
          { text: 'Composable Context Pattern', link: '/State Sharing/Composable Context Pattern' },
        ]
      },
      {
        text: 'Architectural Patterns',
        collapsed: true,
        items: [
          { text: 'Humble Components', link: '/Architectural Patterns/Humble Components' },
          { text: 'Controller Components', link: '/Architectural Patterns/Controller Components' },
          { text: 'Thin Composables', link: '/Architectural Patterns/Thin Composables' },
          { text: 'The MVC Triad', link: '/Architectural Patterns/The MVC Triad' },
        ]
      },
      {
        text: 'Component Splitting',
        collapsed: true,
        items: [
          { text: 'Hidden Components', link: '/Component Splitting/Hidden Components' },
          { text: 'Combine Branches', link: '/Component Splitting/Combine Branches' },
          { text: 'Lifting State', link: '/Component Splitting/Lifting State' },
          { text: 'Strategy Pattern', link: '/Component Splitting/Strategy Pattern' },
          { text: 'When Not to Split', link: '/Component Splitting/When Not to Split' },
        ]
      },
      {
        text: 'Composable Design',
        collapsed: true,
        items: [
          { text: 'Options Object Pattern', link: '/Composable Design/Options Object Pattern' },
          { text: 'Dynamic Return Pattern', link: '/Composable Design/Dynamic Return Pattern' },
          { text: 'Reactivity Boundary Pattern', link: '/Composable Design/Reactivity Boundary Pattern' },
          { text: 'Inline Composables', link: '/Composable Design/Inline Composables' },
          { text: 'Composing Composables', link: '/Composable Design/Composing Composables' },
          { text: 'MaybeRefOrGetter', link: '/Composable Design/MaybeRefOrGetter' },
        ]
      },
      {
        text: 'Async and Data Fetching',
        collapsed: true,
        items: [
          { text: 'Async Composable', link: '/Async and Data Fetching/Async Composable' },
          { text: 'Race Condition Handling', link: '/Async and Data Fetching/Race Condition Handling' },
          { text: 'Optimistic UI', link: '/Async and Data Fetching/Optimistic UI' },
          { text: 'Error Boundaries', link: '/Async and Data Fetching/Error Boundaries' },
        ]
      },
      {
        text: 'Advanced Reactivity',
        collapsed: true,
        items: [
          { text: 'Custom Ref', link: '/Advanced Reactivity/Custom Ref' },
          { text: 'Writable Computed', link: '/Advanced Reactivity/Writable Computed' },
          { text: 'Reactive State Machine', link: '/Advanced Reactivity/Reactive State Machine' },
          { text: 'Pausing and Resuming Watchers', link: '/Advanced Reactivity/Pausing and Resuming Watchers' },
          { text: 'Reactivity Debugging', link: '/Advanced Reactivity/Reactivity Debugging' },
          { text: 'nextTick Timing', link: '/Advanced Reactivity/nextTick Timing' },
          { text: 'Transaction Pattern', link: '/Advanced Reactivity/Transaction Pattern' },
          { text: 'Lazy Evaluation with Computed', link: '/Advanced Reactivity/Lazy Evaluation with Computed' },
        ]
      },
      {
        text: 'Form Patterns',
        collapsed: true,
        items: [
          { text: 'V-Model Transformer', link: '/Form Patterns/V-Model Transformer' },
          { text: 'Form Context', link: '/Form Patterns/Form Context' },
          { text: 'Async Validation', link: '/Form Patterns/Async Validation' },
          { text: 'Schema-Driven Forms', link: '/Form Patterns/Schema-Driven Forms' },
        ]
      },
      {
        text: 'Performance Patterns',
        collapsed: true,
        items: [
          { text: 'shallowRef and triggerRef', link: '/Performance Patterns/shallowRef and triggerRef' },
          { text: 'markRaw for Third Party Instances', link: '/Performance Patterns/markRaw for Third Party Instances' },
          { text: 'v-memo for Large Lists', link: '/Performance Patterns/v-memo for Large Lists' },
          { text: 'KeepAlive Strategies', link: '/Performance Patterns/KeepAlive Strategies' },
          { text: 'Granular Code Splitting', link: '/Performance Patterns/Granular Code Splitting' },
          { text: 'Computed Caching', link: '/Performance Patterns/Computed Caching' },
          { text: 'Cached Ref Pattern', link: '/Performance Patterns/Cached Ref Pattern' },
        ]
      },
      {
        text: 'Plugin & Library Patterns',
        collapsed: true,
        items: [
          { text: 'Writing a Vue Plugin', link: '/Plugin and Library Patterns/Writing a Vue Plugin' },
          { text: 'Custom Directives', link: '/Plugin and Library Patterns/Custom Directives' },
          { text: 'Modal and Notification System', link: '/Plugin and Library Patterns/Modal and Notification System' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
