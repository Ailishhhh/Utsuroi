import { StyleSheet, Text } from 'react-native';

import { AuthForm } from '@/components/AuthForm';
import { AuthScreen } from '@/components/AuthScreen';
import { NavLink } from '@/components/NavLink';
import type { Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useThemedStyles } from '@/hooks/useTheme';

/**
 * Sign-in screen. Thin: it wires the shared AuthForm to the auth actions and lets
 * the AuthProvider's session listener handle navigation on success.
 */
export default function Login() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const styles = useThemedStyles(getStyles);

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to continue."
      footer={
        <>
          <Text style={styles.footerText}>New to Utsuroi?</Text>
          <NavLink href="/signup" label="Create an account" />
        </>
      }
    >
      <AuthForm
        mode="signin"
        submitLabel="Sign in"
        onSubmit={signInWithEmail}
        onGoogle={signInWithGoogle}
      />
    </AuthScreen>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    footerText: {
      fontFamily: theme.fonts.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
  });
