import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Tons Semânticos Requeridos:
        // Verde (Bons preços)
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          subtle: "hsl(var(--success-subtle))",
          border: "hsl(var(--success-border))",
        },
        // Vermelho (Preços ruins/altos)
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          subtle: "hsl(var(--danger-subtle))",
          border: "hsl(var(--danger-border))",
        },
        // Tons Beges & Quentes
        warm: {
          50: "#faf8f5",
          100: "#f4f0e8",
          200: "#e9e3d5",
          300: "#dcd2be",
          400: "#c7b79a",
          500: "#b39e7c",
          600: "#9c8464",
          700: "#7c6850",
          800: "#5d4e3e",
          900: "#3d342b",
          950: "#221d18",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.07), 0 4px 12px -2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.06)",
        "green-glow": "0 8px 25px -4px rgba(16, 185, 129, 0.25)",
        "red-glow": "0 8px 25px -4px rgba(239, 68, 68, 0.25)",
        float: "0 20px 50px -10px rgba(0, 0, 0, 0.15)",
      },
      fontFamily: {
        sans: [
          "'Strichpunkt Sans Variable'",
          "'Strichpunkt Sans'",
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
