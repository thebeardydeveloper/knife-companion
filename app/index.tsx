import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, H2, Body } from '../src/components/ui';
import { colors, spacing } from '../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.hero}>
        <H1 style={styles.appName}>{t('common.appName')}</H1>
        <Body style={styles.subtitle}>{t('home.subtitle')}</Body>
      </View>

      <View style={styles.sections}>
        <Pressable
          style={({ pressed }) => [styles.sectionCard, pressed && styles.sectionCardPressed]}
          onPress={() => router.push('/steels')}
        >
          <View style={styles.sectionIcon}>
            <Ionicons name="layers-outline" size={36} color={colors.accent} />
          </View>
          <View style={styles.sectionText}>
            <H2 style={styles.sectionTitle}>{t('home.sections.encyclopedia')}</H2>
            <Body style={styles.sectionDesc}>{t('home.sections.encyclopediaDesc')}</Body>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  appName: {
    fontSize: 36,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  sections: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionCardPressed: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
