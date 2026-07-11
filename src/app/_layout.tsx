import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ThemeProvider, useTheme } from '@/hooks/useTheme';
// Importing the supabase client also imports config (M1.5), so required env vars are
// validated at startup and a misconfig fails fast right here.
import { supabase } from '@/lib/supabase';

// Keep the native splash visible until fonts are ready, so no text renders in a
// fallback font first (which would flash and then "snap" — against our motion rule).
SplashScreen.preventAutoHideAsync();

/**
 * Status bar icons that follow the active theme. Lives inside ThemeProvider so it
 * reflects the resolved scheme even when the user overrides the system (M1.8).
 */
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Hide the splash once fonts are ready (or if loading failed, so we never hang).
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // M1.6 connectivity check: confirm the app can reach Supabase at startup.
  // TEMPORARY — the M1.7 AuthProvider will own the session and replace this.
  useEffect(() => {
    if (__DEV__) {
      supabase.auth
        .getSession()
        .then(({ error }) => {
          console.log(
            error
              ? `[supabase] getSession error: ${error.message}`
              : '[supabase] connected — getSession resolved'
          );
        })
        .catch((e: unknown) => console.log('[supabase] getSession threw:', e));
    }
  }, []);

  if (!fontsLoaded && !fontError) {
    return null; // Splash stays up.
  }

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </ThemeProvider>
  );
}
