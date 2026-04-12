import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption, Label } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/store/useAppStore';
import { PostCard } from '../src/components/gallery/PostCard';
import { colors, spacing } from '../src/theme';
import type { Post, Profile } from '../src/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['my-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data as Post[]) ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/');
  }

  if (!user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <H1 style={styles.headerTitle}>{t('profile.title')}</H1>
        </View>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={64} color={colors.border} />
          <Body style={styles.emptyText}>Sign in to view your profile</Body>
          <Pressable
            onPress={() => router.push('/login' as any)}
            style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.7 }]}
          >
            <Label style={styles.signInBtnText}>{t('login.title')}</Label>
          </Pressable>
        </View>
      </View>
    );
  }

  const initials = (profile?.username ?? user.email ?? 'U').slice(0, 2).toUpperCase();

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
        <H1 style={styles.headerTitle}>{t('profile.title')}</H1>
        <Pressable
          onPress={handleSignOut}
          hitSlop={12}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.6 }]}
        >
          <Label style={styles.signOutText}>{t('profile.signOut')}</Label>
        </Pressable>
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Profile card */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Caption style={styles.avatarInitials}>{initials}</Caption>
              </View>
              <View>
                <H3 style={styles.username}>{profile?.username ?? user.email}</H3>
                <Caption style={styles.emailText}>{user.email}</Caption>
              </View>
            </View>

            {/* Posts header */}
            <View style={styles.sectionHeader}>
              <Label style={styles.sectionLabel}>{t('profile.myPosts')}</Label>
            </View>
          </>
        }
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
            : (
              <View style={styles.emptyPosts}>
                <Caption style={styles.emptyPostsText}>{t('profile.noPosts')}</Caption>
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
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  signOutText: {
    color: '#c0392b',
    fontSize: 13,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 20,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  emailText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  signInBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  signInBtnText: {
    color: colors.surface,
    fontWeight: '700',
  },
  emptyPosts: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyPostsText: {
    color: colors.textSecondary,
  },
});
