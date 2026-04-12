import { View, StyleSheet } from 'react-native';
import { Caption } from './Typography';
import { colors, spacing } from '../../theme';

interface PropertyBarProps {
  label: string;
  value: number; // 1–10
}

export function PropertyBar({ label, value }: PropertyBarProps) {
  const pct = (value / 10) * 100;
  return (
    <View style={styles.row}>
      <Caption style={styles.label}>{label}</Caption>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Caption style={styles.value}>{value}/10</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    width: 130,
    color: colors.textSecondary,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  value: {
    width: 32,
    textAlign: 'right',
    color: colors.textSecondary,
  },
});
