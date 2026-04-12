import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { H3, Caption, Badge } from '../ui';
import { colors, spacing } from '../../theme';
import type { SteelSummary } from '../../api/steels';

interface SteelListItemProps {
  steel: SteelSummary;
  onPress: () => void;
  compareMode?: boolean;
  selected?: boolean;
}

export function SteelListItem({ steel, onPress, compareMode = false, selected = false }: SteelListItemProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && !selected && styles.pressed,
      ]}
    >
      {compareMode && (
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? colors.accent : colors.border}
          style={styles.checkbox}
        />
      )}

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

      {!compareMode && (
        <Caption style={styles.chevron}>›</Caption>
      )}
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
  containerSelected: {
    backgroundColor: colors.accentLight,
  },
  pressed: {
    backgroundColor: colors.bg,
  },
  checkbox: {
    marginRight: spacing.sm,
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
