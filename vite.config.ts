// @ts-nocheck - Vite config has runtime dependencies
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'client',
  plugins: [
    tailwindcss(),
    
    react(),
    ...(process.env.NODE_ENV !== "production"
      ? [
          runtimeErrorOverlay(),
          ...(process.env.REPL_ID !== undefined
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                  m.cartographer(),
                ),
              ]
            : []),
        ]
      : []),
  ],
  resolve: {
    alias: {
  "@": path.resolve(__dirname, "client", "src"),
  "@shared": path.resolve(__dirname, "shared"),
  "@assets": path.resolve(__dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
});
