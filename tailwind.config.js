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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#060812',
          surface: '#0D1117',
          elevated: '#161B27',
          high: '#1E2433',
        },
        border: {
          DEFAULT: 'rgba(99, 120, 186, 0.12)',
          strong: 'rgba(99, 120, 186, 0.25)',
          focus: 'rgba(79, 142, 247, 0.5)',
        },
        brand: {
          DEFAULT: '#4F8EF7',
          dark: '#3A6FCC',
          glow: 'rgba(79, 142, 247, 0.2)',
          subtle: 'rgba(79, 142, 247, 0.08)',
        },
        success: {
          DEFAULT: '#10E07C',
          glow: 'rgba(16, 224, 124, 0.2)',
          subtle: 'rgba(16, 224, 124, 0.08)',
        },
        warning: {
          DEFAULT: '#FFB72B',
          glow: 'rgba(255, 183, 43, 0.2)',
          subtle: 'rgba(255, 183, 43, 0.08)',
        },
        danger: {
          DEFAULT: '#FF4757',
          glow: 'rgba(255, 71, 87, 0.2)',
          subtle: 'rgba(255, 71, 87, 0.08)',
        },
        text: {
          1: '#E8EDF8',
          2: '#8A95B0',
          3: '#4A5568',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(79, 142, 247, 0.25)',
        'glow-success': '0 0 20px rgba(16, 224, 124, 0.25)',
        'glow-warning': '0 0 20px rgba(255, 183, 43, 0.25)',
        'glow-danger': '0 0 20px rgba(255, 71, 87, 0.25)',
        'surface': '0 1px 3px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)',
        'surface-lg': '0 4px 16px rgba(0, 0, 0, 0.5), 0 16px 64px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
