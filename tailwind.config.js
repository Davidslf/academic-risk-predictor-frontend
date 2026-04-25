/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Starbucks-inspired Green System ──────────────────────────────────
        // Each tier has a precise role — never interchangeable
        green: {
          brand:   '#006241',   // Brand headings, logo signal
          accent:  '#00754A',   // CTAs, active states, links
          deep:    '#1E3932',   // Header, footer, feature bands
          mid:     '#2b5148',   // Secondary dark surfaces, hover on deep
          light:   '#d4e9e2',   // Tints, form valid states, subtle fills
          uplift:  '#33433d',   // Muted text on cream surfaces
        },
        // ── Gold — reserved for risk/alert ceremony ───────────────────────
        gold: {
          DEFAULT: '#cba258',
          light:   '#dfc49d',
          lightest:'#faf6ee',
        },
        // ── Canvas system — warm neutral, NOT cold white ──────────────────
        canvas: {
          warm:    '#f2f0eb',   // Primary page background
          ceramic: '#edebe9',   // Section separators, alternates
          white:   '#ffffff',   // Card surfaces, modals
          cool:    '#f9f9f9',   // Dropdowns, secondary containers
        },
        // ── Legacy aliases — keep existing components working ─────────────
        ar: {
          navy:         '#1E3932',   // ← now Deep Green
          'navy-dark':  '#111D33',
          'navy-light': '#d4e9e2',   // ← now Green Light
          cyan:         '#00754A',   // ← now Accent Green
          'cyan-dark':  '#006241',   // ← now Brand Green
          'cyan-light': '#d4e9e2',
        },
        usb: {
          orange:        '#00754A',
          'orange-hover':'#006241',
          'orange-light':'#d4e9e2',
          wine:          '#1E3932',
          'wine-dark':   '#111D33',
          'wine-light':  '#d4e9e2',
          canvas:        '#f2f0eb',   // warm cream
          surface:       '#ffffff',
          text:          'rgba(0,0,0,0.87)',
          subtle:        'rgba(0,0,0,0.70)',
          muted:         'rgba(0,0,0,0.58)',
          faint:         'rgba(0,0,0,0.38)',
          border:        '#e2e0db',
          'border-dark': '#ccc9c2',
        },
        // ── Risk levels ───────────────────────────────────────────────────
        risk: {
          high:       '#c82014',
          'high-bg':  '#fdf2f2',
          med:        '#cba258',   // Gold for medium risk
          'med-bg':   '#faf6ee',
          low:        '#006241',
          'low-bg':   '#f0f9f5',
        },
      },

      fontFamily: {
        sans:    ['Manrope', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],   // editorial serif moments
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },

      letterSpacing: {
        tight:   '-0.01em',
        tighter: '-0.02em',
        loose:   '0.1em',
        looser:  '0.15em',
      },

      borderRadius: {
        '4xl': '2rem',
        pill:  '50px',         // Universal button radius
        frap:  '50%',          // Circular FAB
      },

      boxShadow: {
        // Starbucks layered shadow philosophy — never one heavy shadow
        'card':     '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)',
        'card-hover':'0 2px 8px rgba(0,0,0,0.10), 0 0 0.5px rgba(0,0,0,0.14)',
        'nav':      '0 1px 3px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)',
        'frap':     '0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)',
        'frap-active': '0 0 6px rgba(0,0,0,0.24), 0 2px 4px rgba(0,0,0,0.08)',
        'modal':    '0 20px 60px -10px rgba(0,0,0,0.18), 0 0 0.5px rgba(0,0,0,0.14)',
        'tooltip':  '0 4px 12px rgba(0,0,0,0.15), 0 0 0.5px rgba(0,0,0,0.20)',
        'glow-green': '0 0 20px rgba(0,117,74,0.25)',
      },

      backgroundImage: {
        'deep-band': 'linear-gradient(135deg, #1E3932 0%, #2b5148 100%)',
        'green-cta': 'linear-gradient(135deg, #00754A 0%, #006241 100%)',
        'gold-warm': 'linear-gradient(135deg, #faf6ee 0%, #f2f0eb 100%)',
      },

      animation: {
        'float':       'float 3s ease-in-out infinite',
        'fade-up':     'fadeUp 0.5s ease-out forwards',
        'fade-in':     'fadeIn 0.3s ease-in forwards',
        'slide-in':    'slideIn 0.3s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'skeleton':    'skeleton 1.5s ease-in-out infinite',
        'scale-in':    'scaleIn 0.2s cubic-bezier(0.32,2.32,0.61,0.27) forwards',
        'toast-in':    'toastIn 0.35s cubic-bezier(0.32,2.32,0.61,0.27) forwards',
        'progress':    'progress 1.5s ease-in-out',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.65' },
        },
        skeleton: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          to:   { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        progress: {
          from: { transform: 'scaleX(0)', transformOrigin: 'left' },
          to:   { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },

      spacing: {
        'gutter':    '1.6rem',
        'gutter-md': '2.4rem',
        'gutter-lg': '4.0rem',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 2.32, 0.61, 0.27)',
        'expander': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}
