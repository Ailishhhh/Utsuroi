# lib

Integrations with the outside world (third-party SDK clients and low-level setup).

Examples:

- `config.ts` — typed environment-variable accessor. [added in M1.5]
- `supabase.ts` — the singleton Supabase client. [added in M1.6]

Rules:

- This layer knows about external services; the rest of the app talks to those
  services **only** through what this folder exports.
- No React/UI code here.
