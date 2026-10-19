import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
declare const process: { env: Record<string, string | undefined> };
export default defineConfig({
  base: process.env.PAGES_BASE_PATH
    ? `${process.env.PAGES_BASE_PATH.replace(/\/$/, "")}/`
    : "/",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["framer-motion"],
          react: ["react", "react-dom"],
          gif: ["gifenc"],
        },
      },
    },
  },
});
