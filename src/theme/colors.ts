export const colors = {
  bg: '#F5F2EE',
  surface: '#FFFFFF',
  textPrimary: '#1C1A17',
  textSecondary: '#6B6560',
  accent: '#C4822A',
  accentLight: '#F0D9BB',
  border: '#D9D5CF',
  error: '#B91C1C',
} as const;

export type AppColors = typeof colors;
