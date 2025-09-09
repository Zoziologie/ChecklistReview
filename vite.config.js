import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: "/ChecklistReview/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
