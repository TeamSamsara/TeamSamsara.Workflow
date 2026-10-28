// File : /TeamSamsara.Workflow/app/src/vite-env.d.ts
// Version : 1.0.0
// Latest commit: core/project-setup
// Author : Gerrah
// Purpose : Declares the shape of import.meta.env so every VITE_* variable
// used in the app is properly typed instead of implicitly any.

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_USE_FIREBASE_EMULATORS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
