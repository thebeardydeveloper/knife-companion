import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H1, H2, Body } from '../src/components/ui';
import { useLanguage } from '../src/hooks/useLanguage';
import { colors, spacing } from '../src/theme';
import type { Language } from '../src/i18n/index';

const LANGUAGE_OPTIONS: { value: Language; labelKey: 'en' | 'es' }[] = [
  { value: 'en', labelKey: 'en' },
  { value: 'es', labelKey: 'es' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();

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
        <H1>{t('settings.title')}</H1>
      </View>

      {/* Language section */}
      <View style={styles.section}>
        <H2 style={styles.sectionLabel}>{t('settings.language')}</H2>
        <View style={styles.optionsGroup}>
          {LANGUAGE_OPTIONS.map((opt, index) => {
            const isSelected = language === opt.value;
            const isLast = index === LANGUAGE_OPTIONS.length - 1;
            return (
              <Pressable
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected, isLast && styles.optionLast]}
                onPress={() => setLanguage(opt.value)}
              >
                <Body style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {t(`settings.languageOptions.${opt.labelKey}`)}
                </Body>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    marginRight: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGroup: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: colors.accentLight,
  },
  optionText: {
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
});
