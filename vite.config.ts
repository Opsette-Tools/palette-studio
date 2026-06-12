import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: ({ command }) => ({
    base: command === "build" ? "/palette-studio/" : "/",
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: { navigateFallback: "index.html" },
        devOptions: { enabled: false },
        injectRegister: null,
      }),
    ],
  }),
});
