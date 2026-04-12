import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { spacing, colors } from '../../theme';
import type { SteelCategory } from '../../types/steel';

interface FilterChipsProps {
  categories: { value: SteelCategory | 'all'; label: string }[];
  selected: SteelCategory | 'all';
  onSelect: (value: SteelCategory | 'all') => void;
}

export function FilterChips({ categories, selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {categories.map((cat) => (
        <View key={cat.value} style={styles.chipWrapper}>
          <Chip
            selected={selected === cat.value}
            onPress={() => onSelect(cat.value)}
            style={[styles.chip, selected === cat.value && styles.chipSelected]}
            textStyle={[
              styles.chipText,
              selected === cat.value && styles.chipTextSelected,
            ]}
            showSelectedCheck={false}
          >
            {cat.label}
          </Chip>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chipWrapper: {
    marginRight: 0,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
});
