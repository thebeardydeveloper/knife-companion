import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H2, Body, Caption } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostThumb {
  id: string;
  user_id: string;
  image_url: string;
  image_urls: string[] | null;
}

interface ArtisanResult {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  recentPosts: PostThumb[];
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function searchArtisans(term: string): Promise<ArtisanResult[]> {
  if (!term.trim()) return [];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')
    .ilike('username', `%${term}%`)
    .order('username')
    .limit(20);

  if (error) throw error;
  if (!profiles?.length) return [];

  const ids = profiles.map((p) => p.id);

  const { data: posts } = await supabase
    .from('posts')
    .select('id, user_id, image_url, image_urls')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(ids.length * 6);

  // Group posts by user_id, max 5 per artisan
  const byUser: Record<string, PostThumb[]> = {};
  for (const post of (posts ?? []) as PostThumb[]) {
    if (!byUser[post.user_id]) byUser[post.user_id] = [];
    if (byUser[post.user_id].length < 5) byUser[post.user_id].push(post);
  }

  return profiles.map((p) => ({ ...p, recentPosts: byUser[p.id] ?? [] }));
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ArtisanSearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['artisan-search', debouncedSearch],
    queryFn: () => searchArtisans(debouncedSearch),
    enabled: debouncedSearch.length > 0,
    staleTime: 1000 * 30,
  });

  const renderArtisan = useCallback(({ item }: { item: ArtisanResult }) => (
    <ArtisanCard
      artisan={item}
      onPress={() => router.push(`/user/${item.id}` as any)}
    />
  ), [router]);

  const keyExtractor = useCallback((item: ArtisanResult) => item.id, []);

  const showEmpty = debouncedSearch.length > 0 && !isLoading && results.length === 0;
  const showPlaceholder = debouncedSearch.length === 0;

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
        <H2 style={styles.headerTitle}>{t('artisans.searchTitle')}</H2>
      </View>

      {/* Search input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('artisans.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Results */}
      {showPlaceholder ? (
        <View style={styles.placeholder}>
          <Ionicons name="people-outline" size={56} color={colors.border} />
          <Caption style={styles.placeholderText}>{t('artisans.searchPlaceholder')}</Caption>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.border} />
          <Caption style={styles.placeholderText}>{t('common.errorLoad')}</Caption>
        </View>
      ) : showEmpty ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={colors.border} />
          <Caption style={styles.placeholderText}>{t('artisans.noResults')}</Caption>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderArtisan}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

// ─── ArtisanCard ──────────────────────────────────────────────────────────────

interface ArtisanCardProps {
  artisan: ArtisanResult;
  onPress: () => void;
}

function ArtisanCard({ artisan, onPress }: ArtisanCardProps) {
  const { t } = useTranslation();
  const initials = artisan.username.slice(0, 2).toUpperCase();

  const thumbnails = artisan.recentPosts
    .map((p) => p.image_urls?.[0] ?? p.image_url)
    .filter(Boolean) as string[];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surfaceElevated }]}
    >
      {/* Profile row */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          {artisan.avatar_url
            ? <Image source={{ uri: artisan.avatar_url }} style={styles.avatarImg} />
            : (
              <Body style={styles.avatarInitials}>{initials}</Body>
            )
          }
        </View>
        <View style={styles.profileInfo}>
          <Body style={styles.username}>{artisan.username}</Body>
          {artisan.bio ? (
            <Caption style={styles.bio} numberOfLines={1}>{artisan.bio}</Caption>
          ) : null}
          {artisan.recentPosts.length > 0 && (
            <Caption style={styles.postCount}>
              {artisan.recentPosts.length < 5
                ? `${artisan.recentPosts.length} ${t('artisans.noPosts')}`
                : `5+ ${t('artisans.noPosts')}`}
            </Caption>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>

      {/* Thumbnail carousel */}
      {thumbnails.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {thumbnails.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.thumb} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { flex: 1, fontSize: 18 },
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
  list: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  placeholderText: { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: { width: 44, height: 44 },
  avatarInitials: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  profileInfo: { flex: 1, gap: 2 },
  username: { fontWeight: '700', fontSize: 15, color: colors.textPrimary },
  bio: { color: colors.textSecondary, fontSize: 13 },
  postCount: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },

  // Carousel
  carousel: { marginTop: spacing.sm },
  carouselContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
});
