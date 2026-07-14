import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

/** A single gently-pulsing dot. */
function Dot({ delay }: { delay: number }) {
  const styles = useThemedStyles(getStyles);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Slow breathing loop — soft, never a sharp blink (motion rule).
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })),
        -1,
        false
      )
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

/** Three dots breathing in a staggered rhythm — the character is "thinking". */
export function TypingIndicator() {
  const styles = useThemedStyles(getStyles);
  return (
    <View style={styles.row} accessibilityLabel="typing">
      <Dot delay={0} />
      <Dot delay={160} />
      <Dot delay={320} />
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.textSecondary,
    },
  });
