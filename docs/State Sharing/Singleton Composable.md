# Singleton Composable

The simplest pattern for global shared state — no Pinia needed. Module-level variables in JavaScript are shared across all imports, so if you declare your refs outside the composable function, they become global singletons.

## When to Use

- Simple global state that doesn't need a store library
- Auth state, feature flags, theme settings
- Small apps or specific global concerns

## Example

```js
// useAuth.js
const user = ref(null)
const isAuthenticated = computed(() => user.value !== null)

export function useAuth() {
  const login = async (credentials) => {
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
- Returning `readonly(user)` prevents consumers from mutating the user directly — they have to go through `login` and `logout`. This is the same principle as Pinia's store pattern, just without the library.
- **Limitation**: this state lives for the entire lifetime of the app — there's no cleanup. For stores that need proper lifecycle management, see [[Mini Store with effectScope]].
