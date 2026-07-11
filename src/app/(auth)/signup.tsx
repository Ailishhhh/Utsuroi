import { StyleSheet, Text } from 'react-native';

import { AuthForm } from '@/components/AuthForm';
import { AuthScreen } from '@/components/AuthScreen';
import { NavLink } from '@/components/NavLink';
import type { Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useThemedStyles } from '@/hooks/useTheme';

/**
 * Sign-up screen. Thin: wires the shared AuthForm to the sign-up actions. On success
 * (or an "confirm your email" prompt) the AuthForm/AuthProvider handle the rest.
 */
export default function Signup() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const styles = useThemedStyles(getStyles);

  return (
    <AuthScreen
      title="Begin"
      subtitle="Create your account."
      footer={
        <>
          <Text style={styles.footerText}>Already have an account?</Text>
          <NavLink href="/login" label="Sign in" />
        </>
      }
    >
      <AuthForm
        mode="signup"
        submitLabel="Create account"
        onSubmit={signUpWithEmail}
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
