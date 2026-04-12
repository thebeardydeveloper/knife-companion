import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H2, H3, Body, Caption, Label } from '../ui';
import { colors, spacing } from '../../theme';
import type { HeatTreatStep, TemperCycle } from '../../types/steel';

interface HeatTreatmentGuideProps {
  steps: HeatTreatStep[];
  temperCycles: TemperCycle[];
}

function StepRow({ step, index }: { step: HeatTreatStep; index: number }) {
  const { t } = useTranslation();

  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Body style={styles.stepNumberText}>{index + 1}</Body>
      </View>
      <View style={styles.stepContent}>
        <H3>{t(`steelDetail.heatTreatment.stepTypes.${step.type}`)}</H3>
        <View style={styles.stepMeta}>
          {step.tempC && (
            <Caption>
              {step.tempC.minC === step.tempC.maxC
                ? `${step.tempC.minC}°C`
                : `${step.tempC.minC}–${step.tempC.maxC}°C`}
            </Caption>
          )}
          {step.durationMin != null && (
            <Caption>  {step.durationMin} {t('steelDetail.heatTreatment.duration')}</Caption>
          )}
        </View>
        {step.quenchMedia && step.quenchMedia.length > 0 && (
          <View style={styles.mediaRow}>
            {step.quenchMedia.map((m) => (
              <View key={m} style={styles.mediaBadge}>
                <Label style={styles.mediaText}>
                  {t(`steelDetail.heatTreatment.quenchMedia.${m}`)}
                </Label>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export function HeatTreatmentGuide({ steps, temperCycles }: HeatTreatmentGuideProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <H2 style={styles.title}>{t('steelDetail.heatTreatment.title')}</H2>

      <View style={styles.stepsContainer}>
        {steps.map((step, i) => (
          <StepRow key={i} step={step} index={i} />
        ))}
      </View>

      {temperCycles.length > 0 && (
        <View style={styles.temperSection}>
          <H3 style={styles.temperTitle}>{t('steelDetail.heatTreatment.temperCycles')}</H3>
          {temperCycles.map((cycle, i) => (
            <View key={i} style={styles.temperCycle}>
              <Body>
                {cycle.tempC.minC === cycle.tempC.maxC
                  ? `${cycle.tempC.minC}°C`
                  : `${cycle.tempC.minC}–${cycle.tempC.maxC}°C`}
              </Body>
              <Caption style={styles.temperMeta}>
                {cycle.durationMin} {t('steelDetail.heatTreatment.duration')}
                {'  ·  '}
                {cycle.cycles} {t('steelDetail.heatTreatment.cycles')}
              </Caption>
            </View>
          ))}
        </View>
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
  stepsContainer: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs,
  },
  stepMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  mediaBadge: {
    backgroundColor: colors.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mediaText: {
    color: colors.textSecondary,
  },
  temperSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  temperTitle: {
    marginBottom: spacing.xs,
  },
  temperCycle: {
    gap: 2,
  },
  temperMeta: {
    color: colors.textSecondary,
  },
});
