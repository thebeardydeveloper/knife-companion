import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { H3, Caption, Badge } from '../ui';
import { colors, spacing } from '../../theme';
import type { SteelSummary } from '../../api/steels';

interface SteelListItemProps {
  steel: SteelSummary;
  onPress: () => void;
}

export function SteelListItem({ steel, onPress }: SteelListItemProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <View style={styles.header}>
          <H3>{steel.name}</H3>
          <Badge label={t(`categories.${steel.category}`)} />
        </View>
        {steel.aliases.length > 0 && (
          <Caption style={styles.aliases}>{steel.aliases.join(' · ')}</Caption>
        )}
        <View style={styles.stats}>
          <Caption>{t('steelDetail.properties.hardness')}: {steel.properties.hardnessMin}–{steel.properties.hardnessMax} {t('common.hrc')}</Caption>
          <Caption style={styles.dot}>·</Caption>
          <Caption>C {steel.composition.C}%</Caption>
          {steel.composition.Cr != null && (
            <>
              <Caption style={styles.dot}>·</Caption>
              <Caption>Cr {steel.composition.Cr}%</Caption>
            </>
          )}
        </View>
      </View>
      <Caption style={styles.chevron}>›</Caption>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.bg,
  },
  main: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  aliases: {
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  dot: {
    color: colors.border,
  },
  chevron: {
    fontSize: 20,
    color: colors.border,
    marginLeft: spacing.sm,
  },
});
