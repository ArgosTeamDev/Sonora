import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Sonora",
        short_name: "Sonora",
        description: "Rate and review the music you listen to day to day.",
        theme_color: "#0f131c",
        background_color: "#0f131c",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Hash routing means one HTML shell handles every route, so a full
        // precache is enough — no server-side rewrite rules needed offline.
        globPatterns: ["**/*.{js,css,html,png,svg,jpg}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@project/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
