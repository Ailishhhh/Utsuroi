# types

Shared TypeScript types used across more than one module.

Rules:

- Types local to a single file stay in that file. Only put a type here when it is
  genuinely shared.
- No runtime code — types and interfaces only.
