import { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueries } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { shareComparison } from '../src/utils/shareComparison';
import { H1, H3, Body, Label, Caption } from '../src/components/ui';
import { fetchSteel } from '../src/api/steels';
import { colors, spacing } from '../src/theme';
import type { Steel, Properties } from '../src/types/steel';

const COMP_KEYS: (keyof Steel['composition'])[] = [
  'C', 'Mn', 'Si', 'Cr', 'Mo', 'V', 'W', 'Ni', 'Co', 'N', 'Nb', 'Cu',
];

const PROP_KEYS: { key: keyof Properties; labelKey: string }[] = [
  { key: 'toughness',          labelKey: 'steelDetail.properties.toughness' },
  { key: 'edgeRetention',      labelKey: 'steelDetail.properties.edgeRetention' },
  { key: 'corrosionResistance',labelKey: 'steelDetail.properties.corrosionResistance' },
  { key: 'sharpenability',     labelKey: 'steelDetail.properties.sharpenability' },
];

const LABEL_COL = 108;
const SHARE_CARD_WIDTH = 360;
const SHARE_LABEL_COL = 96;

function propWinners(steels: Steel[], key: keyof Properties): Set<string> {
  const max = Math.max(...steels.map((s) => s.properties[key]));
  return new Set(steels.filter((s) => s.properties[key] === max).map((s) => s.id));
}
function hardnessWinners(steels: Steel[]): Set<string> {
  const max = Math.max(...steels.map((s) => s.properties.hardnessMax));
  return new Set(steels.filter((s) => s.properties.hardnessMax === max).map((s) => s.id));
}

// ─── Tabla reutilizable ───────────────────────────────────────────────────────

interface TableProps {
  steels: Steel[];
  activeCompKeys: (keyof Steel['composition'])[];
  labelCol: number;
  cardStyles: typeof cardSt;
  t: (key: string) => string;
}

function CompareTable({ steels, activeCompKeys, labelCol, cardStyles: cs, t }: TableProps) {
  return (
    <>
      {/* Nombres */}
      <View style={[cs.row, cs.nameRow]}>
        <View style={{ width: labelCol }} />
        {steels.map((s) => (
          <View key={s.id} style={cs.col}>
            <H3 style={cs.steelName} numberOfLines={2}>{s.name}</H3>
            <Caption style={cs.categoryLabel}>{t(`categories.${s.category}`)}</Caption>
          </View>
        ))}
      </View>

      {/* Dureza */}
      <TableSectionHeader label={t('compare.hardness')} cs={cs} />
      <View style={cs.row}>
        <View style={[cs.labelCol, { width: labelCol }]}>
          <Caption style={cs.labelText}>{t('common.hrc')}</Caption>
        </View>
        {steels.map((s) => {
          const win = hardnessWinners(steels).has(s.id);
          return (
            <View key={s.id} style={[cs.col, cs.valueCell, win && cs.winnerCell]}>
              <Body style={[cs.valueText, win && cs.winnerText]}>
                {s.properties.hardnessMin}–{s.properties.hardnessMax}
              </Body>
            </View>
          );
        })}
      </View>

      {/* Propiedades */}
      <TableSectionHeader label={t('compare.properties')} cs={cs} />
      {PROP_KEYS.map(({ key, labelKey }, i) => {
        const w = propWinners(steels, key);
        const isLast = i === PROP_KEYS.length - 1;
        return (
          <View key={key} style={[cs.row, isLast && cs.rowLast]}>
            <View style={[cs.labelCol, { width: labelCol }]}>
              <Caption style={cs.labelText}>{t(labelKey)}</Caption>
            </View>
            {steels.map((s) => {
              const win = w.has(s.id);
              return (
                <View key={s.id} style={[cs.col, cs.valueCell, win && cs.winnerCell]}>
                  <Body style={[cs.valueText, win && cs.winnerText]}>
                    {s.properties[key]}
                    <Caption style={[cs.outOf, win && cs.winnerText]}>/10</Caption>
                  </Body>
                </View>
              );
            })}
          </View>
        );
      })}

      {/* Composición */}
      {activeCompKeys.length > 0 && (
        <>
          <TableSectionHeader label={t('compare.composition')} cs={cs} />
          {activeCompKeys.map((key, i) => {
            const isLast = i === activeCompKeys.length - 1;
            return (
              <View key={key} style={[cs.row, isLast && cs.rowLast]}>
                <View style={[cs.labelCol, { width: labelCol }]}>
                  <Caption style={cs.labelText}>{key}</Caption>
                </View>
                {steels.map((s) => {
                  const val = s.composition[key];
                  return (
                    <View key={s.id} style={[cs.col, cs.valueCell]}>
                      <Body style={cs.valueText}>
                        {val != null
                          ? `${val}%`
                          : <Caption style={cs.emptyVal}>—</Caption>}
                      </Body>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </>
      )}
    </>
  );
}

function TableSectionHeader({ label, cs }: { label: string; cs: typeof cardSt }) {
  return (
    <View style={cs.sectionHeader}>
      <Label style={cs.sectionHeaderText}>{label}</Label>
    </View>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function CompareScreen() {
  const { ids: idsParam } = useLocalSearchParams<{ ids: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const ids = (idsParam ?? '').split(',').filter(Boolean).slice(0, 3);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['steel', id],
      queryFn: () => fetchSteel(id),
      staleTime: 1000 * 60 * 60 * 24,
      gcTime:    1000 * 60 * 60 * 24 * 7,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const steels = results.map((r) => r.data).filter((s): s is Steel => !!s);
  const activeCompKeys = COMP_KEYS.filter((k) => steels.some((s) => s.composition[k] != null));

  async function handleShare() {
    if (sharing || steels.length < 2) return;
    try {
      setSharing(true);
      await shareComparison(shareCardRef, t('compare.share'));
    } catch (_) {
      // el usuario canceló o hubo error — no se hace nada
    } finally {
      setSharing(false);
    }
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <H1 style={styles.headerTitle}>{t('compare.title')}</H1>
        {!isLoading && steels.length >= 2 && Platform.OS !== 'web' && (
          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={({ pressed }) => [styles.shareBtn, (pressed || sharing) && { opacity: 0.6 }]}
          >
            {sharing
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Label style={styles.shareBtnText}>{t('compare.share')}</Label>
            }
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <>
          {/* Tabla interactiva (scrollable) */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            <CompareTable
              steels={steels}
              activeCompKeys={activeCompKeys}
              labelCol={LABEL_COL}
              cardStyles={cardSt}
              t={t}
            />
          </ScrollView>

          {/* Tarjeta off-screen para exportar — solo en nativo */}
          {Platform.OS !== 'web' && <View
            style={[styles.shareCardOuter, { left: screenWidth + 100 }]}
            pointerEvents="none"
          >
            <View ref={shareCardRef} style={shareCardStyles.card}>
              {/* Branding */}
              <View style={shareCardStyles.brandHeader}>
                <Label style={shareCardStyles.brandTitle}>KnifeCompanion</Label>
                <Caption style={shareCardStyles.brandSubtitle}>{t('compare.title')}</Caption>
              </View>

              {/* Tabla */}
              <CompareTable
                steels={steels}
                activeCompKeys={activeCompKeys}
                labelCol={SHARE_LABEL_COL}
                cardStyles={shareSt}
                t={t}
              />

              {/* Footer */}
              <View style={shareCardStyles.footer}>
                <Caption style={shareCardStyles.footerText}>knifecompanion</Caption>
              </View>
            </View>
          </View>}
        </>
      )}
    </View>
  );
}

// ─── Estilos pantalla ─────────────────────────────────────────────────────────

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
  headerTitle: {
    flex: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    minWidth: 48,
    alignItems: 'center',
  },
  shareBtnText: {
    color: colors.accent,
    fontSize: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  shareCardOuter: {
    position: 'absolute',
    top: 0,
  },
});

// ─── Estilos de tabla (pantalla y tarjeta comparten estructura) ───────────────

const tableBase = {
  row: {
    flexDirection: 'row' as const,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  nameRow: {
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: spacing.lg,
  },
  steelName: { color: colors.textPrimary, textAlign: 'center' as const },
  categoryLabel: { color: colors.textSecondary, textAlign: 'center' as const, marginTop: 2 },
  sectionHeader: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  labelCol: {
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  labelText: { color: colors.textSecondary, fontSize: 12 },
  col: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  valueCell: {},
  winnerCell: { backgroundColor: colors.accentLight },
  valueText: { textAlign: 'center' as const, color: colors.textPrimary, fontSize: 14 },
  winnerText: { color: colors.accent, fontWeight: '700' as const },
  outOf: { fontSize: 11, color: colors.textSecondary },
  emptyVal: { color: colors.border },
};

// Alias para la pantalla principal (mismos estilos)
const cardSt = tableBase;

// Estilos para la tarjeta de exportación (más compactos)
const shareSt: typeof tableBase = {
  ...tableBase,
  sectionHeader: {
    ...tableBase.sectionHeader,
    paddingTop: spacing.md,
  },
  col: {
    ...tableBase.col,
    paddingVertical: spacing.sm,
  },
  labelCol: {
    ...tableBase.labelCol,
    paddingVertical: spacing.sm,
  },
  nameRow: {
    ...tableBase.nameRow,
    paddingVertical: spacing.md,
  },
};

// ─── Estilos de la tarjeta de exportación ────────────────────────────────────

const shareCardStyles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  brandHeader: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 2,
  },
  brandTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: colors.accentLight,
    fontSize: 12,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
