// File : /TeamSamsara.Workflow/app/eslint.config.js
// Version : 1.1.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Lint rules for the app: the website's base rules, plus the layer
// boundaries (app → views → features → core → shared → lib), so an import that
// points up a layer fails lint instead of slipping through review.

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

// #region Layer boundaries
const deepCoreImport = {
  group: ["@/core/*/*"],
  message: "Import a core module through its index: @/core/<module>.",
};

const deepFeatureImport = {
  group: ["@/features/*/*"],
  message: "Import a feature through its index: @/features/<feature>.",
};

const layerBoundaries = [
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    patterns: [
      {
        group: [
          "@/shared/**",
          "@/core/**",
          "@/features/**",
          "@/views/**",
          "@/app/**",
        ],
        message: "lib/ wraps outside libraries and imports nothing else.",
      },
    ],
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/core/**", "@/features/**", "@/views/**", "@/app/**"],
        message:
          "shared/ knows nothing about Workflow: it may import lib/ only.",
      },
    ],
  },
  {
    files: ["src/core/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/features/**", "@/views/**", "@/app/**"],
        message: "core/ may import other core modules, shared/ and lib/ only.",
      },
      deepCoreImport,
    ],
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/views/**", "@/app/**"],
        message: "features/ never import views or the app.",
      },
      deepCoreImport,
      deepFeatureImport,
    ],
  },
  {
    files: ["src/views/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/views/**", "@/app/**"],
        message:
          "A view never imports another view or the app. Move a shared piece into a feature.",
      },
      deepCoreImport,
      deepFeatureImport,
    ],
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    patterns: [deepCoreImport, deepFeatureImport],
  },
];
// #endregion

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  ...layerBoundaries.map(({ files, patterns }) => ({
    files,
    rules: {
      "no-restricted-imports": ["error", { patterns }],
    },
  })),
]);
