import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueries } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { H1, H2, H3, Body, Label, Caption } from '../src/components/ui';
import { fetchSteel } from '../src/api/steels';
import { colors, spacing } from '../src/theme';
import type { Steel, Properties } from '../src/types/steel';

// Elementos de composición en orden de relevancia
const COMP_KEYS: (keyof Steel['composition'])[] = [
  'C', 'Mn', 'Si', 'Cr', 'Mo', 'V', 'W', 'Ni', 'Co', 'N', 'Nb', 'Cu',
];

const PROP_KEYS: { key: keyof Properties; labelKey: string }[] = [
  { key: 'toughness', labelKey: 'steelDetail.properties.toughness' },
  { key: 'edgeRetention', labelKey: 'steelDetail.properties.edgeRetention' },
  { key: 'corrosionResistance', labelKey: 'steelDetail.properties.corrosionResistance' },
  { key: 'sharpenability', labelKey: 'steelDetail.properties.sharpenability' },
];

const LABEL_COL = 108;

function winners(steels: Steel[], key: keyof Properties): Set<string> {
  const max = Math.max(...steels.map((s) => s.properties[key]));
  return new Set(steels.filter((s) => s.properties[key] === max).map((s) => s.id));
}

function hardnessWinners(steels: Steel[]): Set<string> {
  const max = Math.max(...steels.map((s) => s.properties.hardnessMax));
  return new Set(steels.filter((s) => s.properties.hardnessMax === max).map((s) => s.id));
}

export default function CompareScreen() {
  const { ids: idsParam } = useLocalSearchParams<{ ids: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const ids = (idsParam ?? '').split(',').filter(Boolean).slice(0, 3);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['steel', id],
      queryFn: () => fetchSteel(id),
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24 * 7,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const steels = results.map((r) => r.data).filter((s): s is Steel => !!s);

  // Elementos de composición presentes en al menos un acero
  const activeCompKeys = COMP_KEYS.filter((k) =>
    steels.some((s) => s.composition[k] != null)
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <H1>{t('compare.title')}</H1>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Steel name headers */}
          <View style={[styles.row, styles.nameRow]}>
            <View style={{ width: LABEL_COL }} />
            {steels.map((steel) => (
              <View key={steel.id} style={styles.col}>
                <H3 style={styles.steelName} numberOfLines={2}>{steel.name}</H3>
                <Caption style={styles.categoryLabel}>
                  {t(`categories.${steel.category}`)}
                </Caption>
              </View>
            ))}
          </View>

          {/* Hardness */}
          <SectionHeader label={t('compare.hardness')} />
          <View style={styles.row}>
            <View style={[styles.labelCol, { width: LABEL_COL }]}>
              <Caption style={styles.labelText}>{t('common.hrc')}</Caption>
            </View>
            {steels.map((steel) => {
              const isWinner = hardnessWinners(steels).has(steel.id);
              return (
                <View key={steel.id} style={[styles.col, styles.valueCell, isWinner && styles.winnerCell]}>
                  <Body style={[styles.valueText, isWinner && styles.winnerText]}>
                    {steel.properties.hardnessMin}–{steel.properties.hardnessMax}
                  </Body>
                </View>
              );
            })}
          </View>

          {/* Properties */}
          <SectionHeader label={t('compare.properties')} />
          {PROP_KEYS.map(({ key, labelKey }, i) => {
            const w = winners(steels, key);
            const isLast = i === PROP_KEYS.length - 1;
            return (
              <View key={key} style={[styles.row, isLast && styles.rowLast]}>
                <View style={[styles.labelCol, { width: LABEL_COL }]}>
                  <Caption style={styles.labelText}>{t(labelKey)}</Caption>
                </View>
                {steels.map((steel) => {
                  const isWinner = w.has(steel.id);
                  return (
                    <View key={steel.id} style={[styles.col, styles.valueCell, isWinner && styles.winnerCell]}>
                      <Body style={[styles.valueText, isWinner && styles.winnerText]}>
                        {steel.properties[key]}<Caption style={[styles.outOf, isWinner && styles.winnerText]}>/10</Caption>
                      </Body>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Composition */}
          {activeCompKeys.length > 0 && (
            <>
              <SectionHeader label={t('compare.composition')} />
              {activeCompKeys.map((key, i) => {
                const isLast = i === activeCompKeys.length - 1;
                return (
                  <View key={key} style={[styles.row, isLast && styles.rowLast]}>
                    <View style={[styles.labelCol, { width: LABEL_COL }]}>
                      <Caption style={styles.labelText}>{key}</Caption>
                    </View>
                    {steels.map((steel) => {
                      const val = steel.composition[key];
                      return (
                        <View key={steel.id} style={[styles.col, styles.valueCell]}>
                          <Body style={styles.valueText}>
                            {val != null ? `${val}%` : <Caption style={styles.emptyVal}>—</Caption>}
                          </Body>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Label style={styles.sectionHeaderText}>{label}</Label>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  backBtn: {},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  // Name row
  nameRow: {
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: spacing.lg,
  },
  steelName: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  categoryLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  // Section header
  sectionHeader: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Rows
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  labelCol: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  labelText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  valueCell: {},
  winnerCell: {
    backgroundColor: colors.accentLight,
  },
  valueText: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 14,
  },
  winnerText: {
    color: colors.accent,
    fontWeight: '700',
  },
  outOf: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyVal: {
    color: colors.border,
  },
});
