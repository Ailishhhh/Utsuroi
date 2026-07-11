import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

// Keep the native splash visible until fonts AND the initial session check are ready,
// so nothing flashes or "snaps" into place (motion rule).
SplashScreen.preventAutoHideAsync();

/**
 * Status bar icons that follow the active theme. Lives inside ThemeProvider so it
 * reflects the resolved scheme even when the user overrides the system (M1.8).
 */
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

/**
 * The auth gate. Redirects between the (auth) and (app) route groups based on session:
 * - signed out + trying to view the app  -> send to /login
 * - signed in  + sitting on an auth screen -> send to home
 * Waits for the initial session lookup before deciding, to avoid a wrong-way flash.
 */
function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

  // Reveal the app only once we know whether there's a session.
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
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

  if (!fontsLoaded && !fontError) {
    return null; // Splash stays up until fonts are ready.
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
