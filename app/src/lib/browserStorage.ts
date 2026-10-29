// File : /TeamSamsara.Workflow/app/src/lib/browserStorage.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Reads and writes the browser's localStorage without ever throwing.
// Storage can be blocked (private windows, strict settings), and a preference
// failing to save must never break the page.

export const browserStorage = {
  read(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  write(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Blocked storage: the choice lasts until the page is closed.
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Blocked storage: nothing was saved, so there is nothing to remove.
    }
  },
} as const;
