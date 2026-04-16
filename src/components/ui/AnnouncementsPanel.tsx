import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, Pressable, FlatList, Animated,
  PanResponder, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Body, Caption, Label } from './Typography';
import { supabase } from '../../lib/supabase';
import {
  getReadIds, getDismissedIds, markAsRead, dismissAnnouncement,
} from '../../lib/announcementStorage';
import { colors, spacing } from '../../theme';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'update' | 'event' | 'feature' | 'news';
  post_id: string | null;
  news_id: string | null;
  published_at: string;
}

const TYPE_ICON: Record<Announcement['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  update:  'refresh-circle-outline',
  event:   'calendar-outline',
  feature: 'sparkles-outline',
  news:    'newspaper-outline',
};

const TYPE_COLOR: Record<Announcement['type'], string> = {
  update:  '#5BB8F5',
  event:   '#4CAF7D',
  feature: '#A87FE8',
  news:    colors.accent,
};

const PANEL_MAX = 5;

// ── Single row with swipe-to-dismiss ─────────────────────────────────────────

interface RowProps {
  item: Announcement;
  isRead: boolean;
  onDismiss: (id: string) => void;
  onPress: (item: Announcement) => void;
}

function AnnouncementRow({ item, isRead, onDismiss, onPress }: RowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { dx }) => {
        if (dx > 0) translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > 80) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: 400, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
          ]).start(() => onDismiss(item.id));
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const accentColor = TYPE_COLOR[item.type];
  const iconName    = isRead ? 'mail-open-outline' : 'mail-outline';

  return (
    <Animated.View style={[styles.rowWrap, { transform: [{ translateX }], opacity }]}>
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        {...panResponder.panHandlers}
      >
        {/* Left: mail icon */}
        <Ionicons
          name={iconName}
          size={20}
          color={isRead ? colors.textSecondary : accentColor}
          style={styles.mailIcon}
        />

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTitleRow}>
            <Ionicons name={TYPE_ICON[item.type]} size={12} color={accentColor} />
            <Body
              numberOfLines={1}
              style={[styles.rowTitle, !isRead && styles.rowTitleUnread]}
            >
              {item.title}
            </Body>
          </View>
          <Caption numberOfLines={2} style={styles.rowBody}>{item.body}</Caption>
        </View>

        {/* Chevron if linked to a post */}
        {item.post_id && (
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when unread count changes so the bell can update its badge */
  onUnreadCountChange?: (count: number) => void;
}

export function AnnouncementsPanel({ visible, onClose, onUnreadCountChange }: Props) {
  const { t }    = useTranslation();
  const router   = useRouter();
  const queryClient = useQueryClient();

  const [readIds,      setReadIds]      = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load persisted state on mount so the badge count is accurate immediately
  useEffect(() => {
    Promise.all([getReadIds(), getDismissedIds()]).then(([r, d]) => {
      setReadIds(r);
      setDismissedIds(d);
    });
  }, []);

  // Reload when panel opens in case state changed elsewhere (e.g. announcements screen)
  useEffect(() => {
    if (!visible) return;
    Promise.all([getReadIds(), getDismissedIds()]).then(([r, d]) => {
      setReadIds(r);
      setDismissedIds(d);
    });
  }, [visible]);

  const { data: allItems = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, body, type, post_id, news_id, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });
      return (data as Announcement[]) ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const visible5 = allItems
    .filter((a) => !dismissedIds.has(a.id))
    .slice(0, PANEL_MAX);

  // Notify parent of unread count for badge
  useEffect(() => {
    const unread = allItems.filter(
      (a) => !readIds.has(a.id) && !dismissedIds.has(a.id),
    ).length;
    onUnreadCountChange?.(unread);
  }, [allItems, readIds, dismissedIds, onUnreadCountChange]);

  const handlePress = useCallback(async (item: Announcement) => {
    await markAsRead(item.id);
    setReadIds((prev) => new Set([...prev, item.id]));
    if (item.post_id) {
      onClose();
      router.push(`/post/${item.post_id}` as any);
    } else if (item.news_id) {
      onClose();
      router.push(`/news/${item.news_id}` as any);
    }
  }, [onClose, router]);

  const handleDismiss = useCallback(async (id: string) => {
    await dismissAnnouncement(id);
    setDismissedIds((prev) => new Set([...prev, id]));
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  }, [queryClient]);

  const handleViewAll = () => {
    onClose();
    router.push('/announcements' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <Label style={styles.panelTitle}>{t('announcements.title')}</Label>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* List */}
          {isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ margin: spacing.lg }} />
          ) : visible5.length === 0 ? (
            <Caption style={styles.empty}>{t('announcements.empty')}</Caption>
          ) : (
            <FlatList
              data={visible5}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => (
                <AnnouncementRow
                  item={item}
                  isRead={readIds.has(item.id)}
                  onDismiss={handleDismiss}
                  onPress={handlePress}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              scrollEnabled={false}
            />
          )}

          {/* Footer */}
          {allItems.filter((a) => !dismissedIds.has(a.id)).length > 0 && (
            <Pressable
              onPress={handleViewAll}
              style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.7 }]}
            >
              <Label style={styles.viewAllText}>{t('announcements.viewAll')}</Label>
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,  // below header
    paddingRight: spacing.md,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: 320,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  rowWrap: {
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  mailIcon: { width: 22 },
  rowContent: { flex: 1, gap: 2 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowTitle: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  rowTitleUnread: { fontWeight: '700' },
  rowBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  separator: { height: 1, backgroundColor: colors.border },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewAllText: { color: colors.accent, fontSize: 13 },
});
