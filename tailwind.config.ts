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
          DEFAULT: "#3CB8E3",
          light: "#79D3F1",
          dark: "#1684A8",
        },
        sand: {
          DEFAULT: "#FF8358",
          light: "#FFA080",
          dark: "#D95B34",
        },
        slate: {
          DEFAULT: "#F4F8FA",
        },
        surface: "#0C1A24",
        card: "#122633",
        // Inverted gray scale for dark-first design
        // Low numbers = dark backgrounds/borders, High numbers = light text
        gray: {
          50:  "#122633",
          100: "#1D3442",
          200: "#2C4554",
          300: "#466170",
          400: "#8398A3",
          500: "#A2B2BA",
          600: "#BCC8CE",
          700: "#D2DBDF",
          800: "#E4EAED",
          900: "#F4F8FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "sans-serif"],
      },
      keyframes: {
        badgePop: {
          '0%':   { transform: 'scale(0.6)', opacity: '0' },
          '60%':  { transform: 'scale(1.18)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'badge-pop': 'badgePop 220ms ease-out',
        'slide-up':  'slideUp 260ms ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
