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
          DEFAULT: "#0B4F6C",
          light: "#0E6B92",
          dark: "#083D54",
        },
        sand: {
          DEFAULT: "#F4A261",
          light: "#F7BE8E",
          dark: "#E8893A",
        },
        slate: {
          DEFAULT: "#1A1A2E",
        },
        surface: "#F8F9FA",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
