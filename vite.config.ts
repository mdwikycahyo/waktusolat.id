import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "waktusolat.id",
        short_name: "WaktuSolat",
        start_url: "/",
        display: "standalone",
        background_color: "#FFFFFF",
        theme_color: "#000000",
        description: "Jadwal sholat harian untuk Jakarta dan sekitarnya.",
        icons: [
          {
            src: "/waktusolat.id.splash.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/waktusolat.id.splash.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
