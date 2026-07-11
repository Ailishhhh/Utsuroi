# services

Business logic. This is the layer between the UI and the integrations in `lib/`.

Examples:

- `auth.ts` — sign in / sign up / sign out logic built on the Supabase client. [added in M1.7]

Rules:

- **No UI here.** No JSX, no React components.
- Screens (`app/`) and hooks call services; services call `lib/`.
- Keeps route files thin: a screen renders, a service decides.
