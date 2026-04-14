import { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { H2, Body, Caption } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function SuppliersByNameScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <H2 style={styles.headerTitle}>{t('suppliers.byNameTitle')}</H2>
      </View>

      {/* Search input */}
      <View style={styles.searchBar}>
        <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('suppliers.namePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          autoCapitalize="words"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Coming soon state */}
      <View style={styles.comingSoon}>
        <Ionicons name="hourglass-outline" size={52} color={colors.border} />
        <Body style={styles.comingSoonTitle}>{t('dashboard.comingSoon')}</Body>
        <Caption style={styles.comingSoonMsg}>{t('suppliers.comingSoonMsg')}</Caption>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { flex: 1, fontSize: 18 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  comingSoonTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  comingSoonMsg: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
