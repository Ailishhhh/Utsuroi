import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AI_DISCLOSURE } from '@/constants/safety';
import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

/**
 * Dismissible AI-disclosure notice shown at the start of a chat session. Honest,
 * calm, and easy to dismiss once read — never nags.
 */
export function DisclosureBanner({ onDismiss }: { onDismiss: () => void }) {
  const styles = useThemedStyles(getStyles);
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.banner}>
      <Text style={styles.text}>{AI_DISCLOSURE}</Text>
      <View style={styles.actions}>
        <Pressable onPress={onDismiss} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.dismiss}>Got it</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    banner: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      padding: 14,
      borderRadius: 14,
      gap: 8,
    },
    text: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textSecondary,
    },
    actions: {
      alignItems: 'flex-end',
    },
    dismiss: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 14,
      color: theme.colors.primary,
    },
  });
