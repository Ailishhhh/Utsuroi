import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { signInSchema, signUpSchema, type AuthResult } from '@/services/auth';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  /** Called with validated credentials when the primary button is pressed. */
  onSubmit: (email: string, password: string) => Promise<AuthResult>;
  /** Called when "Continue with Google" is pressed. */
  onGoogle: () => Promise<AuthResult>;
  /** Primary button label, e.g. "Sign in" / "Create account". */
  submitLabel: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Shared email/password auth form used by both the sign-in and sign-up screens.
 * Handles client-side Zod validation, per-field error display, a form-level message,
 * and independent loading states for the submit and Google actions.
 */
export function AuthForm({ mode, onSubmit, onGoogle, submitLabel }: AuthFormProps) {
  const styles = useThemedStyles(getStyles);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<{ text: string; kind: 'error' | 'info' } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const busy = submitting || googleLoading;

  async function handleSubmit() {
    setFormMessage(null);
    const schema = mode === 'signup' ? signUpSchema : signInSchema;
    const parsed = schema.safeParse({ email: email.trim(), password });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email' && !next.email) next.email = issue.message;
        if (key === 'password' && !next.password) next.password = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    const result = await onSubmit(parsed.data.email, parsed.data.password);
    setSubmitting(false);

    if (result.error) {
      setFormMessage({ text: result.error, kind: 'error' });
    } else if (result.info) {
      setFormMessage({ text: result.info, kind: 'info' });
    }
    // On plain success, the auth listener redirects us away — nothing to show.
  }

  async function handleGoogle() {
    setFormMessage(null);
    setFieldErrors({});
    setGoogleLoading(true);
    const result = await onGoogle();
    setGoogleLoading(false);
    if (result.error) {
      setFormMessage({ text: result.error, kind: 'error' });
    }
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        inputMode="email"
        textContentType="emailAddress"
        editable={!busy}
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        autoCapitalize="none"
        secureTextEntry
        textContentType={mode === 'signup' ? 'newPassword' : 'password'}
        editable={!busy}
        placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
      />

      {formMessage ? (
        <Text style={formMessage.kind === 'error' ? styles.errorText : styles.infoText}>
          {formMessage.text}
        </Text>
      ) : null}

      <Button label={submitLabel} onPress={handleSubmit} loading={submitting} disabled={busy} />

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      <Button
        label="Continue with Google"
        variant="outline"
        onPress={handleGoogle}
        loading={googleLoading}
        disabled={busy}
      />
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    form: {
      gap: 16,
    },
    errorText: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
      color: theme.colors.error,
    },
    infoText: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
      color: theme.colors.success,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    divider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.textSecondary,
      opacity: 0.4,
    },
    dividerText: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
  });
