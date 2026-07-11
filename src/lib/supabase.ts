/**
 * supabase.ts — the single Supabase client for the whole app.
 *
 * Every backend interaction (auth now; chat, memory, etc. later) goes through this
 * one client. Create it once, import it everywhere. It reads validated values from
 * `config` (M1.5), so a missing env var fails fast before we ever get here.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { config } from '@/lib/config';
import type { Database } from '@/types/database';

const isWeb = Platform.OS === 'web';

/**
 * Storage adapter backing Supabase's session persistence.
 *
 * Native: expo-secure-store keeps tokens in the device keychain/keystore — the right
 * place for sensitive credentials (per the Engineering Bible, not plain AsyncStorage).
 *
 * ⚠️ TODO (before shipping Google OAuth widely — see M1.7): SecureStore has a ~2KB
 * per-value limit. Email/password sessions fit, but OAuth sessions carry more user
 * metadata and can exceed it on some devices. If that happens, upgrade this adapter to
 * the official "LargeSecureStore" pattern (encrypt the value, keep the key in
 * SecureStore, store ciphertext in AsyncStorage). Kept simple for now on purpose.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/**
 * The app-wide Supabase client, typed against our (currently empty) Database schema.
 *
 * On web, SecureStore doesn't exist, so we let supabase-js use its default storage
 * (localStorage). On native we use the SecureStore adapter above.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      // Persist the session so users stay signed in across app restarts.
      persistSession: true,
      // Refresh access tokens automatically before they expire.
      autoRefreshToken: true,
      // Native uses deep links for OAuth (handled in M1.7), not URL parsing.
      detectSessionInUrl: false,
      storage: isWeb ? undefined : SecureStoreAdapter,
    },
  }
);

/**
 * Auto-refresh should run only while the app is in the foreground. This is the
 * standard React Native pattern from the Supabase docs: start refreshing when the app
 * becomes active, stop when it's backgrounded (saving battery/network).
 */
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
