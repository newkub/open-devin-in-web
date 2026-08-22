import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import UnoCSS from "unocss/vite";

export default defineConfig({
  plugins: [solid(), UnoCSS()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/rpc": "http://localhost:3000",
    },
  },
  build: { target: "esnext" },
});
