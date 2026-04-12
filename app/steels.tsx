import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Searchbar } from 'react-native-paper';
import { FilterChips, H2, Body } from '../src/components/ui';
import { SteelListItem } from '../src/components/steel/SteelListItem';
import { useSteels } from '../src/hooks/useSteels';
import { colors, spacing } from '../src/theme';
import type { SteelCategory } from '../src/types/steel';
import type { SteelSummary } from '../src/api/steels';

export default function SteelsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SteelCategory | 'all'>('all');

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <H2 style={styles.title}>{t('home.sections.encyclopedia')}</H2>
          {/* Spacer para centrar el título visualmente */}
          <View style={styles.iconBtn} />
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
        <FlashList
          data={filtered}
          keyExtractor={(item: SteelSummary) => item.id}
          renderItem={({ item }: { item: SteelSummary }) => (
            <SteelListItem
              steel={item}
              onPress={() => router.push(`/steel/${item.id}`)}
            />
          )}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
        />
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
});
