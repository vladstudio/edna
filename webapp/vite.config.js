import * as child from "child_process";

import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "../public",

  plugins: [vue()],

  // build: {
  //   target: "esnext", // needed for top-level await
  // },

  css: {
    preprocessorOptions: {
      sass: {
        additionalData: `
    @import "../src/css/include.sass"
    `,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __GIT_HASH__: JSON.stringify(
      child.execSync("git rev-parse --short HEAD").toString().trim()
    ),
  },

  server: {
    // must be same as proxyURLStr in runServerDev
    port: 3035,
  },
});
