import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, Body, Caption } from '../src/components/ui';
import { Sidebar } from '../src/components/ui/Sidebar';
import { PostCard } from '../src/components/gallery/PostCard';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/store/useAppStore';
import { colors, spacing } from '../src/theme';
import type { Post } from '../src/lib/supabase';

async function fetchFeed(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as Post[]) ?? [];
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: posts, isLoading, isError, refetch, isRefetching } = useQuery<Post[]>({
    queryKey: ['feed'],
    queryFn: fetchFeed,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 30,
  });

  function handleNewPost() {
    if (!user) {
      router.push('/login' as any);
    } else {
      router.push('/new-post' as any);
    }
  }

  function handleProfile() {
    if (!user) {
      router.push('/login' as any);
    } else {
      router.push('/profile' as any);
    }
  }

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setSidebarOpen(true)}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="menu" size={26} color={colors.textPrimary} />
        </Pressable>

        <H1 style={styles.headerTitle}>{t('common.appName')}</H1>

        <Pressable
          onPress={handleNewPost}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
        </Pressable>

        <Pressable
          onPress={handleProfile}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons
            name={user ? 'person-circle' : 'person-circle-outline'}
            size={26}
            color={user ? colors.accent : colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Feed */}
      {isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.border} />
          <Body style={styles.errorText}>{t('home.feed.loadError')}</Body>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
          >
            <Body style={styles.retryText}>{t('common.retry')}</Body>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts ?? []}
          keyExtractor={keyExtractor}
          renderItem={renderPost}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListHeaderComponent={<View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            isLoading
              ? <ActivityIndicator style={styles.loader} color={colors.accent} size="large" />
              : (
                <View style={styles.emptyState}>
                  <Ionicons name="images-outline" size={56} color={colors.border} />
                  <Caption style={styles.emptyText}>{t('home.feed.empty')}</Caption>
                  <Pressable
                    onPress={handleNewPost}
                    style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.7 }]}
                  >
                    <Body style={styles.emptyBtnText}>{t('gallery.newPost')}</Body>
                  </Pressable>
                </View>
              )
          }
        />
      )}

      {/* Sidebar — posicionado sobre el contenido */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute="/"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    marginLeft: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 1,
  },
  loader: {
    marginTop: spacing.xl * 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.accent,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
