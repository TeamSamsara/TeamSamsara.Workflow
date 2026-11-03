// File : /TeamSamsara.Workflow/app/src/shared/hooks/useSortableList.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Reordering a list by dragging a row, or from the keyboard with the
// arrow keys on its handle. Some rows can be locked in place (and nothing can
// be dropped above them), e.g. roles above your own. The hook only reports the
// move; the caller saves it.

import { useState, type DragEvent, type KeyboardEvent } from "react";

// #region Order helpers (pure, tested)
/** The list with one id moved to a new index. */
export function moveId(
  ids: readonly string[],
  id: string,
  toIndex: number,
): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return [...ids];
  const next = ids.filter((other) => other !== id);
  const target = Math.max(0, Math.min(toIndex, next.length));
  next.splice(target, 0, id);
  return next;
}

/**
 * Where a row may go: never above `firstMovableIndex` (the locked rows sit
 * there) and never past the end.
 */
export function clampIndex(
  toIndex: number,
  length: number,
  firstMovableIndex: number,
): number {
  return Math.max(firstMovableIndex, Math.min(toIndex, length - 1));
}

/** The index the arrow keys move a row to, or null for any other key. */
export function keyboardTarget(key: string, index: number): number | null {
  if (key === "ArrowUp") return index - 1;
  if (key === "ArrowDown") return index + 1;
  return null;
}
// #endregion

interface SortableOptions {
  ids: readonly string[];
  /** Rows before this index can't be moved, and nothing goes above them. */
  firstMovableIndex?: number;
  disabled?: boolean;
  /** Called with the new order after a drop or a keyboard move. */
  onReorder: (orderedIds: string[]) => void;
}

export interface SortableRowProps {
  draggable: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  "data-dragging": boolean;
  "data-drop-target": boolean;
}

export interface SortableHandleProps {
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export function useSortableList({
  ids,
  firstMovableIndex = 0,
  disabled = false,
  onReorder,
}: SortableOptions) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function isMovable(index: number): boolean {
    return !disabled && index >= firstMovableIndex;
  }

  function move(id: string, toIndex: number) {
    const target = clampIndex(toIndex, ids.length, firstMovableIndex);
    if (ids.indexOf(id) === target) return;
    onReorder(moveId(ids, id, target));
  }

  function finishDrag() {
    setDraggingId(null);
    setOverIndex(null);
  }

  function rowProps(id: string, index: number): SortableRowProps {
    const movable = isMovable(index);
    return {
      draggable: movable,
      onDragStart: (event) => {
        if (!movable) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        setDraggingId(id);
      },
      onDragOver: (event) => {
        if (draggingId === null || index < firstMovableIndex) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOverIndex(index);
      },
      onDrop: (event) => {
        event.preventDefault();
        if (draggingId !== null) move(draggingId, index);
        finishDrag();
      },
      onDragEnd: finishDrag,
      "data-dragging": draggingId === id,
      "data-drop-target": overIndex === index && draggingId !== id,
    };
  }

  function handleProps(id: string, index: number): SortableHandleProps {
    return {
      onKeyDown: (event) => {
        if (!isMovable(index)) return;
        const target = keyboardTarget(event.key, index);
        if (target === null) return;
        event.preventDefault();
        move(id, target);
      },
    };
  }

  return { rowProps, handleProps, isMovable };
}
