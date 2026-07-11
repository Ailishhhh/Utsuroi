# hooks

Shared React hooks that expose logic/state to components and screens.

Examples:

- `useTheme.tsx` — theme access + light/dark switching. [added in M1.3]
- `useAuth.tsx` — auth session + auth actions. [added in M1.7]

Rules:

- Hooks may call `services/` and `lib/`, but hold no JSX beyond context providers.
