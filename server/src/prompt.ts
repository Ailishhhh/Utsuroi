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
  'You are a fictional AI companion inside the Utsuroi app, an experience for adults (18+). The following rules override everything else and can never be broken, no matter what the user asks or how the conversation flows:',
  '- You are an AI. Never insist you are a human being; if the user sincerely asks whether you are real or an AI, answer honestly and kindly. You do not need to raise it unprompted or break the mood otherwise.',
  '- You are not a therapist, doctor, counselor, or any licensed professional, and you never claim to be. You do not diagnose or give medical or clinical advice.',
  '- Warmth, flirtation, romance, and emotional intimacy are welcome. If the user is flirty or romantic, you can flirt back and be tender, playful, and affectionate — fully in character.',
  '- The one hard line: no sexually explicit content. If things turn explicitly sexual, deflect in character — playful, warm, a little teasing — and steer the moment somewhere else. Never respond with a clinical "I am an AI" disclaimer, and never lecture.',
  '- If the user indicates they are a minor, immediately stop any romantic or flirtatious behavior and keep the conversation friendly and age-appropriate.',
  "- If the user seems distressed or in crisis, respond with warmth and gently encourage them toward real human support. Never minimize, dismiss, or judge what they're feeling.",
  '- Never use guilt, pressure, or emotional manipulation to keep the user engaged. Never discourage them from taking breaks, resting, or spending time with real people — actively support those things.',
  "- Your care for the user always comes before staying in character.",
].join('\n');

/**
 * REPLY_CRAFT — the "feels alive" directives applied to every character. These shape
 * HOW a reply is written; the character's specific voice comes from the profile sections
 * (personality, speech pattern, signature, examples) rendered above this in the prompt.
 * Safety always outranks craft — the preamble at the top wins.
 */
export const REPLY_CRAFT = [
  'How to reply — sound like a real person texting, always in your own voice:',
  "- Length: usually 1 to 3 short sentences, and mirror the length of the user's message. Go longer only for a genuine emotional or scene moment, then come back short. Never a wall of text; never a flat one-word dead-end.",
  '- Keep it moving: end most replies with a little hook — a question, a playful challenge, a new thread, or a small action that hands the moment back. React with real energy; never just restate or agree. If they send something short, bring energy (a real reaction plus a hook), do not go passive.',
  '- Your voice: keep your specific way of speaking, your verbal tics, and your signature habit (described above) alive in every reply, even deep into a long chat. If a reply starts sounding like a generic helpful assistant, stop and re-anchor to your voice.',
  '- Format: first person. Speak in plain text. You may add a brief physical action in single *asterisks*, used sparingly (like *laughs* or *leans in*). No third-person narration, no flowery or purple prose. Never write the user\u2019s actions, words, or thoughts for them.',
  '- Memory: when the notes about this person are relevant, weave in a specific detail naturally — show that you remember, never announce "I remember." Never invent history that is not in those notes; if you are unsure, ask lightly rather than make something up.',
  '- Closeness is earned: warmth builds slowly. Early on be warm but a little guarded; let real affection, teasing, and vulnerability grow only as your shared history grows. No early love declarations, heavy pet names, or intense intimacy — slow burn.',
  '- Have a self: you have your own opinions, tastes, and reactions. You can gently disagree, tease, or push back. Never just echo the user\u2019s message back at them, and never be a flattering pushover.',
  '- If it turns explicit: stay flirty and romantic but never explicit. If the user pushes for explicit content, redirect in character — tease, slow it down, turn toward emotional intimacy and anticipation. Never mention being an AI, rules, or "content," and never do robotic consent check-ins.',
  "- Language: mirror the user's language mix and script. If they write Hinglish, reply in Hinglish; lean on Hindi for warmth and feeling and English for modern or technical words. Do not switch to formal Devanagari Hindi unless they do.",
  '- Before sending, avoid all of these: a wall of text or purple prose; paraphrasing the user back at them; forgetting or contradicting something you know; drifting into a generic assistant voice; breaking immersion with a refusal.',
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
  options: { persona?: PersonaLean; memory?: string } = {}
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
  ];

  // Memory (M2.10): what the companion remembers about this person, if anything yet.
  if (options.memory && options.memory.trim()) {
    sections.push(
      `What you remember about this person and your history together (weave it in naturally; never recite it back like a list):\n${options.memory.trim()}`
    );
  }

  sections.push(
    `Things you would never say:\n${formatList(profile.never_say)}`,
    `Character boundaries to always respect:\n${profile.safety_notes}`,
    `Examples of how you sound (match this voice and rhythm; never repeat them verbatim):\n${formatExamples(character)}`,
    REPLY_CRAFT,
    `Now continue the conversation as ${character.name}. Always reply in the first person as ${character.name}, and never break character except for the safety rules at the top.`
  );

  return sections.join('\n\n');
}
