import { useState } from 'react';
import { View, StyleSheet, Image, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Body, Caption } from '../ui/Typography';
import { colors, spacing } from '../../theme';
import type { Post } from '../../lib/supabase';

interface Props {
  post: Post;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PostCard({ post }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  const allImages: string[] = post.image_urls?.length
    ? post.image_urls
    : post.image_url ? [post.image_url] : [];

  const hasMultiple = allImages.length > 1;
  const username = post.profiles?.username ?? 'User';
  const initials = username.slice(0, 2).toUpperCase();

  function onLayout(e: LayoutChangeEvent) {
    setCardWidth(e.nativeEvent.layout.width);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!cardWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setCurrentIndex(index);
  }

  function handlePress() {
    router.push(`/post/${post.id}` as any);
  }

  return (
    <View style={styles.card} onLayout={onLayout}>
      {/* ── Image slider — sin Pressable para que el swipe funcione ── */}
      {cardWidth > 0 && (
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            scrollEnabled={hasMultiple}
          >
            {allImages.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={[styles.image, { width: cardWidth }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.imageGradient}
            pointerEvents="none"
          />

          {/* Counter badge */}
          {hasMultiple && (
            <View style={styles.counter}>
              <Caption style={styles.counterText}>
                {currentIndex + 1}/{allImages.length}
              </Caption>
            </View>
          )}

          {/* Dots */}
          {hasMultiple && (
            <View style={styles.dots}>
              {allImages.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Content — presionable para ir al detalle ── */}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.content, pressed && { backgroundColor: colors.accentLight }]}
      >
        {/* Author row — el autor tiene su propio Pressable para ir al perfil */}
        <View style={styles.authorRow}>
          <Pressable
            onPress={() => router.push(`/user/${post.user_id}` as any)}
            style={({ pressed }) => [styles.authorPressable, pressed && { opacity: 0.6 }]}
            hitSlop={4}
          >
            <View style={styles.avatar}>
              {post.profiles?.avatar_url
                ? <Image source={{ uri: post.profiles.avatar_url }} style={styles.avatarImg} />
                : <Caption style={styles.avatarInitials}>{initials}</Caption>
              }
            </View>
            <View style={styles.authorInfo}>
              <Body style={styles.authorName}>{username}</Body>
              <Caption style={styles.timestamp}>{timeAgo(post.created_at)}</Caption>
            </View>
          </Pressable>
        </View>

        {/* Description */}
        {!!post.description && (
          <Body style={styles.description} numberOfLines={2}>{post.description}</Body>
        )}

        {/* Compact metadata hint */}
        {(post.steel_name || post.handle_materials?.length || post.blade_length_mm) && (
          <View style={styles.metaHint}>
            {!!post.steel_name && (
              <View style={styles.metaPill}>
                <Caption style={styles.metaPillText}>{post.steel_name}</Caption>
              </View>
            )}
            {post.handle_materials?.slice(0, 2).map((m, i) => (
              <View key={i} style={styles.metaPill}>
                <Caption style={styles.metaPillText}>{m}</Caption>
              </View>
            ))}
            {!!post.blade_length_mm && (
              <View style={[styles.metaPill, styles.metaPillAccent]}>
                <Caption style={styles.metaPillTextAccent}>{post.blade_length_mm}mm</Caption>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.bg,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  counter: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 32, height: 32 },
  avatarInitials: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  authorInfo: { flex: 1 },
  authorName: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  timestamp: { color: colors.textSecondary, fontSize: 11 },
  description: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  metaHint: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metaPill: {
    backgroundColor: colors.bg,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaPillAccent: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  metaPillText: { color: colors.textSecondary, fontSize: 12 },
  metaPillTextAccent: { color: colors.accent, fontSize: 12, fontWeight: '600' },
});
