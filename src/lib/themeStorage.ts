/**
 * themeStorage.ts — persistence for the user's theme preference.
 *
 * The theme preference (light / dark / system) is NOT sensitive, so AsyncStorage is
 * the right store here — SecureStore is reserved for credentials (see supabase.ts).
 * All reads/writes are defensive: theming should never crash because storage hiccuped.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeMode } from '@/constants/theme';

const THEME_MODE_KEY = 'utsuroi.themeMode';
const VALID_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (VALID_MODES as readonly string[]).includes(value);
}

/** Returns the saved theme preference, or null if none is stored / on error. */
export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_MODE_KEY);
    return isThemeMode(value) ? value : null;
  } catch (e) {
    if (__DEV__) {
      console.log('[themeStorage] failed to read theme mode:', e);
    }
    return null;
  }
}

/** Persists the theme preference. Failures are logged in dev but never thrown. */
export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  } catch (e) {
    if (__DEV__) {
      console.log('[themeStorage] failed to save theme mode:', e);
    }
  }
}
