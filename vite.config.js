import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  test: {
    environment: "jsdom",
  },
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    allowedHosts: [".e2b.app"],
  },
});