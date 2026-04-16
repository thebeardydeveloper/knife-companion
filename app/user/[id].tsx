import {
  View, StyleSheet, Pressable, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption, Label } from '../../src/components/ui';
import { PostCard } from '../../src/components/gallery/PostCard';
import { supabase } from '../../src/lib/supabase';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing } from '../../src/theme';
import type { Post, Profile } from '../../src/lib/supabase';

const AVATAR_SIZE = 72;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const isOwnProfile = currentUser?.id === id;

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

  // Follower / following counts
  const { data: followerCount = 0 } = useQuery<number>({
    queryKey: ['follower-count', id],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id);
      return count ?? 0;
    },
    staleTime: 1000 * 60,
  });

  const { data: followingCount = 0 } = useQuery<number>({
    queryKey: ['following-count', id],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', id);
      return count ?? 0;
    },
    staleTime: 1000 * 60,
  });

  // Is the current user following this profile?
  const { data: isFollowing = false } = useQuery<boolean>({
    queryKey: ['is-following', currentUser?.id, id],
    queryFn: async () => {
      if (!currentUser) return false;
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!currentUser && !isOwnProfile,
    staleTime: 1000 * 30,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) return;
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', currentUser?.id, id] });
      queryClient.invalidateQueries({ queryKey: ['follower-count', id] });
    },
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

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Label style={styles.statNumber}>{postCount}</Label>
                    <Caption style={styles.statLabel}>{t('profile.posts')}</Caption>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Label style={styles.statNumber}>{followerCount}</Label>
                    <Caption style={styles.statLabel}>{t('profile.followers')}</Caption>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Label style={styles.statNumber}>{followingCount}</Label>
                    <Caption style={styles.statLabel}>{t('profile.following')}</Caption>
                  </View>
                </View>
              </>
            )
          }
        </View>
      </View>

      {/* Follow button — only show for other users when logged in */}
      {!isOwnProfile && currentUser && (
        <View style={styles.followRow}>
          <Pressable
            onPress={() => followMutation.mutate()}
            disabled={followMutation.isPending}
            style={({ pressed }) => [
              styles.followBtn,
              isFollowing && styles.followBtnOutline,
              pressed && { opacity: 0.7 },
            ]}
          >
            {followMutation.isPending
              ? <ActivityIndicator size="small" color={isFollowing ? colors.accent : '#fff'} />
              : (
                <Label style={[styles.followBtnText, isFollowing && styles.followBtnTextOutline]}>
                  {isFollowing ? t('follow.unfollow') : t('follow.follow')}
                </Label>
              )
            }
          </Pressable>
        </View>
      )}

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
    alignItems: 'flex-start',
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
  profileInfo: { flex: 1, gap: 6 },
  username: { color: colors.textPrimary, fontSize: 18 },
  bio: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.sm,
  },
  statItem: { alignItems: 'center', gap: 1 },
  statNumber: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 11 },
  statDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 },
  followRow: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  followBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  followBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followBtnTextOutline: { color: colors.accent },
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
