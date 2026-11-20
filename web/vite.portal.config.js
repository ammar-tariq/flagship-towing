import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss()],
  build: {
    outDir: "css",
    emptyOutDir: false,
    assetsDir: ".",
    rollupOptions: {
      input: "src/portal.css",
      output: {
        assetFileNames: "admin-portal[extname]",
      },
    },
  },
});
