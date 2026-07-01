// tailwind.config.ts
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", ...fontFamily.sans],
        display: ["var(--font-display)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      colors: {
        // Design system tokens mapped to Tailwind
        void:     "var(--bg-void)",
        surface:  "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover:    "var(--bg-hover)",
        primary:  "var(--text-primary)",
        muted:    "var(--text-muted)",
        dim:      "var(--text-dim)",
        edge:     "var(--accent-edge)",
        win:      "var(--accent-win)",
        loss:     "var(--accent-loss)",
        neutral:  "var(--accent-neutral)",
        gold:     "var(--accent-gold)",
        purple:   "var(--accent-purple)",
        border: {
          DEFAULT: "hsl(var(--border))",
          active: "var(--border-active)",
        },
        background: "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring:  "hsl(var(--ring))",
      },
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        cyan: "0 0 20px rgba(0,229,255,0.15)",
        win:  "0 0 20px rgba(0,255,136,0.15)",
        loss: "0 0 20px rgba(255,61,90,0.15)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
