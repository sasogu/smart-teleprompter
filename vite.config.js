import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app.html"),
      },
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
