import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { Theme, ThemeMode } from '@/constants/theme';

/**
 * Temporary theme showcase screen (M1.3 test surface).
 *
 * It exists to verify the locked tokens render correctly in light and dark and that
 * switching modes updates everything. It will be replaced by real screens later — no
 * product logic lives here.
 */
export default function Index() {
  const { theme, mode, setMode } = useTheme();
  const styles = useThemedStyles(getStyles);

  // Named swatches so we can eyeball every locked token at once.
  const swatches: { label: string; color: string; onColor?: string }[] = [
    { label: 'Primary', color: theme.colors.primary, onColor: '#FFFFFF' },
    { label: 'Secondary', color: theme.colors.secondary, onColor: theme.colors.textPrimary },
    { label: 'Accent', color: theme.colors.accent, onColor: '#FFFFFF' },
    { label: 'Success', color: theme.colors.success, onColor: '#FFFFFF' },
    { label: 'Error', color: theme.colors.error, onColor: '#FFFFFF' },
    { label: 'Card', color: theme.colors.card, onColor: theme.colors.textPrimary },
  ];

  const modes: ThemeMode[] = ['light', 'dark', 'system'];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>Utsuroi</Text>
          <Text style={styles.subtitle}>the place where your companion changes with you</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.section}>
          <Text style={styles.sectionLabel}>Theme mode</Text>
          <View style={styles.segment}>
            {modes.map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>Active scheme: {theme.scheme}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(250).duration(500)} style={styles.card}>
          <Text style={styles.cardTitle}>Color tokens</Text>
          <View style={styles.swatchGrid}>
            {swatches.map((s) => (
              <View key={s.label} style={[styles.swatch, { backgroundColor: s.color }]}>
                <Text
                  style={[styles.swatchLabel, { color: s.onColor ?? theme.colors.textPrimary }]}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(350).duration(500)} style={styles.section}>
          <Text style={styles.sectionLabel}>Buttons</Text>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.buttonText}>Primary action</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.buttonText}>Accent action</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(450).duration(500)} style={styles.section}>
          <Text style={styles.sectionLabel}>Typography</Text>
          <Text style={styles.displaySample}>Fraunces — for emotional moments</Text>
          <Text style={styles.bodySample}>
            Inter — for everything you read often. Clear, calm, unhurried.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Styles are built from the active theme. Defined at module scope so `useThemedStyles`
 * can memoize on theme identity. No raw hex values live in this screen except the
 * white/token-derived text placed on top of colored swatches/buttons.
 */
const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 24,
      gap: 28,
    },
    title: {
      fontFamily: theme.fonts.displaySemiBold,
      fontSize: 44,
      color: theme.colors.primary,
    },
    subtitle: {
      fontFamily: theme.fonts.display,
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    section: {
      gap: 12,
    },
    sectionLabel: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: theme.colors.textSecondary,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    segmentItemActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentText: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: '#FFFFFF',
    },
    hint: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      gap: 16,
    },
    cardTitle: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 18,
      color: theme.colors.textPrimary,
    },
    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    swatch: {
      width: '30%',
      minWidth: 96,
      flexGrow: 1,
      height: 72,
      borderRadius: 14,
      justifyContent: 'flex-end',
      padding: 10,
    },
    swatchLabel: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 13,
    },
    button: {
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonText: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    displaySample: {
      fontFamily: theme.fonts.display,
      fontSize: 24,
      color: theme.colors.textPrimary,
    },
    bodySample: {
      fontFamily: theme.fonts.body,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textPrimary,
    },
  });
