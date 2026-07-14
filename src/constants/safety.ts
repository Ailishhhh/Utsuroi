/**
 * safety.ts — app-side safety copy.
 *
 * Mirrors the backend's AI disclosure (server/src/safety.ts). Kept in sync by hand
 * since the app and backend are separate deployables. Crisis resources themselves are
 * NOT duplicated here — they arrive from the backend in the /api/chat response.
 */

export const AI_DISCLOSURE =
  "Utsuroi is an AI companion — not a real person, and not a substitute for professional, medical, or crisis help. If you're ever in danger or crisis, please reach out to a real person or a helpline.";
