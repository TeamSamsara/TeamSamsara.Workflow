// File : /TeamSamsara.Workflow/app/src/main.tsx
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The entry point: loads the global stylesheet and mounts the app.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/shared/styling/global.css";
import { App } from "@/app/App";
import { DevInvariants } from "@/lib/devInvariants";

const rootElementId = "root";
const rootElement = document.getElementById(rootElementId);

if (!rootElement) {
  throw new Error(DevInvariants.missingRootElement);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
