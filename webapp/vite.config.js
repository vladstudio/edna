import * as child from "child_process";

import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "../public",

  plugins: [vue()],

  build: {
    // target: "esnext", // needed for top-level await
    rollupOptions: {
      output: {
        manualChunks: {
          prettier: [
            "prettier",
            "prettier/plugins/estree.mjs",
            "prettier/plugins/babel.mjs",
            "prettier/esm/parser-postcss.mjs",
            "prettier/esm/parser-html.mjs",
            "prettier/esm/parser-markdown.mjs",
            "prettier/plugins/typescript.mjs",
            "prettier/plugins/yaml.mjs",
          ],
          langjavascript: ["@codemirror/lang-javascript"],
          langcpp: ["@codemirror/lang-cpp"],
          langphp: ["@codemirror/lang-php"],
          langrust: ["@codemirror/lang-rust"],
          langlegacy: [
            "@codemirror/legacy-modes/mode/clojure",
            "@codemirror/legacy-modes/mode/diff",
            "@codemirror/legacy-modes/mode/erlang",
            "@codemirror/legacy-modes/mode/go",
            "@codemirror/legacy-modes/mode/groovy",
            "@codemirror/legacy-modes/mode/clike",
            "@codemirror/legacy-modes/mode/powershell",
            "@codemirror/legacy-modes/mode/ruby",
            "@codemirror/legacy-modes/mode/shell",
            "@codemirror/legacy-modes/mode/swift",
            "@codemirror/legacy-modes/mode/toml",
            "@codemirror/legacy-modes/mode/yaml",

            // "@codemirror/legacy-modes/mode/lua",
            // "@codemirror/legacy-modes/mode/octave",
          ],
        },
      },
    },
  },

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
