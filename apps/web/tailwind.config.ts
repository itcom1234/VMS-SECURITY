import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#0a0e14',
          900: '#0f1419',
          800: '#161b22',
          700: '#1c2128',
        },
        accent: {
          DEFAULT: '#00d4aa',
          dim: '#00a884',
          alert: '#ff5c5c',
          warn: '#f0b429',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;