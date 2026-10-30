# Singleton Composable

The simplest pattern for global shared state — no Pinia needed. Module-level variables in JavaScript are shared across all imports, so if you declare your refs outside the composable function, they become global singletons.

## When to Use

- Simple global state that doesn't need a store library
- Auth state, feature flags, theme settings
- Small apps or specific global concerns

## When Not to Use

- In SSR apps (Nuxt) — see the SSR warning below.
- When state is only shared within one part of the tree. Scope it with [Typed Provide Inject](typed-provide-inject.md) instead of making it global.
- When the app has many stores, needs devtools inspection, or relies on resetting state between tests. That is what Pinia is for.

## Example

```ts
// useAuth.ts
import { ref, computed, readonly } from 'vue'
import { authService, type Credentials, type User } from '@/services/auth'

const user = ref<User | null>(null)
const isAuthenticated = computed(() => user.value !== null)

export function useAuth() {
  const login = async (credentials: Credentials) => {
    user.value = await authService.login(credentials)
  }

  const logout = () => {
    user.value = null
  }

  return { user: readonly(user), isAuthenticated, login, logout }
}
```

Every component that calls `useAuth()` shares the exact same `user` ref. Change it in one place and every consumer updates.

## Notes

- The state is declared outside the function but the methods are inside — this means methods get recreated per call which is a slight waste. For performance you can move them outside too.
- Returning `readonly(user)` prevents consumers from mutating the user directly — they have to go through `login` and `logout`. Pinia doesn't do this by default (store state is writable from anywhere); you get the same guarantee there by returning `readonly()` state from a setup store.
- **Limitation**: this state lives for the entire lifetime of the app — there's no cleanup. That also means it survives between unit tests unless you reset it. For stores that need proper lifecycle management, see [Mini Store with effectScope](mini-store-with-effectscope.md).
- **SSR Warning**: In SSR environments like Nuxt, module-level state is shared across all incoming requests on the server. This means one user's data can leak into another user's response — a critical security issue. Use Nuxt's `useState` instead of module-level refs for SSR-safe singleton state.
