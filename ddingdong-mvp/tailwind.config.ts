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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#FFC700", // Custom yellow color
        secondary: "#FF6347", // Custom red-orange color
      },
      animation: {
        bounceSlow: "bounce 2s infinite",
        fadeIn: "fadeIn 0.5s ease-in-out",
        fadeOut: "fadeOut 0.5s ease-in-out forwards", // Added fadeOut animation
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },  // Starts visible
          "100%": { opacity: "0" }, // Fades out
        },
      },
      fontSize: {
        "responsive-title": "clamp(1.5rem, 4vw, 3rem)", // Responsive title text
      },
    },
  },
  plugins: [],
};

export default config;