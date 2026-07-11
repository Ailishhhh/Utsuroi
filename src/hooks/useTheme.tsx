/**
 * useTheme.tsx — the single source of truth for the active theme at runtime.
 *
 * Responsibilities:
 * - Resolve the active `Theme` from the user's preference (`ThemeMode`) and, when
 *   that preference is 'system', the OS color scheme.
 * - Expose the theme + a setter to the whole app via React Context.
 *
 * The chosen mode is persisted (M1.8): loaded from storage on mount and saved on
 * every change, so a user's override survives app restarts.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { themes, type ColorScheme, type Theme, type ThemeMode } from '@/constants/theme';
import { getStoredThemeMode, setStoredThemeMode } from '@/lib/themeStorage';

interface ThemeContextValue {
  /** The fully-resolved active theme (colors + fonts). */
  theme: Theme;
  /** The active scheme after resolving 'system' against the OS. */
  scheme: ColorScheme;
  /** The user's raw preference ('light' | 'dark' | 'system'). */
  mode: ThemeMode;
  /** Update the preference and persist it. */
  setMode: (mode: ThemeMode) => void;
  /** False until the saved preference has been loaded (used to gate the splash). */
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  /** Optional starting mode; defaults to following the system. */
  initialMode?: ThemeMode;
}

/**
 * Wraps the app and provides the active theme. Reads the OS color scheme so that,
 * when mode is 'system', the app tracks the device automatically.
 */
export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [isReady, setIsReady] = useState(false);

  // Load the saved preference once on mount, then mark theme ready.
  useEffect(() => {
    getStoredThemeMode()
      .then((stored) => {
        if (stored) {
          setModeState(stored);
        }
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  // Update the preference in memory and persist it (fire-and-forget; storage errors
  // are handled inside setStoredThemeMode and never block the UI).
  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void setStoredThemeMode(next);
  }, []);

  // useColorScheme() can return 'light' | 'dark' | 'unspecified' | null; anything
  // that isn't explicitly 'dark' resolves to our default light scheme.
  const resolvedSystemScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';

  // When mode is 'system' we follow the OS; otherwise the explicit override wins.
  const scheme: ColorScheme = mode === 'system' ? resolvedSystemScheme : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[scheme], scheme, mode, setMode, isReady }),
    [scheme, mode, setMode, isReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the active theme and controls. Throws if used outside a ThemeProvider so
 * mistakes surface immediately rather than as a confusing "undefined" later.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return ctx;
}

/**
 * Helper for building themed StyleSheets without recomputing them on every render.
 *
 * Usage:
 *   const getStyles = (theme: Theme) => StyleSheet.create({ ... });  // module scope
 *   const styles = useThemedStyles(getStyles);
 *
 * Keep `factory` defined at module scope so its identity is stable.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
