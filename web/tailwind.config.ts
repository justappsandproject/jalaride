import type { Config } from "tailwindcss";
import { Brand } from "./src/lib/brand";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: Brand.primary,
        accent: Brand.accent,
        background: Brand.backgroundDark,
        surface: Brand.surface,
        "text-primary": Brand.textPrimary,
        "text-secondary": Brand.textSecondary,
        error: Brand.error,
        success: Brand.success,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
