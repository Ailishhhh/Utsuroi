# components

Reusable **UI** building blocks (buttons, cards, inputs, etc.).

Rules:

- Presentational only. No data fetching, no business logic, no direct Supabase calls.
- Consume theme via the `useTheme()` hook — never hardcode a hex value here.
- If a component needs data or logic, it receives it via props from a screen or hook.
