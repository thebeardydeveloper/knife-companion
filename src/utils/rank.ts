import type { RankTier } from '../lib/supabase';

/** Returns the highest tier for which postCount >= min_posts. */
export function getRank(postCount: number, tiers: RankTier[]): RankTier | null {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort((a, b) => b.min_posts - a.min_posts);
  return sorted.find((t) => postCount >= t.min_posts) ?? tiers[0];
}
