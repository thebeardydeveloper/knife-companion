import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, Label, Body, Caption } from '../ui';
import { colors, spacing } from '../../theme';
import type { Composition } from '../../types/steel';

const ELEMENT_ORDER: (keyof Composition)[] = [
  'C', 'Cr', 'Mo', 'V', 'W', 'Co', 'Mn', 'Si', 'Ni', 'Nb', 'N', 'Cu', 'P', 'S',
];

interface CompositionTableProps {
  composition: Composition;
}

export function CompositionTable({ composition }: CompositionTableProps) {
  const { t } = useTranslation();

  const elements = ELEMENT_ORDER.filter((el) => composition[el] != null);

  return (
    <View style={styles.container}>
      <H2 style={styles.title}>{t('steelDetail.composition.title')}</H2>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Label style={styles.cellElement}>{t('steelDetail.composition.element')}</Label>
          <Label style={styles.cellPct}>{t('steelDetail.composition.percentage')}</Label>
          <Label style={styles.cellBar} />
        </View>
        {elements.map((el) => {
          const val = composition[el] as number;
          const maxVal = el === 'C' ? 2.5 : el === 'Cr' ? 22 : el === 'Mo' ? 5 : 10;
          const pct = Math.min((val / maxVal) * 100, 100);
          return (
            <View key={el} style={styles.row}>
              <Body style={styles.cellElement}>{el}</Body>
              <Body style={styles.cellPct}>{val.toFixed(2)}%</Body>
              <View style={styles.cellBar}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%` }]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
      {elements.length === 0 && (
        <Caption style={styles.empty}>—</Caption>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerRow: {
    backgroundColor: colors.bg,
  },
  cellElement: {
    width: 40,
    color: colors.textPrimary,
  },
  cellPct: {
    width: 64,
    color: colors.textSecondary,
    fontSize: 13,
  },
  cellBar: {
    flex: 1,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  empty: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
