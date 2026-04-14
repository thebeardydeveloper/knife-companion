import {
  View, StyleSheet, Pressable, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption } from '../../src/components/ui';
import { PostCard } from '../../src/components/gallery/PostCard';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme';
import type { Post, Profile } from '../../src/lib/supabase';

const AVATAR_SIZE = 72;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      return data ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['user-posts', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      return (data as Post[]) ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const username = profile?.username ?? '...';
  const initials = username.slice(0, 2).toUpperCase();
  const postCount = posts?.length ?? 0;

  const ListHeader = (
    <>
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            : (
              <View style={styles.avatarPlaceholder}>
                <Caption style={styles.avatarInitials}>{initials}</Caption>
              </View>
            )
          }
        </View>
        <View style={styles.profileInfo}>
          {profileLoading
            ? <ActivityIndicator color={colors.accent} />
            : (
              <>
                <H3 style={styles.username}>{username}</H3>
                {!!profile?.bio && <Body style={styles.bio}>{profile.bio}</Body>}
                <Caption style={styles.postCount}>{postCount} {t('profile.posts')}</Caption>
              </>
            )
          }
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Caption style={styles.sectionLabel}>{t('profile.myPosts').toUpperCase()}</Caption>
      </View>
    </>
  );

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
        <H1 style={styles.headerTitle}>{username}</H1>
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={
          postsLoading
            ? <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
            : (
              <View style={styles.emptyPosts}>
                <Caption style={{ color: colors.textSecondary }}>{t('profile.noPosts')}</Caption>
              </View>
            )
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
  headerTitle: { flex: 1 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrapper: {},
  avatarImage: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: colors.accent, fontWeight: '700', fontSize: 22 },
  profileInfo: { flex: 1, gap: 4 },
  username: { color: colors.textPrimary, fontSize: 18 },
  bio: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  postCount: { color: colors.textSecondary, fontSize: 12 },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  emptyPosts: { padding: spacing.xl, alignItems: 'center' },
});
