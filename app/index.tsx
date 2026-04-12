import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, H2, Body } from '../src/components/ui';
import { useLanguage } from '../src/hooks/useLanguage';
import { colors, spacing } from '../src/theme';
import type { Language } from '../src/i18n/index';

const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: 'en', flag: '🇺🇸', label: 'EN' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Language picker — top right */}
      <View style={styles.langRow}>
        {LANGUAGES.map((lang) => {
          const isActive = language === lang.value;
          return (
            <Pressable
              key={lang.value}
              onPress={() => setLanguage(lang.value)}
              style={({ pressed }) => [
                styles.langBtn,
                isActive && styles.langBtnActive,
                pressed && !isActive && styles.langBtnPressed,
              ]}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                {lang.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <H1 style={styles.appName}>{t('common.appName')}</H1>
        <Body style={styles.subtitle}>{t('home.subtitle')}</Body>
      </View>

      {/* Section cards */}
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
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  langBtnPressed: {
    backgroundColor: colors.bg,
  },
  langFlag: {
    fontSize: 18,
    lineHeight: 22,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langLabelActive: {
    color: colors.accent,
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
