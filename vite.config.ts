import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/recharts")) {
            return "vendor_charts";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "vendor_motion";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor_icons";
          }
        },
      },
    },
  },
});
