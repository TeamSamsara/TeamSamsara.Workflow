// File : /TeamSamsara.Workflow/app/src/features/task-setup/ui/ColouredItemDialog.tsx
// Version : 1.0.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Adds or edits an event type or a tag: a name and a colour. Both
// lists start empty; each workspace makes its own.

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Collections, dataErrorMessage, type ColouredItem } from "@/core/data";
import { ColorPicker } from "@/shared/components/Fields/ColorPicker/ColorPicker";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { useToast } from "@/shared/components/Toast/useToast";
import { DefaultColor } from "@/shared/constants/colorPresets";
import { checkName } from "@/shared/validation/nameRules";
import { TextLimits } from "@/shared/validation/textLimits";
import {
  addSetupItem,
  deleteSetupItem,
  saveSetupItem,
} from "../service/setupListService";
import { SetupItemDialog } from "./SetupItemDialog";
import { ColouredItemDialogText, DialogText } from "./taskSetupContent";

export type ColouredListName = "eventType" | "tag";

const collectionFor = {
  eventType: Collections.eventTypes,
  tag: Collections.tags,
} as const;

interface ColouredItemDialogProps {
  list: ColouredListName;
  /** The item to edit, or null to add one. */
  item: ColouredItem | null;
  items: readonly ColouredItem[];
  onClose: () => void;
}

type Action = "save" | "delete";

export function ColouredItemDialog({
  list,
  item,
  items,
  onClose,
}: ColouredItemDialogProps) {
  const text = ColouredItemDialogText[list];
  const toast = useToast();
  const [name, setName] = useState(item?.name ?? "");
  const [color, setColor] = useState(item?.color ?? DefaultColor);
  const [tried, setTried] = useState(false);

  const lastPosition = Math.max(-1, ...items.map((entry) => entry.position));
  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      const target = collectionFor[list];
      if (action === "delete" && item) {
        await deleteSetupItem(target, item.id);
        return;
      }
      if (item) await saveSetupItem(target, item.id, { name, color });
      else await addSetupItem(target, { name, color }, lastPosition);
    },
    onSuccess: (_result, action) => {
      const shown = action === "delete" ? (item?.name ?? "") : name.trim();
      toast.show({
        tone: "success",
        title:
          action === "delete"
            ? DialogText.deleted(shown)
            : item
              ? DialogText.saved(shown)
              : DialogText.added(shown),
      });
      onClose();
    },
  });

  function submit() {
    setTried(true);
    if (checkName(name)) return;
    mutation.mutate("save");
  }

  return (
    <SetupItemDialog
      title={item ? text.editTitle(item.name) : text.newTitle}
      existingName={item?.name ?? null}
      onSubmit={submit}
      onDelete={() => mutation.mutate("delete")}
      onClose={onClose}
      isBusy={mutation.isPending}
      error={mutation.error ? dataErrorMessage(mutation.error) : null}
      deleteNote={text.deleteNote}
    >
      <TextField
        label={DialogText.name}
        placeholder={text.namePlaceholder}
        value={name}
        maxLength={TextLimits.name}
        onChange={(event) => setName(event.target.value)}
        error={tried ? checkName(name) : undefined}
        autoFocus
      />
      <ColorPicker value={color} onChange={setColor} hint={text.colorHint} />
    </SetupItemDialog>
  );
}
