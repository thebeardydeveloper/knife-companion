import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { H1, H3, Body, Caption, Label } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme';
import type { Post } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

async function fetchPost(id: string): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Post;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: post, isLoading, isError, refetch } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    staleTime: 1000 * 60 * 5,
  });

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }

  const allImages: string[] = post?.image_urls?.length
    ? post.image_urls
    : post?.image_url ? [post.image_url] : [];

  const hasMultiple = allImages.length > 1;

  const totalMm = post?.blade_length_mm && post?.handle_length_mm
    ? post.blade_length_mm + post.handle_length_mm
    : null;

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (isError || !post) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header onBack={() => router.back()} />
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.border} />
          <Body style={styles.errorText}>{t('common.errorLoad')}</Body>
          <Pressable onPress={() => refetch()} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}>
            <Body style={styles.retryText}>{t('common.retry')}</Body>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {/* ── Image slider ── */}
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
              <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Back button over image */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* Counter */}
          {hasMultiple && (
            <View style={styles.counter}>
              <Caption style={styles.counterText}>{currentIndex + 1}/{allImages.length}</Caption>
            </View>
          )}

          {/* Dots indicator */}
          {hasMultiple && (
            <View style={styles.dots}>
              {allImages.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Description / title */}
          {!!post.description && (
            <H3 style={styles.title}>{post.description}</H3>
          )}

          {/* ── Metadata grid: Steel + Handle ── */}
          {(post.steel_id || (post.handle_materials && post.handle_materials.length > 0)) && (
            <View style={styles.metaRow}>
              {!!post.steel_id && (
                <Pressable
                  onPress={() => router.push(`/steel/${post.steel_id}` as any)}
                  style={({ pressed }) => [styles.metaBlock, pressed && { opacity: 0.7 }]}
                >
                  <Caption style={styles.metaBlockLabel}>STEEL</Caption>
                  <View style={styles.metaBlockValueRow}>
                    <Label style={styles.metaBlockValue}>{post.steel_name ?? post.steel_id}</Label>
                    <Ionicons name="chevron-forward" size={12} color={colors.accent} />
                  </View>
                </Pressable>
              )}
              {post.handle_materials && post.handle_materials.length > 0 && (
                <View style={[styles.metaBlock, post.steel_id && styles.metaBlockBorderLeft]}>
                  <Caption style={styles.metaBlockLabel}>HANDLE</Caption>
                  <Label style={styles.metaBlockValue}>
                    {post.handle_materials.join(', ')}
                  </Label>
                </View>
              )}
            </View>
          )}

          {/* ── Dimensions ── */}
          {(post.blade_length_mm || post.blade_width_mm || post.handle_length_mm) && (
            <View style={styles.dimensionsSection}>
              <Caption style={styles.dimensionsSectionLabel}>DIMENSIONS</Caption>
              <View style={styles.dimensionsGrid}>
                <View style={styles.dimensionsRow}>
                  <DimBlock label="BLADE" value={post.blade_length_mm ? `${post.blade_length_mm}mm` : '—'} />
                  <DimBlock label="WIDTH" value={post.blade_width_mm ? `${post.blade_width_mm}mm` : '—'} />
                </View>
                <View style={styles.dimensionsRow}>
                  <DimBlock label="HANDLE" value={post.handle_length_mm ? `${post.handle_length_mm}mm` : '—'} />
                  <DimBlock label="TOTAL" value={totalMm ? `${totalMm}mm` : '—'} accent />
                </View>
              </View>
            </View>
          )}

          {/* ── Extra notes ── */}
          {!!post.extra_notes && (
            <View style={styles.notesSection}>
              <Body style={styles.notesText}>{post.extra_notes}</Body>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

function DimBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[dimSt.block, accent && dimSt.blockAccent]}>
      <Caption style={[dimSt.label, accent && dimSt.labelAccent]}>{label}</Caption>
      <Label style={[dimSt.value, accent && dimSt.valueAccent]}>{value}</Label>
    </View>
  );
}

const dimSt = StyleSheet.create({
  block: {
    flex: 1,
    minWidth: 70,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockAccent: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  label: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  labelAccent: { color: colors.accent },
  value: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  valueAccent: { color: colors.accent },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { color: colors.accent, fontWeight: '600' },
  imageContainer: { position: 'relative' },
  image: { width: SCREEN_WIDTH, aspectRatio: 4 / 3, backgroundColor: colors.bg },
  backBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
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
  body: { padding: spacing.md, gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  metaBlock: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  metaBlockBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  metaBlockLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metaBlockValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaBlockValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dimensionsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  dimensionsSectionLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dimensionsGrid: { gap: spacing.sm },
  dimensionsRow: { flexDirection: 'row', gap: spacing.sm },
  notesSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  notesText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
