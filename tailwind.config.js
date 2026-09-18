/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#101215",
        surface: "#171a1e",
        border: "#2a3037",
      },
    },
  },
  plugins: [],
};
