import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CategoryTabs } from '@/components/CategoryTabs';
import { CharacterCard } from '@/components/CharacterCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useCharacters } from '@/hooks/useCharacters';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

/**
 * Home / character list (route "/") — the landing screen after sign-in. Shows the
 * companions, filterable by category. Data comes entirely from useCharacters; this
 * component only renders (Clean Architecture).
 *
 * The theme toggle + sign-out live in a small footer here for now; they move to a
 * dedicated Settings screen in a later milestone. Tapping a card opens that character's
 * chat.
 */
export default function Home() {
  const { characters, isLoading, error, reload } = useCharacters();
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useThemedStyles(getStyles);

  const [selected, setSelected] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(characters.map((c) => c.category_tag))),
    [characters]
  );

  const visible = useMemo(
    () => (selected ? characters.filter((c) => c.category_tag === selected) : characters),
    [characters, selected]
  );

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Companions</Text>
          <Text style={styles.subtitle}>Each one a little different.</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Button label="Try again" variant="outline" onPress={reload} />
          </View>
        ) : characters.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No companions yet.</Text>
          </View>
        ) : (
          <>
            {categories.length > 1 ? (
              <CategoryTabs categories={categories} selected={selected} onSelect={setSelected} />
            ) : null}

            <View style={styles.list}>
              {visible.map((character, index) => (
                <Animated.View
                  key={character.id}
                  entering={FadeInDown.delay(index * 60).duration(400)}
                >
                  <CharacterCard
                    character={character}
                    onPress={() =>
                      router.push({
                        pathname: '/chat/[characterId]',
                        params: { characterId: character.id, name: character.name },
                      })
                    }
                  />
                </Animated.View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Appearance</Text>
          <ThemeToggle />
          <Button label="Sign out" variant="outline" onPress={handleSignOut} loading={signingOut} />
        </View>
      </ScrollView>
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
      padding: 24,
      gap: 20,
    },
    header: {
      gap: 4,
    },
    title: {
      fontFamily: theme.fonts.displaySemiBold,
      fontSize: 40,
      color: theme.colors.primary,
    },
    subtitle: {
      fontFamily: theme.fonts.body,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    centered: {
      paddingVertical: 48,
      alignItems: 'center',
      gap: 16,
    },
    errorText: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 15,
      color: theme.colors.error,
      textAlign: 'center',
    },
    emptyText: {
      fontFamily: theme.fonts.display,
      fontSize: 18,
      color: theme.colors.textSecondary,
    },
    list: {
      gap: 16,
    },
    footer: {
      marginTop: 12,
      paddingTop: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.textSecondary,
      gap: 12,
    },
    footerLabel: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: theme.colors.textSecondary,
    },
  });
