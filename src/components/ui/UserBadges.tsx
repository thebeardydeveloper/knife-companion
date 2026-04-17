import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Caption } from './Typography';
import { colors } from '../../theme';
import { getRank } from '../../utils/rank';
import type { Profile, RankTier } from '../../lib/supabase';

const ROLE_COLOR: Record<string, string> = {
  artisan:    colors.accent,
  collector:  '#5BB8F5',
  enthusiast: colors.textSecondary,
};

interface Props {
  role?: Profile['role'];
  postCount?: number;
  tiers?: RankTier[];
  /** 'sm' for PostCard / comment rows, 'md' for profile headers */
  size?: 'sm' | 'md';
}

export function UserBadges({ role, postCount, tiers = [], size = 'sm' }: Props) {
  const { t } = useTranslation();

  const rankTier = postCount !== undefined ? getRank(postCount, tiers) : null;
  const hasRole  = !!role;
  const hasRank  = !!rankTier;

  if (!hasRole && !hasRank) return null;

  const fontSize  = size === 'sm' ? 9  : 11;
  const padH      = size === 'sm' ? 5  : 7;
  const padV      = size === 'sm' ? 2  : 3;

  return (
    <View style={styles.row}>
      {hasRole && (
        <View style={[
          styles.badge,
          {
            borderColor: (ROLE_COLOR[role!] ?? colors.textSecondary) + '55',
            backgroundColor: (ROLE_COLOR[role!] ?? colors.textSecondary) + '18',
            paddingHorizontal: padH,
            paddingVertical: padV,
          },
        ]}>
          <Caption style={[styles.text, { fontSize, color: ROLE_COLOR[role!] ?? colors.textSecondary }]}>
            {t(`profile.roles.${role}` as any)}
          </Caption>
        </View>
      )}

      {hasRank && (
        <View style={[
          styles.badge,
          {
            borderColor: rankTier!.color + '55',
            backgroundColor: rankTier!.color + '18',
            paddingHorizontal: padH,
            paddingVertical: padV,
          },
        ]}>
          <Caption style={[styles.text, { fontSize, color: rankTier!.color }]}>
            {rankTier!.name}
          </Caption>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    borderRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
