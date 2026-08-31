import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        atlas: {
          night: "#050608",
          graphite: "#11151c",
          mist: "#c8d2dc",
          blue: "#6aa8ff",
          cyan: "#72f3ff"
        }
      }
    }
  },
  plugins: []
};

export default config;
