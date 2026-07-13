/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0E0E10",
        card: "#1C1C1E",
        nikeOrange: "#FA5400",
        border: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
