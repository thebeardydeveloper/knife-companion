import { StyleSheet, View } from 'react-native';
import { Label } from './Typography';
import { colors, spacing } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'accent' | 'neutral';
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, variant === 'accent' && styles.accent]}>
      <Label style={variant === 'accent' ? styles.accentText : styles.neutralText}>
        {label}
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  neutralText: {
    color: colors.textSecondary,
  },
  accentText: {
    color: colors.accent,
  },
});
