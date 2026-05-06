import animate from 'tailwindcss-animate';
import { type Config } from 'tailwindcss';

/**
 * Lume design tokens. The HSL CSS variables live in styles/globals.css;
 * this config exposes them as Tailwind utilities and adds a few flat
 * accent palettes (warm / pink / blue / danger / etc.) used in the
 * mockup.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1440px',
      },
    },
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
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',

        // Lume mockup palette: extra surfaces and accent tones.
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
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.2)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.4s ease-in-out infinite',
        blink: 'blink 1s steps(2, start) infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
