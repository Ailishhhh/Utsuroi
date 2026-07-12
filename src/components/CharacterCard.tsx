import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import type { Character } from '@/types/character';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CharacterCardProps {
  character: Character;
  /** Optional press handler. Navigation to a character opens in a later milestone. */
  onPress?: () => void;
}

/**
 * Presentational card for one character: name (Fraunces — a character name is an
 * "emotional moment"), essence (Inter), and category tag. Presses give a soft,
 * gentle scale-lift — tactile, never a snap or bounce (motion rule).
 */
export function CharacterCard({ character, onPress }: CharacterCardProps) {
  const styles = useThemedStyles(getStyles);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 150 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 220 });
      }}
      style={[styles.card, animatedStyle]}
    >
      <Text style={styles.name}>{character.name}</Text>
      <Text style={styles.essence}>{character.essence}</Text>
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{character.category_tag}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      gap: 10,
      // Soft, low shadow — a gentle sense of lift, not a hard drop.
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    name: {
      fontFamily: theme.fonts.displaySemiBold,
      fontSize: 24,
      color: theme.colors.textPrimary,
    },
    essence: {
      fontFamily: theme.fonts.body,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    tagRow: {
      flexDirection: 'row',
    },
    tag: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    tagText: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 12,
      color: theme.colors.primary,
    },
  });
