import { useEffect, useState } from 'react';
import {
  View, StyleSheet, Pressable, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { H1, Caption } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme';

interface NewsArticle {
  id: string;
  title: string;
  body_html: string;
  cover_url: string | null;
  published_at: string;
}

// HTML shell que inyectamos con la paleta Dark Forge
function buildHtml(body: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #0F0E0D;
      color: #F2EDE6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 16px;
      line-height: 1.75;
      padding: 20px;
      -webkit-text-size-adjust: 100%;
    }
    h1 { font-size: 1.6rem; font-weight: 700; margin: 1.2rem 0 0.4rem; letter-spacing: -0.5px; }
    h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.3rem; }
    h3 { font-size: 1.05rem; font-weight: 600; margin: 0.8rem 0 0.3rem; }
    p  { margin: 0.6rem 0; }
    strong { font-weight: 700; }
    em     { font-style: italic; }
    u      { text-decoration: underline; }
    s      { text-decoration: line-through; color: #8A837A; }
    ul { list-style: disc;     padding-left: 1.4rem; margin: 0.5rem 0; }
    ol { list-style: decimal;  padding-left: 1.4rem; margin: 0.5rem 0; }
    li { margin: 0.2rem 0; }
    blockquote {
      border-left: 3px solid #E8571A;
      padding-left: 1rem;
      margin: 0.8rem 0;
      color: #8A837A;
      font-style: italic;
    }
    code {
      background: #1A1917;
      border: 1px solid #2C2A27;
      border-radius: 4px;
      padding: 0.1em 0.35em;
      font-family: monospace;
      font-size: 0.875em;
      color: #A87FE8;
    }
    pre {
      background: #1A1917;
      border: 1px solid #2C2A27;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 0.75rem 0;
    }
    pre code { background: none; border: none; padding: 0; color: #F2EDE6; }
    a    { color: #E8571A; }
    img  { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; border: 1px solid #2C2A27; }
    hr   { border: none; border-top: 1px solid #2C2A27; margin: 1.2rem 0; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export default function NewsArticleScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [webViewHeight, setWebViewHeight] = useState(400);

  const { data: article, isLoading } = useQuery<NewsArticle | null>({
    queryKey: ['news-article', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('news_articles')
        .select('id, title, body_html, cover_url, published_at')
        .eq('id', id)
        .single();
      return (data as NewsArticle) ?? null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const dateStr = article?.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <H1 style={styles.headerTitle} numberOfLines={1}>
          {article?.title ?? ''}
        </H1>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
      ) : !article ? (
        <View style={styles.center}>
          <Caption style={{ color: colors.textSecondary }}>Noticia no encontrada.</Caption>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover image */}
          {!!article.cover_url && (
            <Image
              source={{ uri: article.cover_url }}
              style={styles.cover}
              resizeMode="cover"
            />
          )}

          {/* Meta */}
          <View style={styles.meta}>
            <Caption style={styles.date}>{dateStr}</Caption>
          </View>

          {/* Body via WebView */}
          <WebView
            originWhitelist={['*']}
            source={{ html: buildHtml(article.body_html) }}
            style={{ height: webViewHeight, backgroundColor: colors.bg }}
            scrollEnabled={false}
            onMessage={(e) => setWebViewHeight(Number(e.nativeEvent.data))}
            injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight);"
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { flex: 1, fontSize: 16 },
  iconBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll:      { flex: 1 },
  cover: {
    width: '100%',
    height: 220,
  },
  meta: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  date:        { color: colors.textSecondary, fontSize: 12 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
