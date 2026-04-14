import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption, Label } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import { unregisterPushToken } from '../src/lib/notifications';
import { useAppStore } from '../src/store/useAppStore';
import { PostCard } from '../src/components/gallery/PostCard';
import { colors, spacing } from '../src/theme';
import type { Post, Profile } from '../src/lib/supabase';

// ─── Avatar upload ────────────────────────────────────────────────────────────

async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
  const bytes = decode(base64);
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: mime, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so image refreshes
  return `${data.publicUrl}?t=${Date.now()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const bioRef = useRef<TextInput>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['my-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data as Post[]) ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // ── Avatar mutation ───────────────────────────────────────────────────────

  const avatarMutation = useMutation({
    mutationFn: async (localUri: string) => {
      if (!user) return;
      const publicUrl = await uploadAvatar(user.id, localUri);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (error) throw error;
      return publicUrl;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
    onError: () => Alert.alert('Error', 'Could not update avatar. Try again.'),
  });

  // ── Bio mutation ──────────────────────────────────────────────────────────

  const bioMutation = useMutation({
    mutationFn: async (bio: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingBio(false);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: () => Alert.alert('Error', 'Could not save bio. Try again.'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      avatarMutation.mutate(result.assets[0].uri);
    }
  }

  function startEditBio() {
    setBioText(profile?.bio ?? '');
    setEditingBio(true);
    setTimeout(() => bioRef.current?.focus(), 100);
  }

  function cancelEditBio() {
    setEditingBio(false);
    setBioText('');
  }

  async function handleSignOut() {
    await unregisterPushToken();
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/');
  }

  // ── Not logged in ─────────────────────────────────────────────────────────

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
          <Body style={{ color: colors.textSecondary }}>Sign in to view your profile</Body>
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
  const postCount = posts?.length ?? 0;

  const ListHeader = (
    <>
      {/* Profile card */}
      <View style={styles.profileCard}>
        {/* Avatar */}
        <Pressable
          onPress={pickAvatar}
          style={({ pressed }) => [styles.avatarWrapper, pressed && { opacity: 0.75 }]}
          disabled={avatarMutation.isPending}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Caption style={styles.avatarInitials}>{initials}</Caption>
            </View>
          )}
          {avatarMutation.isPending ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          )}
        </Pressable>

        {/* Info */}
        <View style={styles.profileInfo}>
          <H3 style={styles.username}>{profile?.username ?? user.email}</H3>
          <Caption style={styles.emailText}>{user.email}</Caption>
          <Caption style={styles.postCount}>
            {postCount} {t('profile.posts')}
          </Caption>
        </View>
      </View>

      {/* Bio section */}
      <View style={styles.bioSection}>
        {editingBio ? (
          <View style={styles.bioEditContainer}>
            <TextInput
              ref={bioRef}
              value={bioText}
              onChangeText={setBioText}
              placeholder={t('profile.bioPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.bioInput}
              multiline
              maxLength={200}
            />
            <View style={styles.bioActions}>
              <Pressable
                onPress={cancelEditBio}
                style={({ pressed }) => [styles.bioBtn, pressed && { opacity: 0.7 }]}
              >
                <Caption style={{ color: colors.textSecondary }}>{t('post.cancel')}</Caption>
              </Pressable>
              <Pressable
                onPress={() => bioMutation.mutate(bioText)}
                disabled={bioMutation.isPending}
                style={({ pressed }) => [styles.bioBtnPrimary, pressed && { opacity: 0.7 }]}
              >
                {bioMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Caption style={styles.bioBtnPrimaryText}>{t('profile.save')}</Caption>
                }
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={startEditBio} style={({ pressed }) => [styles.bioDisplay, pressed && { opacity: 0.7 }]}>
            {profile?.bio
              ? <Body style={styles.bioText}>{profile.bio}</Body>
              : <Caption style={styles.bioPlaceholder}>{t('profile.bioPlaceholder')}</Caption>
            }
            <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} style={{ marginTop: 2 }} />
          </Pressable>
        )}
      </View>

      {/* Posts header */}
      <View style={styles.sectionHeader}>
        <Label style={styles.sectionLabel}>{t('profile.myPosts')}</Label>
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

const AVATAR_SIZE = 72;

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
  signOutBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  signOutText: { color: '#c0392b', fontSize: 13 },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrapper: { position: 'relative' },
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
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: { flex: 1, gap: 2 },
  username: { color: colors.textPrimary, fontSize: 18 },
  emailText: { color: colors.textSecondary, fontSize: 13 },
  postCount: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },

  // Bio
  bioSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
  },
  bioDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bioText: { flex: 1, color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  bioPlaceholder: { flex: 1, color: colors.textSecondary, fontStyle: 'italic' },
  bioEditContainer: { gap: spacing.sm },
  bioInput: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bioActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  bioBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  bioBtnPrimary: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, backgroundColor: colors.accent, minWidth: 60, alignItems: 'center' },
  bioBtnPrimaryText: { color: '#fff', fontWeight: '600' },

  // Posts
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
  emptyPosts: { padding: spacing.xl, alignItems: 'center' },

  // Not logged in
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  signInBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: spacing.xl, paddingVertical: 12 },
  signInBtnText: { color: colors.surface, fontWeight: '700' },
});
