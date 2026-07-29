import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hadx: {
          bg: '#050505',               // Core deep background
          black: '#0a0a0a',            // True dark background
          card: '#0c0c0c',             // Industrial card background
          'card-hover': '#141414',     // Interactive card hover
          gold: '#f59e0b',             // Metallic Amber Gold
          'gold-light': '#fde68a',       // Highlight Gold
          'gold-dark': '#b45309',        // Shadow Gold
          border: 'rgba(245, 158, 11, 0.25)',     // Subtle Cyber Gold Border
          'border-glow': 'rgba(245, 158, 11, 0.6)', // Active Glow Border
        },
      },
      backgroundImage: {
        'cyber-grid': 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 1px, transparent 1px)',
        'gold-gradient': 'linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #b45309 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(245, 158, 11, 0.25)',
        'gold-glow-lg': '0 0 30px rgba(245, 158, 11, 0.45)',
        'cyber-card': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(245, 158, 11, 0.2))' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
