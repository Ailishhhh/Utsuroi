import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrisisMessage } from '@/components/CrisisMessage';
import { DisclosureBanner } from '@/components/DisclosureBanner';
import { TypingIndicator } from '@/components/TypingIndicator';
import type { Theme } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { sendMessage } from '@/services/chat';
import type { CrisisResource } from '@/types/chat';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  kind?: 'crisis';
  resources?: CrisisResource[];
}

/**
 * Chat screen. Soft fade + upward drift on bubbles, an organic typing pulse, an
 * AI-disclosure banner at session start, and distinct surfacing for crisis responses.
 * Message history is session-local for now (loading persisted history is a follow-up).
 */
export default function ChatScreen() {
  const { characterId, name } = useLocalSearchParams<{ characterId: string; name?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemedStyles(getStyles);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || !characterId) return;

    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);
    setSending(true);

    const result = await sendMessage(characterId, text);
    setSending(false);

    if (result.error !== null) {
      setError(result.error);
      return;
    }

    const { reply, safety, resources } = result.data;
    setMessages((prev) => [
      ...prev,
      safety === 'crisis'
        ? {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply,
            kind: 'crisis',
            resources: resources ?? [],
          }
        : { id: `a-${Date.now()}`, role: 'assistant', content: reply },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {name ?? 'Chat'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {showDisclosure ? <DisclosureBanner onDismiss={() => setShowDisclosure(false)} /> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <Text style={styles.hint}>Say hello to {name ?? 'your companion'}.</Text>
          ) : null}

          {messages.map((m) => (
            <Animated.View key={m.id} entering={FadeInUp.duration(360)}>
              {m.kind === 'crisis' ? (
                <CrisisMessage text={m.content} resources={m.resources ?? []} />
              ) : (
                <View
                  style={[
                    styles.bubble,
                    m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text style={m.role === 'user' ? styles.userText : styles.assistantText}>
                    {m.content}
                  </Text>
                </View>
              )}
            </Animated.View>
          ))}

          {sending ? (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <TypingIndicator />
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={theme.colors.textSecondary}
            editable={!sending}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[styles.send, sending || !input.trim() ? styles.sendDisabled : null]}
            accessibilityRole="button"
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    back: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 16,
      color: theme.colors.primary,
      width: 64,
    },
    headerSpacer: { width: 64 },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: theme.fonts.displaySemiBold,
      fontSize: 20,
      color: theme.colors.textPrimary,
    },
    messages: { padding: 16, gap: 10 },
    hint: {
      fontFamily: theme.fonts.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 24,
    },
    bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary },
    assistantBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.card },
    userText: { fontFamily: theme.fonts.body, fontSize: 16, lineHeight: 22, color: '#FFFFFF' },
    assistantText: {
      fontFamily: theme.fonts.body,
      fontSize: 16,
      lineHeight: 22,
      color: theme.colors.textPrimary,
    },
    errorText: {
      fontFamily: theme.fonts.body,
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      padding: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.textSecondary,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      fontFamily: theme.fonts.body,
      fontSize: 16,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.card,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    send: {
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
    },
    sendDisabled: { opacity: 0.5 },
    sendText: { fontFamily: theme.fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' },
  });
