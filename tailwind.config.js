/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        watt: {
          bg: "#121212",
          card: "#1E1E1E",
          primary: "#00E5FF",
          success: "#32D74B",
          error: "#FF453A",
          border: "#2C2C2E",
          text: "#FFFFFF",
          "text-muted": "#98989D",
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      borderRadius: {
        watt: "8px",
        "watt-card": "16px",
      },
    },
  },
  plugins: [],
};
