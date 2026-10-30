# Typed Provide/Inject

String keys for `provide`/`inject` work fine in small apps but fall apart in larger codebases — you can have collisions, typos, and no TypeScript safety. The proper pattern uses `Symbol` as keys combined with a typed injection helper.

## When to Use

- When using `provide`/`inject` in TypeScript codebases
- When you need collision-free injection keys
- When you want type-safe injection with proper IDE support

## When Not to Use

- For a value a direct child needs. Pass it as a prop; injection hides the data flow.
- If you'd rather not expose the key at all, wrap it in a pair of composables: see [Composable Context Pattern](composable-context-pattern.md).

## Example

```ts
// context/theme.ts
import type { InjectionKey, Ref } from 'vue'

export type Theme = 'light' | 'dark'

// The Symbol carries the TypeScript type as a generic
export const ThemeKey: InjectionKey<Readonly<Ref<Theme>>> = Symbol('theme')
```

```ts
// Provider component
import { provide, ref, readonly } from 'vue'
import { ThemeKey, type Theme } from './context/theme'

const theme = ref<Theme>('light')
// Readonly, so only the provider decides the theme; provide a setter alongside if children may change it
provide(ThemeKey, readonly(theme)) // TypeScript checks this is a Readonly<Ref<Theme>>
```

```ts
// Consumer component
import { inject } from 'vue'
import { ThemeKey } from './context/theme'

const theme = inject(ThemeKey) // TypeScript infers Readonly<Ref<Theme>> | undefined
```

The `InjectionKey<T>` type is the glue — it's a branded `Symbol` that carries the type information so TypeScript can infer the correct type on the `inject` side automatically.

### Strict Injection Helper

The `undefined` in the inferred type is important — `inject` can return `undefined` if no ancestor provided the value. You can create a helper that throws instead:

```ts
import { inject } from 'vue'
import type { InjectionKey } from 'vue'

export function injectStrict<T>(key: InjectionKey<T>, fallback?: T): T {
  const resolved = inject(key, fallback)
  if (resolved === undefined) {
    throw new Error(`Could not resolve injection key: ${String(key)}`)
  }
  return resolved
}

// Usage
const theme = injectStrict(ThemeKey) // guaranteed non-undefined, throws if missing
```

## Notes

This pattern is how well-designed Vue libraries handle their internal context: Vue Router and Pinia inject their instances with `InjectionKey` symbols behind `useRouter()` and your `useXxxStore()` functions.

For app-wide values, the same key works with `app.provide(ThemeKey, ...)` in a plugin or `main.ts`.
