import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

const isBuild = process.argv.includes("build");

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    base: isBuild ? "/palette-studio/" : "/",
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: { navigateFallback: "index.html" },
        devOptions: { enabled: false },
        injectRegister: null,
      }),
    ],
  },
});
