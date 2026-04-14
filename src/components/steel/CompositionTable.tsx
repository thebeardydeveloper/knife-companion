import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, Caption, Body } from '../ui';
import { colors, spacing } from '../../theme';
import type { Composition } from '../../types/steel';

// ─── Element metadata ────────────────────────────────────────────────────────

type ElementCategory = 'transition' | 'nonmetal' | 'metalloid';

interface ElementMeta {
  atomicNumber: number;
  name: string;
  category: ElementCategory;
}

const ELEMENT_META: Record<keyof Composition, ElementMeta> = {
  C:  { atomicNumber: 6,  name: 'Carbon',      category: 'nonmetal'   },
  N:  { atomicNumber: 7,  name: 'Nitrogen',     category: 'nonmetal'   },
  Si: { atomicNumber: 14, name: 'Silicon',      category: 'metalloid'  },
  P:  { atomicNumber: 15, name: 'Phosphorus',   category: 'nonmetal'   },
  S:  { atomicNumber: 16, name: 'Sulfur',       category: 'nonmetal'   },
  V:  { atomicNumber: 23, name: 'Vanadium',     category: 'transition' },
  Cr: { atomicNumber: 24, name: 'Chromium',     category: 'transition' },
  Mn: { atomicNumber: 25, name: 'Manganese',    category: 'transition' },
  Co: { atomicNumber: 27, name: 'Cobalt',       category: 'transition' },
  Ni: { atomicNumber: 28, name: 'Nickel',       category: 'transition' },
  Cu: { atomicNumber: 29, name: 'Copper',       category: 'transition' },
  Nb: { atomicNumber: 41, name: 'Niobium',      category: 'transition' },
  Mo: { atomicNumber: 42, name: 'Molybdenum',   category: 'transition' },
  W:  { atomicNumber: 74, name: 'Tungsten',     category: 'transition' },
};

// ─── Category palette (Dark Forge) ──────────────────────────────────────────

const CATEGORY_STYLE: Record<ElementCategory, { bg: string; border: string; symbol: string; number: string }> = {
  transition: {
    bg:     '#0D2236',
    border: '#1E5A8A',
    symbol: '#5BB8F5',
    number: '#2E7AB8',
  },
  nonmetal: {
    bg:     '#261904',
    border: '#8A5410',
    symbol: '#D4890A',
    number: '#7A4A08',
  },
  metalloid: {
    bg:     '#1A0E2E',
    border: '#5C3A94',
    symbol: '#A87FE8',
    number: '#6B45B0',
  },
};

const ELEMENT_ORDER: (keyof Composition)[] = [
  'C', 'Cr', 'Mo', 'V', 'W', 'Co', 'Mn', 'Si', 'Ni', 'Nb', 'N', 'Cu', 'P', 'S',
];

interface CompositionTableProps {
  composition: Composition;
}

export function CompositionTable({ composition }: CompositionTableProps) {
  const { t } = useTranslation();

  const elements = ELEMENT_ORDER.filter((el) => composition[el] != null);

  // Pad to multiple of 3 for clean grid
  const padded = [...elements];
  while (padded.length % 3 !== 0) padded.push(null as any);

  return (
    <View style={styles.container}>
      <H2 style={styles.title}>{t('steelDetail.composition.title')}</H2>

      {elements.length === 0 ? (
        <Caption style={styles.empty}>—</Caption>
      ) : (
        <>
          {/* Grid */}
          <View style={styles.grid}>
            {padded.map((el, idx) => {
              if (!el) {
                return <View key={`pad-${idx}`} style={styles.cellSpacer} />;
              }
              const val = composition[el] as number;
              const meta = ELEMENT_META[el];
              const cat = CATEGORY_STYLE[meta.category];
              return (
                <View
                  key={el}
                  style={[styles.cell, { backgroundColor: cat.bg, borderColor: cat.border }]}
                >
                  <Body style={[styles.atomicNumber, { color: cat.number }]}>
                    {meta.atomicNumber}
                  </Body>
                  <Body style={[styles.symbol, { color: cat.symbol }]}>{el}</Body>
                  <Caption style={styles.elementName}>{meta.name}</Caption>
                  <Caption style={[styles.percentage, { color: cat.symbol }]}>
                    {val.toFixed(2)}%
                  </Caption>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {(Object.entries(CATEGORY_STYLE) as [ElementCategory, typeof CATEGORY_STYLE[ElementCategory]][]).map(
              ([cat, style]) => (
                <View key={cat} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: style.border }]} />
                  <Caption style={styles.legendLabel}>
                    {t(`steelDetail.composition.cat_${cat}`)}
                  </Caption>
                </View>
              )
            )}
          </View>
        </>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    // Each cell takes exactly 1/3 of the available width minus gaps
    // gap: 8 (spacing.sm) × 2 between 3 cols = 16px total, so each col = (100% - 16) / 3
    // React Native doesn't support calc(), use flex + minWidth trick
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    aspectRatio: 0.85,
    borderWidth: 1,
    borderRadius: 4,
    padding: spacing.xs,
    justifyContent: 'space-between',
  },
  cellSpacer: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
  },
  atomicNumber: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  symbol: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -1,
    alignSelf: 'center',
    marginTop: 2,
  },
  elementName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  empty: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
