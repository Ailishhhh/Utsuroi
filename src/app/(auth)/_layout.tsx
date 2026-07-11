import { Stack } from 'expo-router';

/**
 * Layout for the authentication flow (sign in / sign up). Screens are placeholders
 * in Phase 1; real auth is wired in M1.7. Soft fade transitions per the motion rule.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
