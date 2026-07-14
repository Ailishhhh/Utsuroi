# Utsuroi — Tracked Debt & Release Gates

Durable record of known, deliberately-deferred work. Nothing here is a bug in shipped
code; these are conscious "later" decisions. Revisit at the phase noted.

## 🚦 Mandatory gate — before Phase 4 (public launch)

- **In-app account deletion.** Google Play requires a user-facing way to delete your
  account and associated data. Not built yet.
  - Build (propose-first): a **Settings** screen with a "Delete account" button + confirm,
    and a backend endpoint using the Supabase **`service_role`** key
    (`auth.admin.deleteUser`) — this is the one legitimate service_role use (deleting an
    auth user can't be done with the anon key). Adds a new Vercel secret
    (`SUPABASE_SERVICE_ROLE_KEY`).
  - Safety net already in place: DB `ON DELETE CASCADE` on `conversations`, `messages`,
    and `memory_summaries` → deleting the `auth.users` row (Supabase dashboard, admin API,
    or the future endpoint) wipes all user data with zero orphans. Verified on Postgres.
  - For Phase 3 alpha: delete testers manually via the Supabase dashboard.

## Other tracked debt (schedule when relevant)

- **LLM crisis classifier** — near-term fast-follow to the deterministic keyword layer in
  `server/src/safety.ts` (catches subtler/ambiguous crisis phrasing the patterns miss).
- **LargeSecureStore** — before **Phase 3**. `expo-secure-store` has a ~2KB per-value
  limit; Google OAuth sessions can exceed it. Upgrade the session storage adapter in
  `src/lib/supabase.ts` to the encrypted LargeSecureStore pattern (aes-js +
  react-native-get-random-values + AsyncStorage). TODO marker is in that file.
- **Load persisted chat history into the UI** — the chat screen is session-local; the
  backend already stores + uses history. Fetch and render prior messages on open.
- **Persona selection UI** — the backend `/api/chat` accepts `persona`
  (friend/mentor/romantic); the app currently always sends the character default. Add a
  way for users to choose.
