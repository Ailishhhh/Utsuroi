import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface CategoryTabsProps {
  /** Distinct category values. */
  categories: string[];
  /** Currently selected category, or null for "All". */
  selected: string | null;
  onSelect: (category: string | null) => void;
}

/**
 * Horizontal, scrollable category filter. An "All" tab plus one per distinct
 * category_tag. Presentational — the parent owns the selection state and filtering.
 */
export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  const styles = useThemedStyles(getStyles);

  const renderTab = (label: string, value: string | null) => {
    const active = selected === value;
    return (
      <Pressable
        key={value ?? '__all__'}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onSelect(value)}
        style={[styles.tab, active ? styles.tabActive : null]}
      >
        <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {renderTab('All', null)}
      {categories.map((c) => renderTab(c, c))}
    </ScrollView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      gap: 8,
      paddingVertical: 4,
    },
    tab: {
      backgroundColor: theme.colors.card,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
  });
