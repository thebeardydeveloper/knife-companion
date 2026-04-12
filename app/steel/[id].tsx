import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, Badge, Body, Label } from '../../src/components/ui';
import { CompositionTable } from '../../src/components/steel/CompositionTable';
import { PropertiesCard } from '../../src/components/steel/PropertiesCard';
import { HeatTreatmentGuide } from '../../src/components/steel/HeatTreatmentGuide';
import { HistorySection } from '../../src/components/steel/HistorySection';
import { useSteel } from '../../src/hooks/useSteel';
import { colors, spacing } from '../../src/theme';

type Tab = 'composition' | 'properties' | 'heatTreatment' | 'history';

const TABS: Tab[] = ['composition', 'properties', 'heatTreatment', 'history'];

export default function SteelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('composition');
  const { data: steel, isLoading } = useSteel(id);

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
        <View style={styles.headerTitle}>
          {steel && (
            <>
              <H1>{steel.name}</H1>
              {steel.aliases.length > 0 && (
                <Body style={styles.aliases}>{steel.aliases.join(' · ')}</Body>
              )}
            </>
          )}
        </View>
        {steel && (
          <Badge label={t(`categories.${steel.category}`)} variant="accent" />
        )}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Label
              style={[
                styles.tabLabel,
                activeTab === tab && styles.tabLabelActive,
              ]}
            >
              {t(`steelDetail.tabs.${tab}`)}
            </Label>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !steel ? (
        <View style={styles.center}>
          <Body style={{ color: colors.textSecondary }}>{t('common.noResults')}</Body>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'composition' && (
            <CompositionTable composition={steel.composition} />
          )}
          {activeTab === 'properties' && (
            <PropertiesCard properties={steel.properties} />
          )}
          {activeTab === 'heatTreatment' && (
            <HeatTreatmentGuide
              steps={steel.heatTreatment.steps}
              temperCycles={steel.heatTreatment.temperCycles}
            />
          )}
          {activeTab === 'history' && (
            <HistorySection
              originEn={steel.originEn}
              originEs={steel.originEs}
              characteristicsEn={steel.characteristicsEn}
              characteristicsEs={steel.characteristicsEs}
            />
          )}
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
    marginTop: 2,
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  aliases: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.accent,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  tabLabelActive: {
    color: colors.accent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
});
