import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pulse: { 400: "#37e6b1", 500: "#19c995", 600: "#10a77b" }
      }
    }
  },
  plugins: []
};

export default config;