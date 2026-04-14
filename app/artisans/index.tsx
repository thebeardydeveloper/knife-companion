import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H2, Body, Caption } from '../../src/components/ui';
import { Sidebar } from '../../src/components/ui/Sidebar';
import { ProfileButton } from '../../src/components/ui/ProfileButton';
import { PostCard } from '../../src/components/gallery/PostCard';
import { supabase } from '../../src/lib/supabase';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing } from '../../src/theme';
import type { Post } from '../../src/lib/supabase';

const PAGE_SIZE = 10;

async function fetchFeed(search: string | undefined, page: number): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (search) {
    query = query.or(
      `description.ilike.%${search}%,steel_name.ilike.%${search}%,extra_notes.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Post[]) ?? [];
}

export default function ArtisansScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isSearching = searchText.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const {
    data: feedData,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Post[]>({
    queryKey: ['feed', debouncedSearch],
    queryFn: ({ pageParam }) => fetchFeed(debouncedSearch || undefined, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: debouncedSearch ? 0 : 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  });

  const posts = feedData?.pages.flat() ?? [];

  function handleNewPost() {
    if (!user) router.push('/login' as any);
    else router.push('/new-post' as any);
  }

  function handleProfile() {
    if (!user) router.push('/login' as any);
    else router.push('/profile' as any);
  }

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: Post) => item.id, []);
  const isEmpty = !isLoading && posts.length === 0;

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

        <H2 style={styles.headerTitle}>{t('artisans.title')}</H2>

        <Pressable
          onPress={handleNewPost}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
        </Pressable>

        <ProfileButton user={user} size={30} onPress={handleProfile} />
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search') + '...'}
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textSecondary} />
          </Pressable>
        )}
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
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderPost}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          refreshControl={
            !isSearching
              ? <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={colors.accent}
                  colors={[colors.accent]}
                />
              : undefined
          }
          ListHeaderComponent={<View style={{ height: 1 }} />}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.accent} />
              : null
          }
          ListEmptyComponent={
            isLoading
              ? <ActivityIndicator style={styles.loader} color={colors.accent} size="large" />
              : isEmpty && isSearching
              ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={colors.border} />
                  <Caption style={styles.emptyText}>{t('common.noResults')}</Caption>
                </View>
              )
              : isEmpty
              ? (
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
              : null
          }
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentRoute="/artisans" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
  headerTitle: { flex: 1, fontSize: 18, marginLeft: spacing.xs },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
  list: { flexGrow: 1 },
  loader: { marginTop: spacing.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { color: colors.accent, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xl * 2, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: spacing.xl, paddingVertical: 12 },
  emptyBtnText: { color: '#0F0E0D', fontWeight: '700', fontSize: 15 },
});
