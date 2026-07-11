/**
 * theme.ts — Utsuroi's locked design tokens.
 *
 * These colors and font roles come straight from the Engineering Bible (Section 6),
 * which locked them in Phase 0.5. Do NOT "improve" or re-derive values here — if a
 * token is wrong, that is a Phase 0.5 conversation, not a quiet edit in this file.
 *
 * The ONLY values here that are not directly from the locked spec are the dark-mode
 * text colors (see DARK_TEXT_* below), because the locked dark table never defined
 * them and dark mode cannot render without them. They are clearly marked and pending
 * founder sign-off.
 */

/** Which visual scheme is active. */
export type ColorScheme = 'light' | 'dark';

/**
 * The user's chosen theme preference.
 * - 'system' follows the OS setting (default).
 * - 'light' / 'dark' are explicit overrides.
 * Persistence of this choice is added in M1.8; the type lives here so the whole
 * app shares one definition.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Every semantic color role the app is allowed to use. */
export interface ThemeColors {
  /** Dusk Violet — primary brand color, main actions. */
  primary: string;
  /** Warm Peach — secondary emphasis. */
  secondary: string;
  /** App background. */
  background: string;
  /** Card / elevated surface background. */
  card: string;
  /** Ember Coral — high-emphasis accent, sparingly. */
  accent: string;
  /** Primary text on `background` / `card`. */
  textPrimary: string;
  /** Muted / secondary text. */
  textSecondary: string;
  /** Soft Rust — error states. */
  error: string;
  /** Sage Teal — success states. */
  success: string;
}

/**
 * Semantic font roles. Screens ask for a role (e.g. `fonts.display`), never a raw
 * font-family string. Values are the font family names registered via `useFonts`
 * in the root layout — they MUST match those keys exactly.
 */
export interface ThemeFonts {
  /** Fraunces — display / emotional moments only (splash, names, empty states). */
  display: string;
  /** Fraunces SemiBold — emphasized display. */
  displaySemiBold: string;
  /** Inter — default UI / body text. */
  body: string;
  /** Inter Medium. */
  bodyMedium: string;
  /** Inter SemiBold. */
  bodySemiBold: string;
  /** Inter Bold. */
  bodyBold: string;
}

/** A complete theme: which scheme it is, its colors, and its fonts. */
export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

// ---------------------------------------------------------------------------
// Locked color tokens (Bible §6)
// ---------------------------------------------------------------------------

/** Light mode — every value is locked in the Bible. */
const LIGHT_COLORS: ThemeColors = {
  primary: '#7C6BA8', // Dusk Violet
  secondary: '#F3B58C', // Warm Peach
  background: '#FBF7F4', // Soft Ivory Mist
  card: '#FFFFFF',
  accent: '#E8836B', // Ember Coral
  textPrimary: '#2E2A3D', // Ink Plum
  textSecondary: '#6E6880', // Muted Plum
  error: '#C4544A', // Soft Rust
  success: '#4F9E8C', // Sage Teal
};

/**
 * PROPOSED, NOT LOCKED — the Bible's dark table omitted dark-mode text colors.
 * These are the only two values in this file awaiting Phase 0.5 confirmation.
 * Replace with the official hexes once decided.
 */
const DARK_TEXT_PRIMARY = '#F3F0F7'; // soft near-white, faint plum warmth
const DARK_TEXT_SECONDARY = '#A29CB5'; // lightened muted plum

/**
 * Dark mode. Per the Bible, only Background and Cards change; all other hues stay
 * identical to light mode (brightness may be adjusted only if contrast demands it —
 * we keep them identical for now to stay literal).
 */
const DARK_COLORS: ThemeColors = {
  primary: '#7C6BA8', // same hue as light
  secondary: '#F3B58C', // same hue as light
  background: '#1B1A2E', // Deep Twilight
  card: '#26243D',
  accent: '#E8836B', // same hue as light
  textPrimary: DARK_TEXT_PRIMARY, // PROPOSED — see note above
  textSecondary: DARK_TEXT_SECONDARY, // PROPOSED — see note above
  error: '#C4544A', // same hue as light
  success: '#4F9E8C', // same hue as light
};

// ---------------------------------------------------------------------------
// Font roles
// ---------------------------------------------------------------------------

/**
 * Font family names. These strings must match the keys passed to `useFonts` in
 * src/app/_layout.tsx. Fonts are the same across light/dark, so one object is shared.
 */
const FONTS: ThemeFonts = {
  display: 'Fraunces_400Regular',
  displaySemiBold: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

// ---------------------------------------------------------------------------
// Assembled themes
// ---------------------------------------------------------------------------

export const lightTheme: Theme = {
  scheme: 'light',
  colors: LIGHT_COLORS,
  fonts: FONTS,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: DARK_COLORS,
  fonts: FONTS,
};

/** Look up a full theme by scheme. */
export const themes: Record<ColorScheme, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
