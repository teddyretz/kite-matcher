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
          DEFAULT: "#00E5FF",
          light: "#33ECFF",
          dark: "#00B8CC",
        },
        sand: {
          DEFAULT: "#FF5A30",
          light: "#FF7D5C",
          dark: "#CC4020",
        },
        slate: {
          DEFAULT: "#E8EFFF",
        },
        surface: "#080D16",
        card: "#0D1421",
        // Inverted gray scale for dark-first design
        // Low numbers = dark backgrounds/borders, High numbers = light text
        gray: {
          50:  "#0D1421",
          100: "#1A2535",
          200: "#253848",
          300: "#3D5870",
          400: "#5C7A94",
          500: "#7A9BB5",
          600: "#9DB5CC",
          700: "#C0D0E0",
          800: "#D8E5F0",
          900: "#E8EFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
