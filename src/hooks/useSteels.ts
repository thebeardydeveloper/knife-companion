import { useQuery } from '@tanstack/react-query';
import { fetchSteels } from '../api/steels';
import type { SteelCategory } from '../types/steel';

export function useSteels(category?: SteelCategory) {
  return useQuery({
    queryKey: category ? ['steels', category] : ['steels'],
    queryFn: () => fetchSteels(category),
    staleTime: 1000 * 60 * 60 * 24,     // 24 horas
    gcTime: 1000 * 60 * 60 * 24 * 7,    // 7 días
  });
}
