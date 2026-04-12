import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Searchbar } from 'react-native-paper';
import { FilterChips, H2 } from '../src/components/ui';
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

  const { data: steels = [], isLoading } = useSteels(
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
      {/* Header row: back + search + settings */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <Searchbar
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          elevation={0}
        />

        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </Pressable>
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
          <H2 style={{ color: colors.textSecondary }}>...</H2>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <H2 style={{ color: colors.textSecondary }}>{t('common.noResults')}</H2>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchbar: {
    flex: 1,
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
  },
});
