/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Starbucks-inspired 4-tier green system (DESIGN.md §2) ──────────
        sbucks: {
          green:   '#006241',   // Brand heading green — h1, primary section headers
          accent:  '#00754A',   // CTA fill, progress bars, links
          house:   '#1E3932',   // Feature bands, footer, dark sections
          uplift:  '#2b5148',   // Decorative dark-green accents
          light:   '#d4e9e2',   // Form valid-state tint, light surfaces
        },
        // ── Page surface palette (warm-neutral cream, no pure white) ────────
        pg: {
          warm:    '#f2f0eb',   // Primary page canvas (cream)
          ceramic: '#edebe9',   // Zone separators, section washes
          cool:    '#f9f9f9',   // Dropdown menus, utility containers
        },
        // ── Gold — Rewards/achievement ceremony only ───────────────────────
        gold: {
          DEFAULT: '#cba258',
          light:   '#dfc49d',
          lightest:'#faf6ee',
        },
        // ── Risk semantic colors (unchanged) ──────────────────────────────
        risk: {
          high:       '#DC2626',
          'high-bg':  '#FEF2F2',
          med:        '#D97706',
          'med-bg':   '#FFFBEB',
          low:        '#16A34A',
          'low-bg':   '#F0FDF4',
        },
        // ── Text scale (DESIGN.md §2 neutrals) ───────────────────────────
        ink: {
          DEFAULT: '#1a1a1a',   // Primary text on light surfaces (warm near-black)
          soft:    '#595959',   // Secondary/metadata on light
          faint:   '#9e9e9e',   // Disabled/placeholder
        },
        // ── Backward-compat aliases (existing components keep working) ────
        ar: {
          navy:         '#1E3932',
          'navy-dark':  '#14292300',
          'navy-light': '#d4e9e2',
          cyan:         '#00754A',
          'cyan-dark':  '#006241',
          'cyan-light': '#d4e9e2',
        },
        usb: {
          orange:        '#00754A',
          'orange-hover':'#006241',
          'orange-light':'#d4e9e2',
          wine:          '#1E3932',
          'wine-dark':   '#2b5148',
          'wine-light':  '#d4e9e2',
          canvas:        '#f2f0eb',
          surface:       '#FFFFFF',
          text:          '#1a1a1a',
          subtle:        '#404040',
          muted:         '#595959',
          faint:         '#9e9e9e',
          border:        '#E0DDD7',
          'border-dark': '#C8C4BD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tight:  '-0.01em',   // Universal SoDoSans tracking (DESIGN.md §3)
        tighter:'-0.016em',  // Display headlines
        loose:  '0.1em',     // Caps labels
        looser: '0.15em',    // Uppercase extreme emphasis
      },
      lineHeight: {
        compact: '1.2',   // display / buttons
        normal:  '1.5',   // body
      },
      borderRadius: {
        pill: '50px',     // Universal button radius (DESIGN.md §4)
        card: '12px',     // Cards, modals
        '4xl': '2rem',
      },
      boxShadow: {
        // DESIGN.md §6 — always 2-3 low-alpha layers, never one heavy shadow
        'card':       '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'nav':        '0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)',
        'frap':       '0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)',
        'modal':      '0 20px 60px -10px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        'glow':       '0 0 20px 0 rgba(0,117,74,0.25)',
      },
      animation: {
        'float':      'float 3s ease-in-out infinite',
        'fade-up':    'fadeUp 0.5s ease-out forwards',
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
