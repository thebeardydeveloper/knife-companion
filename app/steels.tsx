import { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Searchbar } from 'react-native-paper';
import { FilterChips, H2, Body, Label, UniversalList } from '../src/components/ui';
import { SteelListItem } from '../src/components/steel/SteelListItem';
import { useSteels } from '../src/hooks/useSteels';
import { useAppStore } from '../src/store/useAppStore';
import { colors, spacing } from '../src/theme';
import type { SteelCategory } from '../src/types/steel';
import type { SteelSummary } from '../src/api/steels';

const MAX_COMPARE = 3;

export default function SteelsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SteelCategory | 'all'>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const comparePreselect = useAppStore((s) => s.comparePreselect);
  const setComparePreselect = useAppStore((s) => s.setComparePreselect);

  // Activa el modo comparación con el acero preseleccionado al volver del detalle
  useEffect(() => {
    if (comparePreselect) {
      setCompareMode(true);
      setSelectedIds(new Set([comparePreselect]));
      setComparePreselect(null);
    }
  }, [comparePreselect]);

  const categories: { value: SteelCategory | 'all'; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'carbon', label: t('categories.carbon') },
    { value: 'spring', label: t('categories.spring') },
    { value: 'bearing', label: t('categories.bearing') },
    { value: 'alloy', label: t('categories.alloy') },
    { value: 'tool_oil', label: t('categories.tool_oil') },
    { value: 'tool_water', label: t('categories.tool_water') },
    { value: 'tool_air', label: t('categories.tool_air') },
    { value: 'tool_german', label: t('categories.tool_german') },
    { value: 'stainless', label: t('categories.stainless') },
    { value: 'semi_stainless', label: t('categories.semi_stainless') },
    { value: 'pm', label: t('categories.pm') },
  ];

  const { data: steels = [], isLoading, isError, refetch } = useSteels(
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return steels;
    const q = search.toLowerCase();
    return steels.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [steels, search]);

  function toggleCompareMode() {
    setCompareMode((m) => !m);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string, name: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  }

  function handleItemPress(steel: SteelSummary) {
    if (compareMode) {
      toggleSelect(steel.id, steel.name);
    } else {
      router.push(`/steel/${steel.id}`);
    }
  }

  function startComparison() {
    if (selectedIds.size < 2) return;
    router.push(`/compare?ids=${Array.from(selectedIds).join(',')}`);
  }

  const selectedCount = selectedIds.size;
  const canCompare = selectedCount >= 2;
  const floatingBarBottom = insets.bottom + spacing.md;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <H2 style={styles.title}>{t('home.sections.encyclopedia')}</H2>
          <Pressable
            onPress={toggleCompareMode}
            style={({ pressed }) => [
              styles.compareBtn,
              compareMode && styles.compareBtnActive,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
          >
            <Label style={[styles.compareBtnText, compareMode && styles.compareBtnTextActive]}>
              {compareMode ? t('compare.cancel') : t('compare.button')}
            </Label>
          </Pressable>
        </View>

        <Searchbar
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          elevation={0}
        />
      </View>

      {/* Filter chips */}
      <FilterChips
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
          <Body style={styles.errorText}>{t('common.errorLoad')}</Body>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
          >
            <Ionicons name="refresh" size={16} color={colors.accent} />
            <Body style={styles.retryText}>{t('common.retry')}</Body>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
          <Body style={styles.errorText}>{t('common.noResults')}</Body>
        </View>
      ) : (
        <UniversalList
          data={filtered}
          keyExtractor={(item: SteelSummary) => item.id}
          renderItem={({ item }: { item: SteelSummary }) => (
            <SteelListItem
              steel={item}
              onPress={() => handleItemPress(item)}
              compareMode={compareMode}
              selected={selectedIds.has(item.id)}
            />
          )}
          estimatedItemSize={80}
          contentContainerStyle={{
            paddingBottom: compareMode
              ? floatingBarBottom + 64 + spacing.md
              : insets.bottom + spacing.md,
          }}
        />
      )}

      {/* Floating comparison bar */}
      {compareMode && (
        <View style={[styles.floatingBar, { bottom: floatingBarBottom }]}>
          <Body style={styles.floatingCount}>
            {selectedCount === 0
              ? t('compare.button')
              : Array.from(selectedIds)
                  .map((id) => steels.find((s) => s.id === id)?.name ?? id)
                  .join('  ·  ')}
          </Body>
          <Pressable
            onPress={startComparison}
            disabled={!canCompare}
            style={({ pressed }) => [
              styles.floatingBtn,
              !canCompare && styles.floatingBtnDisabled,
              pressed && canCompare && styles.floatingBtnPressed,
            ]}
          >
            <Label style={[styles.floatingBtnText, !canCompare && styles.floatingBtnTextDisabled]}>
              {t('compare.startButton_other', { count: selectedCount })}
            </Label>
            <Ionicons
              name="git-compare-outline"
              size={16}
              color={canCompare ? colors.surface : colors.textSecondary}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 72,
    alignItems: 'center',
  },
  compareBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  compareBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  compareBtnTextActive: {
    color: colors.accent,
  },
  searchbar: {
    marginHorizontal: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    height: 42,
  },
  searchInput: {
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  retryBtnPressed: {
    backgroundColor: colors.accentLight,
  },
  retryText: {
    color: colors.accent,
    fontWeight: '600',
  },
  // Floating bar
  floatingBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingCount: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  floatingBtnDisabled: {
    backgroundColor: colors.border,
  },
  floatingBtnPressed: {
    opacity: 0.85,
  },
  floatingBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  floatingBtnTextDisabled: {
    color: colors.textSecondary,
  },
});
