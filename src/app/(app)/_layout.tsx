import { Stack } from 'expo-router';

/**
 * Layout for the authenticated area of the app. For Phase 1 it holds only a
 * placeholder home; real screens arrive in later phases. Soft fade transitions per
 * the motion rule (no slides/snaps).
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
