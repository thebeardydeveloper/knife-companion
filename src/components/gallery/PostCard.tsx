import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Body, Caption } from '../ui/Typography';
import { colors, spacing } from '../../theme';
import type { Post } from '../../lib/supabase';

interface Props {
  post: Post;
  onPress?: () => void;
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const isEs = locale.startsWith('es');

  if (mins < 1) return isEs ? 'ahora' : 'just now';
  if (mins < 60) return isEs ? `hace ${mins}m` : `${mins}m ago`;
  if (hours < 24) return isEs ? `hace ${hours}h` : `${hours}h ago`;
  if (days < 7) return isEs ? `hace ${days}d` : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(locale);
}

export function PostCard({ post, onPress }: Props) {
  const username = post.profiles?.username ?? 'User';
  const initials = username.slice(0, 2).toUpperCase();
  const locale = 'en'; // TODO: pass from i18n context

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Image */}
      <Image
        source={{ uri: post.image_url }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            {post.profiles?.avatar_url ? (
              <Image source={{ uri: post.profiles.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Caption style={styles.avatarInitials}>{initials}</Caption>
            )}
          </View>
          <View style={styles.authorInfo}>
            <Body style={styles.authorName}>{username}</Body>
            <Caption style={styles.timestamp}>{timeAgo(post.created_at, locale)}</Caption>
          </View>
        </View>

        {/* Description */}
        {!!post.description && (
          <Body style={styles.description} numberOfLines={3}>
            {post.description}
          </Body>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 36,
    height: 36,
  },
  avatarInitials: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
