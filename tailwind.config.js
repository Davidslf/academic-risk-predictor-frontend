/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Academic Risk neutral palette — not tied to any university
        ar: {
          navy:         '#1A2B4A',
          'navy-dark':  '#111D33',
          'navy-light': '#EEF2F7',
          cyan:         '#00B4D8',
          'cyan-dark':  '#0090B8',
          'cyan-light': '#E0F7FC',
        },
        // Alias for existing components — maps to new neutral palette
        usb: {
          orange:        '#00B4D8',   // was USB orange, now AR cyan
          'orange-hover':'#0090B8',
          'orange-light':'#E0F7FC',
          wine:          '#1A2B4A',   // was USB wine, now AR navy
          'wine-dark':   '#111D33',
          'wine-light':  '#EEF2F7',
          canvas:        '#F8FAFC',
          surface:       '#FFFFFF',
          text:          '#0F172A',
          subtle:        '#334155',
          muted:         '#64748B',
          faint:         '#94A3B8',
          border:        '#E2E8F0',
          'border-dark': '#CBD5E1',
        },
        risk: {
          high:       '#DC2626',
          'high-bg':  '#FEF2F2',
          med:        '#D97706',
          'med-bg':   '#FFFBEB',
          low:        '#16A34A',
          'low-bg':   '#F0FDF4',
        }
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Syne', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
        'modal':      '0 20px 60px -10px rgb(0 0 0 / 0.15)',
        'glow':       '0 0 20px 0 rgb(0 180 216 / 0.25)',
      },
      backgroundImage: {
        'ar-gradient': 'linear-gradient(135deg, #1A2B4A 0%, #243659 100%)',
        'cyan-gradient': 'linear-gradient(135deg, #00B4D8 0%, #0090B8 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
