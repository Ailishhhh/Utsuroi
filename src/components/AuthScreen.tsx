import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  /** The form body. */
  children: ReactNode;
  /** Footer content, e.g. a link to the other auth screen. */
  footer?: ReactNode;
}

/**
 * Shared shell for the auth screens: keyboard-aware, scrollable, themed, with a soft
 * fade-in. Keeps login/signup thin and visually consistent.
 */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  const styles = useThemedStyles(getStyles);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.inner}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    inner: {
      gap: 28,
    },
    header: {
      gap: 6,
    },
    title: {
      fontFamily: theme.fonts.displaySemiBold,
      fontSize: 36,
      color: theme.colors.primary,
    },
    subtitle: {
      fontFamily: theme.fonts.body,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
  });
