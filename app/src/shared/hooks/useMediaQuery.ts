// File : /TeamSamsara.Workflow/app/src/shared/hooks/useMediaQuery.ts
// Version : 1.0.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : Tells a component whether a media query matches right now, and
// re-renders it when that changes (a window resized, the device theme flipped).

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
