import { Link, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface NavLinkProps {
  /** Target route (typed by Expo Router's typedRoutes). */
  href: Href;
  /** Visible link text. */
  label: string;
}

/**
 * A themed navigation link built on Expo Router's <Link>. Presentational only —
 * it navigates, nothing more. Used by the placeholder screens in the nav shell.
 */
export function NavLink({ href, label }: NavLinkProps) {
  const styles = useThemedStyles(getStyles);
  return (
    <Link href={href} style={styles.link}>
      {label}
    </Link>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    link: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 16,
      color: theme.colors.primary,
      paddingVertical: 8,
    },
  });
