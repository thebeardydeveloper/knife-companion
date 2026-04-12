import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, H3, Body } from '../ui';
import { colors, spacing } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface HistorySectionProps {
  originEn: string;
  originEs: string;
  characteristicsEn: string;
  characteristicsEs: string;
}

export function HistorySection({
  originEn,
  originEs,
  characteristicsEn,
  characteristicsEs,
}: HistorySectionProps) {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);

  const origin = language === 'es' ? originEs : originEn;
  const characteristics = language === 'es' ? characteristicsEs : characteristicsEn;

  return (
    <View style={styles.container}>
      <H2 style={styles.sectionTitle}>{t('steelDetail.history.origin')}</H2>
      <View style={styles.card}>
        <Body style={styles.text}>{origin}</Body>
      </View>

      <H2 style={[styles.sectionTitle, styles.secondTitle]}>
        {t('steelDetail.history.characteristics')}
      </H2>
      <View style={styles.card}>
        <Body style={styles.text}>{characteristics}</Body>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  secondTitle: {
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  text: {
    lineHeight: 24,
    color: colors.textPrimary,
  },
});
