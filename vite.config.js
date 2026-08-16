import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));
const devCertPath = resolve(__dirname, ".local/dev.crt");
const devKeyPath = resolve(__dirname, ".local/dev.key");
const useDevHttps =
  process.env.VITE_DEV_HTTPS === "1" &&
  existsSync(devCertPath) &&
  existsSync(devKeyPath);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [tailwindcss(), react()],
  server: useDevHttps
    ? {
        https: {
          cert: readFileSync(devCertPath),
          key: readFileSync(devKeyPath),
        },
      }
    : undefined,
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
