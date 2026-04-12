import { useQuery } from '@tanstack/react-query';
import { fetchSteel } from '../api/steels';

export function useSteel(id: string) {
  return useQuery({
    queryKey: ['steel', id],
    queryFn: () => fetchSteel(id),
    staleTime: 1000 * 60 * 60 * 24,     // 24 horas
    gcTime: 1000 * 60 * 60 * 24 * 7,    // 7 días
    enabled: !!id,
  });
}
