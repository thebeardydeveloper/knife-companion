import { useState, useRef } from 'react';
import {
  View, StyleSheet, Image, ScrollView, Pressable, ActivityIndicator,
  NativeSyntheticEvent, NativeScrollEvent, Dimensions, Alert, ActionSheetIOS, Platform,
  TextInput, KeyboardAvoidingView, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H3, Body, Caption, Label } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing } from '../../src/theme';
import type { Post, PostComment } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

async function fetchPost(id: string): Promise<Post> {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Post;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<TextInput>(null);

  const { data: post, isLoading, isError, refetch, isRefetching } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    staleTime: 1000 * 60 * 5,
  });

  // ── Likes ──────────────────────────────────────────────────────────────────

  const { data: likeData } = useQuery({
    queryKey: ['likes', id],
    queryFn: async () => {
      const [countRes, userRes] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
        user
          ? supabase.from('post_likes').select('post_id').eq('post_id', id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { count: countRes.count ?? 0, liked: !!userRes.data };
    },
    staleTime: 0,
  });

  const likeMutation = useMutation({
    mutationFn: async (currentlyLiked: boolean) => {
      if (!user) { router.push('/login' as any); return; }
      if (currentlyLiked) {
        await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['likes', id] }),
  });

  // ── Comments ───────────────────────────────────────────────────────────────

  const { data: comments, refetch: refetchComments } = useQuery<PostComment[]>({
    queryKey: ['comments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, profiles(username, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as PostComment[]) ?? [];
    },
    staleTime: 0,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) { router.push('/login' as any); return; }
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: id, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', id] }),
  });

  function handleSubmitComment() {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(trimmed);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('post.cancel'), t('post.delete')], destructiveButtonIndex: 1, cancelButtonIndex: 0, title: t('post.deleteConfirmTitle'), message: t('post.deleteConfirmMsg') },
        async (i) => { if (i === 1) await doDelete(); }
      );
    } else {
      Alert.alert(t('post.deleteConfirmTitle'), t('post.deleteConfirmMsg'), [
        { text: t('post.cancel'), style: 'cancel' },
        { text: t('post.deleteConfirm'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  async function doDelete() {
    await supabase.from('posts').delete().eq('id', id);
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
    router.replace('/');
  }

  function showMenu() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('post.cancel'), t('post.edit'), t('post.delete')], destructiveButtonIndex: 2, cancelButtonIndex: 0 },
        (i) => { if (i === 1) router.push(`/post/edit/${id}` as any); if (i === 2) handleDelete(); }
      );
    } else {
      Alert.alert('', '', [
        { text: t('post.edit'), onPress: () => router.push(`/post/edit/${id}` as any) },
        { text: t('post.delete'), style: 'destructive', onPress: handleDelete },
        { text: t('post.cancel'), style: 'cancel' },
      ]);
    }
  }

  function showReportMenu() {
    Alert.alert(
      t('post.reportConfirmTitle'),
      t('post.reportConfirmMsg'),
      [
        { text: t('post.cancel'), style: 'cancel' },
        { text: t('post.report'), style: 'destructive', onPress: handleReport },
      ]
    );
  }

  async function handleReport() {
    if (!user) { router.push('/login' as any); return; }
    await supabase.from('post_reports').insert({ post_id: id, reporter_id: user.id });
    Alert.alert('', t('post.reportSent'));
  }

  // ── Image scroll ───────────────────────────────────────────────────────────

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  const allImages: string[] = post?.image_urls?.length ? post.image_urls : post?.image_url ? [post.image_url] : [];
  const hasMultiple = allImages.length > 1;
  const totalMm = post?.blade_length_mm && post?.handle_length_mm ? post.blade_length_mm + post.handle_length_mm : null;
  const isOwner = !!user && !!post && user.id === post.user_id;

  if (isLoading) {
    return <View style={[st.screen, { paddingTop: insets.top }]}><ActivityIndicator style={{ flex: 1 }} color={colors.accent} /></View>;
  }
  if (isError || !post) {
    return (
      <View style={[st.screen, { paddingTop: insets.top }]}>
        <BackHeader onBack={() => router.back()} />
        <View style={st.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.border} />
          <Body style={{ color: colors.textSecondary }}>{t('common.errorLoad')}</Body>
          <Pressable onPress={() => refetch()} style={({ pressed }) => [st.retryBtn, pressed && { opacity: 0.7 }]}>
            <Body style={{ color: colors.accent, fontWeight: '600' }}>{t('common.retry')}</Body>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[st.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); refetchComments(); }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >

        {/* ── Image slider ── */}
        <View style={st.imageContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={hasMultiple}>
            {allImages.map((uri, i) => (
              <Image key={i} source={{ uri }} style={st.image} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Back */}
          <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* Owner menu / Report button */}
          {isOwner ? (
            <Pressable onPress={showMenu} hitSlop={12} style={({ pressed }) => [st.menuBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
            </Pressable>
          ) : user ? (
            <Pressable onPress={showReportMenu} hitSlop={12} style={({ pressed }) => [st.menuBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="flag-outline" size={18} color="#fff" />
            </Pressable>
          ) : null}

          {/* Counter */}
          {hasMultiple && (
            <View style={st.counter}>
              <Caption style={st.counterText}>{currentIndex + 1}/{allImages.length}</Caption>
            </View>
          )}

          {/* Dots */}
          {hasMultiple && (
            <View style={st.dots}>
              {allImages.map((_, i) => (
                <View key={i} style={[st.dot, i === currentIndex && st.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={st.body}>
          {/* Description */}
          {!!post.description && <H3 style={st.title}>{post.description}</H3>}

          {/* Likes */}
          <View style={st.likesRow}>
            <Pressable
              onPress={() => likeMutation.mutate(likeData?.liked ?? false)}
              disabled={likeMutation.isPending}
              style={({ pressed }) => [st.likeBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons
                name={likeData?.liked ? 'heart' : 'heart-outline'}
                size={22}
                color={likeData?.liked ? '#e74c3c' : colors.textSecondary}
              />
              {(likeData?.count ?? 0) > 0 && (
                <Caption style={[st.likeCount, likeData?.liked && st.likeCountActive]}>
                  {likeData?.count}
                </Caption>
              )}
            </Pressable>
          </View>

          {/* Steel + Handle */}
          {(post.steel_id || post.handle_materials?.length) && (
            <View style={st.metaRow}>
              {!!post.steel_id && (
                <Pressable onPress={() => router.push(`/steel/${post.steel_id}` as any)} style={({ pressed }) => [st.metaBlock, pressed && { opacity: 0.7 }]}>
                  <Caption style={st.metaLabel}>STEEL</Caption>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Label style={st.metaValue}>{post.steel_name ?? post.steel_id}</Label>
                    <Ionicons name="chevron-forward" size={12} color={colors.accent} />
                  </View>
                </Pressable>
              )}
              {post.handle_materials?.length && (
                <View style={[st.metaBlock, post.steel_id && st.metaBlockBorder]}>
                  <Caption style={st.metaLabel}>HANDLE</Caption>
                  <Label style={st.metaValue}>{post.handle_materials.join(', ')}</Label>
                </View>
              )}
            </View>
          )}

          {/* Dimensions */}
          {(post.blade_length_mm || post.blade_width_mm || post.handle_length_mm) && (
            <View style={st.dimSection}>
              <Caption style={st.dimSectionLabel}>DIMENSIONS</Caption>
              <View style={st.dimGrid}>
                <View style={st.dimRow}>
                  <DimBlock label="BLADE" value={post.blade_length_mm ? `${post.blade_length_mm}mm` : '—'} />
                  <DimBlock label="WIDTH" value={post.blade_width_mm ? `${post.blade_width_mm}mm` : '—'} />
                </View>
                <View style={st.dimRow}>
                  <DimBlock label="HANDLE" value={post.handle_length_mm ? `${post.handle_length_mm}mm` : '—'} />
                  <DimBlock label="TOTAL" value={totalMm ? `${totalMm}mm` : '—'} accent />
                </View>
              </View>
            </View>
          )}

          {/* Extra notes */}
          {!!post.extra_notes && (
            <View style={st.notesSection}>
              <Body style={st.notesText}>{post.extra_notes}</Body>
            </View>
          )}

          {/* ── Comments ── */}
          <View style={st.commentsSection}>
            <Caption style={st.commentsSectionLabel}>{t('post.commentsHeader').toUpperCase()}</Caption>

            {comments?.length === 0 && (
              <Caption style={st.noComments}>{t('post.noComments')}</Caption>
            )}

            {comments?.map((c) => {
              const isOwnComment = !!user && c.user_id === user.id;
              const cUsername = c.profiles?.username ?? 'User';
              const cInitials = cUsername.slice(0, 2).toUpperCase();
              return (
                <View key={c.id} style={st.commentRow}>
                  <Pressable onPress={() => router.push(`/user/${c.user_id}` as any)} hitSlop={4}>
                    <View style={st.commentAvatar}>
                      {c.profiles?.avatar_url
                        ? <Image source={{ uri: c.profiles.avatar_url }} style={st.commentAvatarImg} />
                        : <Caption style={st.commentAvatarInitials}>{cInitials}</Caption>
                      }
                    </View>
                  </Pressable>
                  <View style={st.commentBubble}>
                    <Pressable onPress={() => router.push(`/user/${c.user_id}` as any)} hitSlop={4}>
                      <Caption style={st.commentUsername}>{cUsername}</Caption>
                    </Pressable>
                    <Body style={st.commentContent}>{c.content}</Body>
                  </View>
                  {isOwnComment && (
                    <Pressable
                      onPress={() => deleteCommentMutation.mutate(c.id)}
                      hitSlop={8}
                      disabled={deleteCommentMutation.isPending}
                      style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Comment input footer ── */}
      <View style={[st.commentInputBar, { paddingBottom: insets.bottom || spacing.md }]}>
        {user ? (
          <>
            <TextInput
              ref={commentInputRef}
              style={st.commentInput}
              placeholder={t('post.commentPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={handleSubmitComment}
              blurOnSubmit={false}
              multiline={false}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
              style={({ pressed }) => [st.sendBtn, pressed && { opacity: 0.7 }]}
            >
              {addCommentMutation.isPending
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Ionicons name="send" size={18} color={commentText.trim() ? colors.accent : colors.border} />
              }
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => router.push('/login' as any)} style={st.signInToComment}>
            <Caption style={st.signInToCommentText}>{t('post.signInToComment')}</Caption>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function BackHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={st.fallbackHeader}>
      <Pressable onPress={onBack} hitSlop={12} style={({ pressed }) => [{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.6 }]}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

function DimBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[dSt.block, accent && dSt.blockAccent]}>
      <Caption style={[dSt.label, accent && dSt.labelAccent]}>{label}</Caption>
      <Label style={[dSt.value, accent && dSt.valueAccent]}>{value}</Label>
    </View>
  );
}
const dSt = StyleSheet.create({
  block: { flex: 1, backgroundColor: colors.bg, borderRadius: 10, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  blockAccent: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  label: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  labelAccent: { color: colors.accent },
  value: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  valueAccent: { color: colors.accent },
});

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  fallbackHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  retryBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  imageContainer: { position: 'relative' },
  image: { width: SCREEN_WIDTH, aspectRatio: 4 / 3, backgroundColor: colors.bg },
  backBtn: { position: 'absolute', top: spacing.md, left: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  menuBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', top: spacing.md, right: spacing.md + 44, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dots: { position: 'absolute', bottom: spacing.sm, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { padding: spacing.md, gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: '700' },
  likesRow: { flexDirection: 'row', alignItems: 'center' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.xs, paddingRight: spacing.md },
  likeCount: { color: colors.textSecondary, fontSize: 14 },
  likeCountActive: { color: '#e74c3c' },
  metaRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  metaBlock: { flex: 1, padding: spacing.md, gap: 4 },
  metaBlockBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  metaLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  metaValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dimSection: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  dimSectionLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  dimGrid: { gap: spacing.sm },
  dimRow: { flexDirection: 'row', gap: spacing.sm },
  notesSection: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  notesText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  // Comments section
  commentsSection: { gap: spacing.sm },
  commentsSectionLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  noComments: { color: colors.textSecondary, fontStyle: 'italic' },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 2 },
  commentAvatarImg: { width: 30, height: 30 },
  commentAvatarInitials: { color: colors.accent, fontWeight: '700', fontSize: 11 },
  commentBubble: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: 2 },
  commentUsername: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  commentContent: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  // Comment input bar
  commentInputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  commentInput: { flex: 1, backgroundColor: colors.bg, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 8, fontSize: 14, color: colors.textPrimary },
  sendBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  signInToComment: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  signInToCommentText: { color: colors.accent, fontWeight: '600' },
});
