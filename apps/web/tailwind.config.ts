import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        panel: "#ffffff",
        panelSoft: "#f4f4f5",
        accent: "#52525b",
        accentHover: "#3f3f46"
      }
    }
  },
  plugins: []
} satisfies Config;
