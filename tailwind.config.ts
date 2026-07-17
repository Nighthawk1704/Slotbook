import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141821",
        paper: "#FBFCFD",
        slateline: "#E3E7ED",
        muted: "#5B6472",
        accent: "#1F6FEB",
        "accent-dim": "#EAF1FE",
        taken: "#B84A3B",
        "taken-dim": "#FBEDEA",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
