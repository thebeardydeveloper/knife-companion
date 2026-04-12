import { apiFetch } from './client';
import type { Steel, SteelCategory } from '../types/steel';

export interface SteelSummary {
  id: string;
  name: string;
  aliases: string[];
  category: SteelCategory;
  composition: Steel['composition'];
  properties: Steel['properties'];
}

export function fetchSteels(category?: SteelCategory): Promise<SteelSummary[]> {
  const query = category ? `?category=${category}` : '';
  return apiFetch<SteelSummary[]>(`/steels${query}`);
}

export function fetchSteel(id: string): Promise<Steel> {
  return apiFetch<Steel>(`/steels/${id}`);
}
