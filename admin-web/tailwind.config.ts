import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          bg:        '#0F0E0D',
          surface:   '#1A1917',
          elevated:  '#242220',
          border:    '#2C2A27',
          text:      '#F2EDE6',
          muted:     '#8A837A',
          accent:    '#E8571A',
          'accent-dim': '#2A1A10',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
