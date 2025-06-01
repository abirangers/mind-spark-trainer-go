/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts", // Path to setup file
    css: true, // If you want to process CSS during tests (e.g. for CSS Modules)
  },
});
