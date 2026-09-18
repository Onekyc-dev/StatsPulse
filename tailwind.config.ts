import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#050b0d", 900: "#071215", 800: "#0a1518", 700: "#0f1d21" },
        pulse: { 300: "#7bf5cf", 400: "#37e6b1", 500: "#18e6a4", 600: "#10a77b" },
        win: "#22d18b",
        draw: "#f5b73a",
        loss: "#ff5c6c",
        away: "#4c9bff"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
