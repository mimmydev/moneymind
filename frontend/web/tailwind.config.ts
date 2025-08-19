import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,ts,js}',
    './pages/**/*.{vue,ts,js}',
    './app.vue',
    './app/components/ui/**/*.{vue,ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
      },
      boxShadow: {
        main: '0px 4px 16px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
