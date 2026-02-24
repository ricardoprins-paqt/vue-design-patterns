# When Not to Split

Splitting has a cost. Every extracted component adds indirection — you now have to jump between files to understand what's happening. For a small, focused component that's always used the same way and never changes independently, extraction might just add noise.

## When to Keep Things Together

- When the two pieces always change together
- When extracting would create a component with 8+ props (the boundary might be wrong)
- When the section is small, focused, and only used in one place

## Rules of Thumb

**Ask whether the two pieces you're splitting ever need to change independently.** If yes, split. If they always change together, keeping them together is probably simpler.

**Watch for prop explosion.** If you extract a component and immediately find yourself passing 8 props into it, the boundary might be wrong. Good component boundaries tend to have small, clean interfaces.

## Notes

This is the counterbalance to patterns like [[Hidden Components]] and [[Combine Branches]]. The goal is clarity, not extraction for its own sake. Three similar lines of code is better than a premature abstraction.
