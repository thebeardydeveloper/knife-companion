export const colors = {
  bg: '#0F0E0D',
  surface: '#1A1917',
  surfaceElevated: '#242220',
  textPrimary: '#F2EDE6',
  textSecondary: '#8A837A',
  accent: '#E8571A',
  accentLight: '#2A1A10',
  border: '#2C2A27',
  error: '#E03131',
} as const;

export type AppColors = typeof colors;
