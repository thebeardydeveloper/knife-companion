import { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, Pressable, FlatList, ActivityIndicator, Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, Body, Caption, Label } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import {
  getReadIds, getDismissedIds, markAllAsRead, dismissAnnouncement,
} from '../src/lib/announcementStorage';
import { colors, spacing } from '../src/theme';
import type { Announcement } from '../src/components/ui/AnnouncementsPanel';

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

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  item: Announcement;
  isRead: boolean;
  onDismiss: (id: string) => void;
  onPress: (item: Announcement) => void;
}

function AnnouncementRow({ item, isRead, onDismiss, onPress }: RowProps) {
  const translateX = new Animated.Value(0);
  const opacity    = new Animated.Value(1);

  const panResponder = PanResponder.create({
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
  });

  const accentColor = TYPE_COLOR[item.type];
  const date = new Date(item.published_at).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <Animated.View style={[styles.rowWrap, { transform: [{ translateX }], opacity }]}>
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        {...panResponder.panHandlers}
      >
        {/* Mail icon */}
        <Ionicons
          name={isRead ? 'mail-open-outline' : 'mail-outline'}
          size={22}
          color={isRead ? colors.textSecondary : accentColor}
          style={styles.mailIcon}
        />

        {/* Content */}
        <View style={styles.rowContent}>
          {/* Type badge + date */}
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { borderColor: accentColor + '55', backgroundColor: accentColor + '18' }]}>
              <Ionicons name={TYPE_ICON[item.type]} size={10} color={accentColor} />
              <Caption style={[styles.typeLabel, { color: accentColor }]}>
                {item.type.toUpperCase()}
              </Caption>
            </View>
            <Caption style={styles.dateText}>{date}</Caption>
          </View>

          <Body style={[styles.rowTitle, !isRead && styles.rowTitleUnread]}>
            {item.title}
          </Body>
          <Caption style={styles.rowBody}>{item.body}</Caption>
        </View>

        {item.post_id && (
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AnnouncementsScreen() {
  const router      = useRouter();
  const { t }       = useTranslation();
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [readIds,      setReadIds]      = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([getReadIds(), getDismissedIds()]).then(([r, d]) => {
      setReadIds(r);
      setDismissedIds(d);
    });
  }, []);

  const { data: allItems = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, body, type, post_id, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });
      return (data as Announcement[]) ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const visibleItems = allItems.filter((a) => !dismissedIds.has(a.id));

  // Mark all as read when screen opens
  useEffect(() => {
    if (!allItems.length) return;
    const ids = allItems.map((a) => a.id);
    markAllAsRead(ids).then(() =>
      setReadIds(new Set(ids)),
    );
  }, [allItems]);

  const handlePress = useCallback((item: Announcement) => {
    if (item.post_id) {
      router.push(`/post/${item.post_id}` as any);
    }
  }, [router]);

  const handleDismiss = useCallback(async (id: string) => {
    await dismissAnnouncement(id);
    setDismissedIds((prev) => new Set([...prev, id]));
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  }, [queryClient]);

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
        <H1 style={styles.headerTitle}>{t('announcements.title')}</H1>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
      ) : (
        <FlatList
          data={visibleItems}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
              <Caption style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
                {t('announcements.empty')}
              </Caption>
            </View>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  rowWrap: { backgroundColor: colors.surface },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  mailIcon: { width: 24, marginTop: 2 },
  rowContent: { flex: 1, gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateText: { color: colors.textSecondary, fontSize: 11 },
  rowTitle: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  rowTitleUnread: { fontWeight: '700' },
  rowBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  separator: { height: 1, backgroundColor: colors.border },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl * 2 },
});
