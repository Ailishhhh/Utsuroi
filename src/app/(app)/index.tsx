import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useThemedStyles } from '@/hooks/useTheme';

/**
 * Placeholder home screen (route "/") — the signed-in landing spot for Phase 1.
 * Shows who's signed in and offers sign-out so the auth loop is testable. Real home
 * content arrives in later phases.
 */
export default function Home() {
  const { session, signOut } = useAuth();
  const styles = useThemedStyles(getStyles);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    // The auth listener will redirect to /login; reset state in case of failure.
    setSigningOut(false);
  }

  return (
    <PlaceholderScreen title="Utsuroi" subtitle="You're signed in. Home screen coming soon.">
      {session?.user.email ? <Text style={styles.email}>{session.user.email}</Text> : null}
      <ThemeToggle />
      <Button label="Sign out" variant="outline" onPress={handleSignOut} loading={signingOut} />
    </PlaceholderScreen>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    email: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
  });
