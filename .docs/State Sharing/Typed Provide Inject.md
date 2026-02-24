# Typed Provide/Inject

String keys for `provide`/`inject` work fine in small apps but fall apart in larger codebases — you can have collisions, typos, and no TypeScript safety. The proper pattern uses `Symbol` as keys combined with a typed injection helper.

## When to Use

- When using `provide`/`inject` in TypeScript codebases
- When you need collision-free injection keys
- When you want type-safe injection with proper IDE support

## Example

```ts
// context/theme.ts
import type { InjectionKey, Ref } from 'vue'

// The Symbol carries the TypeScript type as a generic
export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')
```

```ts
// Provider component
import { provide, ref } from 'vue'
import { ThemeKey } from './context/theme'

const theme = ref<'light' | 'dark'>('light')
provide(ThemeKey, theme) // TypeScript knows this must be Ref<'light' | 'dark'>
```

```ts
// Consumer component
import { inject } from 'vue'
import { ThemeKey } from './context/theme'

const theme = inject(ThemeKey) // TypeScript infers Ref<'light' | 'dark'> | undefined
```

The `InjectionKey<T>` type is the glue — it's a branded `Symbol` that carries the type information so TypeScript can infer the correct type on the `inject` side automatically.

### Strict Injection Helper

The `undefined` in the inferred type is important — `inject` can return `undefined` if no ancestor provided the value. You can create a helper that throws instead:

```ts
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

This pattern is how well-designed Vue libraries like VueUse handle their internal context.
