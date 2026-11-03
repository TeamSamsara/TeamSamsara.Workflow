// File : /TeamSamsara.Workflow/app/src/core/theme/themeService.test.ts
// Version : 1.1.0
// Latest commit: core/workspace
// Author : Gerrah
// Purpose : Tests saving, reading and showing the theme choice, including a
// browser that blocks storage.

import { afterEach, describe, expect, it, vi } from "vitest";
import { StorageKeys } from "@/shared/constants/storageKeys";
import {
  applyThemeChoice,
  isThemeChoice,
  readStoredDefaultTheme,
  readStoredThemeChoice,
  saveDefaultTheme,
  saveThemeChoice,
} from "./themeService";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("isThemeChoice", () => {
  it("accepts the three choices and nothing else", () => {
    expect(isThemeChoice("light")).toBe(true);
    expect(isThemeChoice("dark")).toBe(true);
    expect(isThemeChoice("device")).toBe(true);
    expect(isThemeChoice("blue")).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
  });
});

describe("saving and reading", () => {
  it("reads back what was saved", () => {
    saveThemeChoice("dark");
    expect(readStoredThemeChoice()).toBe("dark");
  });

  it("keeps device as a real choice, apart from the workspace default", () => {
    saveDefaultTheme("dark");
    saveThemeChoice("device");
    expect(window.localStorage.getItem(StorageKeys.theme)).toBe("device");
    expect(readStoredThemeChoice()).toBe("device");
    expect(readStoredDefaultTheme()).toBe("dark");
  });

  it("reads nothing when no one has chosen", () => {
    expect(readStoredThemeChoice()).toBeNull();
    expect(readStoredDefaultTheme()).toBeNull();
  });

  it("ignores a value it does not know", () => {
    window.localStorage.setItem(StorageKeys.theme, "purple");
    expect(readStoredThemeChoice()).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveThemeChoice("dark")).not.toThrow();
    expect(readStoredThemeChoice()).toBeNull();
  });
});

describe("applyThemeChoice", () => {
  it("sets data-theme for light and dark", () => {
    applyThemeChoice("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyThemeChoice("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("removes data-theme for device", () => {
    applyThemeChoice("dark");
    applyThemeChoice("device");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
