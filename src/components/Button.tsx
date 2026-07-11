import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import type { Theme } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'outline';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses while true. */
  loading?: boolean;
}

/**
 * A themed button with primary and outline variants and a loading state.
 * Presentational — behavior comes from the `onPress` passed by the parent.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  ...pressableProps
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(getStyles);
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : theme.colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelOutline]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 54,
    },
    primary: {
      backgroundColor: theme.colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    // Gentle press feedback — a soft fade, never a snap (motion rule).
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 16,
    },
    labelPrimary: {
      color: '#FFFFFF',
    },
    labelOutline: {
      color: theme.colors.primary,
    },
  });
