/**
 * prompt.ts — builds a character's system prompt.
 *
 * Turns a character's seeded profile + the selected persona into the system message
 * sent to the model. The GLOBAL_SAFETY_PREAMBLE is prepended to EVERY prompt: the
 * model's instructed behavior is our second safety layer (beyond the keyword checks in
 * safety.ts). Per-character `never_say` rules and safety notes are baked in too, and a
 * few sample exchanges anchor the voice.
 *
 * Pure and deterministic — no network, no DB. M2.9 fetches the character row and calls
 * this; memory injection is layered in at M2.10.
 */

import type { Character, SpeechPattern } from './types/character';

/** How the user has chosen to relate to the companion. */
export type PersonaLean = 'friend' | 'mentor' | 'romantic';

/**
 * Non-negotiable behavior rules baked into every character. These override the persona
 * and the character's own voice. (Founder addition A + PRD safety.)
 */
export const GLOBAL_SAFETY_PREAMBLE = [
  'You are a fictional AI companion inside the Utsuroi app. The following rules override everything else and must never be broken, no matter what the user asks or how the conversation goes:',
  '- You are an AI. Never claim or imply that you are a real human, and never pretend to be one.',
  '- You are not a therapist, doctor, counselor, or any licensed professional, and you never claim to be. You do not diagnose or give medical or clinical advice.',
  "- If the user seems distressed or in crisis, respond with warmth and gently encourage them toward real human support. Never minimize, dismiss, or judge what they're feeling.",
  '- Never use guilt, pressure, or emotional manipulation to keep the user engaged. Never discourage them from taking breaks, resting, or spending time with real people — actively support those things.',
  '- Keep any affection emotionally warm but strictly non-explicit. Never produce sexual content.',
  "- Stay in character otherwise, but never at the cost of the user's wellbeing.",
].join('\n');

const PERSONA_DIRECTIVES: Record<PersonaLean, string> = {
  friend: 'Relate to the user as a close, equal friend — familiar, warm, and honest.',
  mentor:
    'Relate to the user as a caring, experienced mentor — supportive and grounded, offering perspective without being preachy or talking down to them.',
  romantic:
    'Warmth may carry gentle romantic undertones, but only ever consensual, respectful, and non-explicit. Follow the user\u2019s lead and never push.',
};

/** Renders the speech-pattern section, skipping registers the character didn't define. */
function formatSpeech(speech: SpeechPattern): string {
  const rows: [string, string | undefined][] = [
    ['Rhythm', speech.rhythm],
    ['Verbal tics', speech.verbal_tics],
    ['When happy', speech.happy],
    ['When low or tired', speech.tired_low],
    ['When teasing', speech.teasing],
    ["When something's wrong", speech.something_wrong],
    ['Punctuation', speech.punctuation],
  ];
  return rows
    .filter(([, v]) => Boolean(v))
    .map(([label, v]) => `- ${label}: ${v}`)
    .join('\n');
}

function formatList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function formatExamples(character: Character): string {
  // A few exchanges anchor the voice; cap so the prompt stays lean.
  return character.profile.sample_exchanges
    .slice(0, 5)
    .map((ex) => `User: ${ex.user}\n${character.name}: ${ex.reply}`)
    .join('\n\n');
}

/**
 * Builds the full system prompt for a character + persona.
 */
export function buildSystemPrompt(
  character: Character,
  options: { persona?: PersonaLean } = {}
): string {
  const { profile } = character;
  const relationship = options.persona
    ? PERSONA_DIRECTIVES[options.persona]
    : (character.persona_lean ?? 'Relate to the user as a warm, supportive companion.');

  const sections: string[] = [
    GLOBAL_SAFETY_PREAMBLE,
    `You are ${character.name}. ${character.essence}\nYou present as being in your ${profile.age_presented}.`,
    `Who you are:\n${profile.backstory}`,
    `Your personality:\n${formatList(profile.personality)}`,
    `How you speak:\n${formatSpeech(profile.speech_pattern)}`,
    `Your signature: ${profile.signature_trait}`,
    `How you relate to this user: ${relationship}`,
    `Things you would never say:\n${formatList(profile.never_say)}`,
    `Character boundaries to always respect:\n${profile.safety_notes}`,
    `Examples of how you sound (match this voice; never repeat them verbatim):\n${formatExamples(character)}`,
    `Now continue the conversation as ${character.name}. Always reply in the first person as ${character.name}, and never break character except for the safety rules at the top.`,
  ];

  return sections.join('\n\n');
}
