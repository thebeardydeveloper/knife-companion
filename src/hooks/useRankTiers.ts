import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RankTier } from '../lib/supabase';

export function useRankTiers() {
  return useQuery<RankTier[]>({
    queryKey: ['rank_tiers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rank_tiers')
        .select('*')
        .order('min_posts', { ascending: true });
      return (data as RankTier[]) ?? [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora — los rangos cambian poco
  });
}
