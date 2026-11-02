// File : /TeamSamsara.Workflow/app/src/features/fields/hooks/useFields.ts
// Version : 1.0.0
// Latest commit: feature/event-fields
// Author : Gerrah
// Purpose : The workspace's fields, live, by name. Every member reads them:
// planning asks for them and tasks show their values.

import { collection } from "firebase/firestore";
import { useMemo } from "react";
import { usePermissions } from "@/core/access";
import {
  Collections,
  useLiveCollection,
  type DataErrorKind,
} from "@/core/data";
import { fieldConverter, type FieldRecord } from "../types/fieldTypes";

export interface FieldList {
  status: "loading" | "ready" | "error";
  items: FieldRecord[];
  error: DataErrorKind | null;
  /** The field with this key, if there is one. */
  byKey: (key: string) => FieldRecord | undefined;
}

export function useFields(): FieldList {
  const isReady = usePermissions().status === "ready";
  const result = useLiveCollection(isReady ? "fields" : null, (database) =>
    collection(database, Collections.fields).withConverter(fieldConverter),
  );
  return useMemo<FieldList>(() => {
    const items =
      result.status === "ready"
        ? [...(result.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
        : [];
    const map = new Map(items.map((field) => [field.id, field]));
    return {
      status:
        result.status === "error"
          ? "error"
          : result.status === "ready"
            ? "ready"
            : "loading",
      items,
      error: result.status === "error" ? result.error : null,
      byKey: (key) => map.get(key),
    };
  }, [result]);
}
