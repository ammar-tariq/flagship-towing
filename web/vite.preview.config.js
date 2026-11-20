import { defineConfig } from "vite";

/** Preview production build in dist/ (same as adminFlagship vite preview) */
export default defineConfig({
  root: "dist",
  preview: {
    host: "0.0.0.0",
    port: 60030,
    open: "/index.html",
  },
});
