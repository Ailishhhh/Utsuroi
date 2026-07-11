import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import type { Theme } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

interface TextFieldProps extends TextInputProps {
  /** Field label shown above the input. */
  label: string;
  /** Validation/error message shown below the input, if any. */
  error?: string;
}

/**
 * A themed labeled text input with an error slot. Presentational only — validation
 * and state live in the parent form.
 */
export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(getStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={theme.colors.textSecondary}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    input: {
      fontFamily: theme.fonts.body,
      fontSize: 16,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.colors.card,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    error: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.error,
    },
  });
