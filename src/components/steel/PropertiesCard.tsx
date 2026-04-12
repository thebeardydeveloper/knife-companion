import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, Body, Label } from '../ui';
import { PropertyBar } from '../ui/PropertyBar';
import { colors, spacing } from '../../theme';
import type { Properties } from '../../types/steel';

interface PropertiesCardProps {
  properties: Properties;
}

export function PropertiesCard({ properties }: PropertiesCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <H2 style={styles.title}>{t('steelDetail.properties.title')}</H2>

      <View style={styles.hardnessBox}>
        <Label style={styles.hardnessLabel}>{t('steelDetail.properties.hardness')}</Label>
        <Body style={styles.hardnessValue}>
          {properties.hardnessMin}–{properties.hardnessMax} {t('common.hrc')}
        </Body>
      </View>

      <View style={styles.bars}>
        <PropertyBar
          label={t('steelDetail.properties.toughness')}
          value={properties.toughness}
        />
        <PropertyBar
          label={t('steelDetail.properties.edgeRetention')}
          value={properties.edgeRetention}
        />
        <PropertyBar
          label={t('steelDetail.properties.corrosionResistance')}
          value={properties.corrosionResistance}
        />
        <PropertyBar
          label={t('steelDetail.properties.sharpenability')}
          value={properties.sharpenability}
        />
      </View>
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
  hardnessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  hardnessLabel: {
    color: colors.accent,
  },
  hardnessValue: {
    fontWeight: '700',
    color: colors.accent,
  },
  bars: {
    gap: spacing.xs,
  },
});
