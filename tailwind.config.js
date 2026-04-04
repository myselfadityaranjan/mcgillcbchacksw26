/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // ── Backgrounds (warm white → cream → beige) ────────────────────
        bg: {
          DEFAULT: '#FAFAF7',
          surface: '#FFFFFF',
          elevated: '#F5F0E8',
          high: '#EDE6D4',
        },
        // Shortcut aliases for main branch compatibility
        surface: '#FFFFFF',
        elevated: '#F5F0E8',
        high: '#EDE6D4',
        // ── Borders (warm tan) ───────────────────────────────────────────
        border: {
          DEFAULT: 'rgba(161,143,114,0.18)',
          strong: 'rgba(161,143,114,0.36)',
          focus: 'rgba(107,158,119,0.50)',
        },
        // ── Brand: sage green ────────────────────────────────────────────
        brand: {
          DEFAULT: '#6B9E77',
          dark: '#4E7A5C',
          glow: 'rgba(107,158,119,0.15)',
          subtle: 'rgba(107,158,119,0.08)',
        },
        // ── Semantic ─────────────────────────────────────────────────────
        success: {
          DEFAULT: '#5BA37A',
          glow: 'rgba(91,163,122,0.18)',
          subtle: 'rgba(91,163,122,0.08)',
        },
        warning: {
          DEFAULT: '#D97B35',
          glow: 'rgba(217,123,53,0.18)',
          subtle: 'rgba(217,123,53,0.08)',
        },
        danger: {
          DEFAULT: '#C05A52',
          glow: 'rgba(192,90,82,0.18)',
          subtle: 'rgba(192,90,82,0.08)',
        },
        // ── Text (warm neutrals) ─────────────────────────────────────────
        text: {
          1: '#1C1810',
          2: '#6B635A',
          3: '#A8A29E',
        },
        // ── Stone alias for utility use ──────────────────────────────────
        stone: {
          50:  '#FAFAF7',
          100: '#F5F0E8',
          200: '#EDE6D4',
          300: '#D4C9B5',
          400: '#B5A896',
          500: '#8C7F6F',
          600: '#6B5F50',
          700: '#504438',
          800: '#352B21',
          900: '#1C1810',
        },
      },
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '18px',
        xl:  '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      boxShadow: {
        // Warm, airy shadows
        'sm':         '0 1px 2px rgba(100,80,50,0.06)',
        'surface':    '0 1px 4px rgba(100,80,50,0.07), 0 6px 20px rgba(100,80,50,0.06)',
        'surface-lg': '0 4px 16px rgba(100,80,50,0.10), 0 16px 48px rgba(100,80,50,0.08)',
        'card':       '0 0 0 1px rgba(161,143,114,0.12), 0 2px 8px rgba(100,80,50,0.07)',
        'card-hover': '0 0 0 1px rgba(107,158,119,0.30), 0 4px 20px rgba(107,158,119,0.12)',
        'glow-brand': '0 0 0 1px rgba(107,158,119,0.30), 0 4px 24px rgba(107,158,119,0.20)',
        'glow-success':'0 0 0 1px rgba(91,163,122,0.30), 0 4px 24px rgba(91,163,122,0.18)',
        'glow-warning':'0 0 0 1px rgba(217,123,53,0.28), 0 4px 24px rgba(217,123,53,0.16)',
        'glow-danger': '0 0 0 1px rgba(192,90,82,0.28), 0 4px 24px rgba(192,90,82,0.16)',
        'inner-soft': 'inset 0 1px 4px rgba(100,80,50,0.06)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe':      'breathe 4s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'slide-up':     'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down':   'slideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer':      'shimmer 1.8s infinite',
        'spin-slow':    'spin 3s linear infinite',
        'ping-slow':    'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'blob':         'blob 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Down Dog-inspired breathing animation
        breathe: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.7' },
          '50%':      { transform: 'scale(1.08)', opacity: '1'   },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%':      { borderRadius: '50% 60% 30% 60% / 30% 60% 70% 40%' },
          '75%':      { borderRadius: '60% 40% 60% 30% / 70% 30% 60% 50%' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'warm-gradient':  'linear-gradient(135deg, #FAFAF7 0%, #F5F0E8 50%, #EDE6D4 100%)',
        'sage-gradient':  'linear-gradient(135deg, #6B9E77 0%, #4E7A5C 100%)',
        'cream-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F5F0E8 100%)',
      },
    },
  },
  plugins: [],
}
