import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-syne)", "Syne", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        // Brand
        primary: {
          DEFAULT: "#FF6B35",
          light: "#FF8F63",
          dark: "#E55A28",
          dim: "rgba(255, 107, 53, 0.08)",
        },
        // Semantic
        success: {
          DEFAULT: "#2DD4BF",
          dim: "rgba(45, 212, 191, 0.08)",
        },
        danger: {
          DEFAULT: "#F43F5E",
          dim: "rgba(244, 63, 94, 0.08)",
        },
        warning: {
          DEFAULT: "#FBBF24",
          dim: "rgba(251, 191, 36, 0.08)",
        },
        info: {
          DEFAULT: "#6366F1",
          dim: "rgba(99, 102, 241, 0.08)",
        },
        // Text
        heading: "#1A1A1A",
        subtext: "#6B7280",
        label: "#9CA3AF",
        muted: "#9CA3AF",
        // Surface & Background
        surface: {
          DEFAULT: "#F5F5F5",
          hover: "#EAEAEA",
        },
        // Borders
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        // Accent (for old theme references)
        accent: {
          DEFAULT: "#00D4FF",
          dim: "rgba(0, 212, 255, 0.08)",
        },
        // Lavender
        lavender: {
          DEFAULT: "#EEEAF8",
          text: "#7C3AED",
        },
        // Status
        "status-stable": {
          DEFAULT: "#2ED573",
          dim: "rgba(46, 213, 115, 0.12)",
        },
        // Text color palette (alt names used in Hero3D/Navbar)
        "text-primary": "#E8E8E8",
        "text-secondary": "#8B949E",
        "text-muted": "#6B737E",
        // Background palette (alt names used in Hero3D/Navbar)
        "bg-primary": "#0D1117",
        "bg-secondary": "#161B22",
        "bg-tertiary": "#21262D",
        // Border palette (alt names used in Hero3D/Navbar)
        "border-accent": "rgba(0, 212, 255, 0.25)",
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.07)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.12)",
        accent: "0 0 24px rgba(0, 212, 255, 0.25)",
        glow: "0 0 24px rgba(255, 107, 53, 0.25)",
      },
      animation: {
        floating: "floating 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "fade-in-up": "fadeUp 0.5s ease-out both",
        fadeIn: "fadeIn 0.4s ease-out both",
      },
      keyframes: {
        floating: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(255, 107, 53, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 107, 53, 0.6)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
