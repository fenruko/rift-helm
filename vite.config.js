import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/staff/",
  plugins: [react()],
  server: {
    port: 5174,
  },
});