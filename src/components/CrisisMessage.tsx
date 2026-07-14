import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Theme } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import type { CrisisResource } from '@/types/chat';

/** Extracts the first dialable number from a contact string, or null if none. */
function firstDialable(contact: string): string | null {
  const match = contact.match(/[0-9][0-9-]{2,}/);
  return match ? match[0].replace(/-/g, '') : null;
}

/**
 * Distinct, calm rendering for a crisis response. Set apart from normal chat bubbles
 * (accent-bordered card), shows the supportive message, and turns each resource into a
 * tappable "Call" action where a number is available. Not alarming — supportive.
 */
export function CrisisMessage({ text, resources }: { text: string; resources: CrisisResource[] }) {
  const styles = useThemedStyles(getStyles);

  const dial = (digits: string) => {
    Linking.openURL(`tel:${digits}`).catch(() => {
      // If the device can't place calls, the number is still shown in the text above.
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
      {resources.length > 0 ? (
        <View style={styles.actions}>
          {resources.map((resource, index) => {
            const number = firstDialable(resource.contact);
            if (number) {
              return (
                <Pressable
                  key={index}
                  style={styles.callButton}
                  onPress={() => dial(number)}
                  accessibilityRole="button"
                >
                  <Text style={styles.callText}>
                    Call {number} · {resource.region}
                  </Text>
                </Pressable>
              );
            }
            return (
              <Text key={index} style={styles.note}>
                {resource.name}: {resource.contact}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      alignSelf: 'stretch',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.accent,
      padding: 16,
      gap: 14,
    },
    text: {
      fontFamily: theme.fonts.body,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textPrimary,
    },
    actions: {
      gap: 8,
    },
    callButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    callText: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 15,
      color: '#FFFFFF',
    },
    note: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });
