import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: "#0E5A8A",
          light: "#E6F0F7",
          dark: "#093E61",
        },
        sand: {
          DEFAULT: "#B44B1E",
          light: "#FCEEE8",
          dark: "#8A3511",
        },
        slate: {
          DEFAULT: "#17191C",
        },
        surface: "#F6F5F0",
        card: "#FFFFFF",
        gray: {
          50:  "#F0EFE9",
          100: "#E5E3DC",
          200: "#D4D1C7",
          300: "#B4B0A4",
          400: "#78756C",
          500: "#57544D",
          600: "#3D3B36",
          700: "#2A2925",
          800: "#1D1C1A",
          900: "#141413",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        badgePop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'badge-pop': 'badgePop 180ms ease-out',
        'slide-up':  'slideUp 220ms ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
