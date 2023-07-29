// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "Didact.createElement",
  },
});
