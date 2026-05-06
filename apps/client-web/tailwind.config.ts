import animate from 'tailwindcss-animate';
import { type Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',

        // Lume mockup palette: extra surfaces and accent tones, kept
        // in sync with apps/web/tailwind.config.ts so the landing and
        // the panel render against the same dark+lime canvas.
        surface: {
          deep: '#0a0e0d',
          base: '#0f1413',
          elev: '#161c1a',
          hover: '#1d2422',
        },
        line: {
          DEFAULT: '#232b29',
          bright: '#2e3835',
        },
        ink: {
          primary: '#f0f2f0',
          secondary: '#8a948f',
          tertiary: '#5a625e',
        },
        lime: {
          DEFAULT: '#b9ff66',
          dim: '#6b9633',
        },
        warm: '#ffb366',
        danger: '#ff6b6b',
        pink: '#ff66c4',
        blue: '#66c4ff',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-lime': '0 0 20px rgba(185, 255, 102, 0.15)',
        'glow-lime-strong': '0 0 40px rgba(185, 255, 102, 0.25)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
