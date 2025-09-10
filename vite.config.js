import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [vue()],
  base: "/ChecklistReview/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_LICENSE__: JSON.stringify(packageJson.license),
  },
});
