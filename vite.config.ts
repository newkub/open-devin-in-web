import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import UnoCSS from "unocss/vite";

export default defineConfig({
  plugins: [solid(), UnoCSS()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/rpc": "http://127.0.0.1:3000",
    },
  },
  build: { target: "esnext" },
});
