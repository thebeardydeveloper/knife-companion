import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, Body, Caption } from '../../src/components/ui';
import { CompositionTable } from '../../src/components/steel/CompositionTable';
import { PropertiesCard } from '../../src/components/steel/PropertiesCard';
import { HeatTreatmentGuide } from '../../src/components/steel/HeatTreatmentGuide';
import { HistorySection } from '../../src/components/steel/HistorySection';
import { useSteel } from '../../src/hooks/useSteel';
import { colors, spacing } from '../../src/theme';

export default function SteelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: steel, isLoading, isError, refetch } = useSteel(id);

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
        {steel && (
          <View style={styles.headerTitle}>
            <H1 style={styles.steelName}>{steel.name}</H1>
            {steel.aliases.length > 0 && (
              <Caption style={styles.aliases}>{steel.aliases.join(' · ')}</Caption>
            )}
            <Caption style={styles.category}>{t(`categories.${steel.category}`)}</Caption>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : isError || !steel ? (
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
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.divider} />
          <CompositionTable composition={steel.composition} />

          <View style={styles.divider} />
          <PropertiesCard properties={steel.properties} />

          <View style={styles.divider} />
          <HeatTreatmentGuide
            steps={steel.heatTreatment.steps}
            temperCycles={steel.heatTreatment.temperCycles}
          />

          <View style={styles.divider} />
          <HistorySection
            originEn={steel.originEn}
            originEs={steel.originEs}
            characteristicsEn={steel.characteristicsEn}
            characteristicsEs={steel.characteristicsEs}
          />
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    marginTop: 4,
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  steelName: {
    fontSize: 24,
    lineHeight: 28,
  },
  aliases: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  category: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
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
  scroll: {
    flex: 1,
  },
});
