/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0b0c10",
        surface: "#111319",
        border: "#1f2230",
      },
    },
  },
  plugins: [],
};
