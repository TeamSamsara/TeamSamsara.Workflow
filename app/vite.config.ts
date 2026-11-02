// File : /TeamSamsara.Workflow/app/vite.config.ts
// Version : 1.4.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : Vite setup: React, the @/ alias, and the build split into a few
// files. Firebase and React rarely change, so they get files of their own that
// the browser keeps cached when only the app's code changes.

import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Firestore alone is about 600 kB minified (under 200 kB gzipped); that is expected. */
const largestExpectedChunkKb = 800;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Every Firebase part bundled together up front. Found one at a time, a
    // late one (firebase/functions) gets its own copy of Firebase's core, which
    // doesn't see the others' sign-in, and the app waits forever.
    include: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/functions",
      "firebase/storage",
    ],
  },
  css: {
    // Lightning CSS (bundled with Vite) handles CSS Modules, including
    // `composes: … from "./other.module.css"`, without PostCSS warnings.
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
    chunkSizeWarningLimit: largestExpectedChunkKb,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "firebase",
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
            },
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
