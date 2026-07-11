import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Theme, ThemeMode } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

function labelFor(mode: ThemeMode): string {
  return mode[0].toUpperCase() + mode.slice(1);
}

/**
 * A small segmented control to choose Light / Dark / System. This is the "mechanism"
 * for M1.8 (no full Settings screen yet). The choice is persisted by the ThemeProvider,
 * so it survives app restarts.
 */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(getStyles);

  return (
    <View style={styles.segment}>
      {MODES.map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setMode(m)}
            style={[styles.item, active ? styles.itemActive : null]}
          >
            <Text style={[styles.text, active ? styles.textActive : null]}>{labelFor(m)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    segment: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      alignSelf: 'stretch',
    },
    item: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    itemActive: {
      backgroundColor: theme.colors.primary,
    },
    text: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    textActive: {
      color: '#FFFFFF',
    },
  });
