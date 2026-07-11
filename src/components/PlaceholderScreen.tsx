import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface PlaceholderScreenProps {
  /** Large display title (Fraunces). */
  title: string;
  /** Optional supporting line (Inter). */
  subtitle?: string;
  /** Optional content, typically NavLinks. */
  children?: ReactNode;
}

/**
 * A themed, centered placeholder used by the Phase 1 navigation shell before real
 * screens exist. Reusable so every placeholder looks consistent and we avoid
 * duplicating layout markup. Content fades in softly (motion rule: breathes, never pings).
 */
export function PlaceholderScreen({ title, subtitle, children }: PlaceholderScreenProps) {
  const styles = useThemedStyles(getStyles);
  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children ? <View style={styles.links}>{children}</View> : null}
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 8,
    },
    title: {
      fontFamily: theme.fonts.displaySemiBold,
      fontSize: 40,
      color: theme.colors.primary,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: theme.fonts.body,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    links: {
      marginTop: 24,
      alignItems: 'center',
    },
  });
