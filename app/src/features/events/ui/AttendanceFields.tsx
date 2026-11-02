// File : /TeamSamsara.Workflow/app/src/features/events/ui/AttendanceFields.tsx
// Version : 1.0.0
// Latest commit: feature/attendance-photos
// Author : Gerrah
// Purpose : The planning part of asking people to reply: a switch to ask,
// then everyone in the event with Required or Optional (all required when
// asking starts), and whether to hear about every reply.

import { Avatar } from "@/shared/components/Avatar/Avatar";
import { Button } from "@/shared/components/Button/Button";
import { Checkbox } from "@/shared/components/Fields/Checkbox/Checkbox";
import { Switch } from "@/shared/components/Fields/Switch/Switch";
import { SegmentedControl } from "@/shared/components/SegmentedControl/SegmentedControl";
import { requiredAfter } from "../model/attendance";
import type { Attendance } from "../types/attendance";
import type { AudienceOption } from "./AudiencePicker";
import { AttendanceFormText as Text } from "./attendanceContent";
import styles from "./AttendanceFields.module.css";

interface AttendanceFieldsProps {
  value: Attendance;
  onChange: (value: Attendance) => void;
  /** Everyone in the event now. */
  people: readonly AudienceOption[];
}

type Choice = "required" | "optional";

export function AttendanceFields({
  value,
  onChange,
  people,
}: AttendanceFieldsProps) {
  const ids = people.map((person) => person.id);
  const setRequired = (requiredIds: string[]) =>
    onChange({ ...value, requiredIds });

  return (
    <fieldset className={styles.fields}>
      <legend className={styles.hidden}>{Text.ask}</legend>
      <Switch
        className={styles.ask}
        label={Text.ask}
        description={Text.askHelp}
        checked={value.asksReply}
        onCheckedChange={(asksReply) =>
          onChange({
            ...value,
            asksReply,
            requiredIds: requiredAfter(
              { ...value, asksReply },
              value.asksReply,
              ids,
            ),
          })
        }
      />
      {value.asksReply ? (
        <>
          <div className={styles.head}>
            <span className={styles.label}>{Text.required}</span>
            {people.length > 0 ? (
              <>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => setRequired(ids)}
                >
                  {Text.allRequired}
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => setRequired([])}
                >
                  {Text.allOptional}
                </Button>
              </>
            ) : null}
          </div>
          {people.length === 0 ? (
            <p className={styles.muted}>{Text.noPeople}</p>
          ) : (
            <ul className={styles.people}>
              {people.map((person) => {
                const required = value.requiredIds.includes(person.id);
                return (
                  <li key={person.id} className={styles.person}>
                    <Avatar
                      name={person.name}
                      src={person.photoUrl}
                      size="small"
                    />
                    <span className={styles.name}>
                      <b>{person.name}</b>
                      {person.subName ? (
                        <span className={styles.muted}>{person.subName}</span>
                      ) : null}
                    </span>
                    <SegmentedControl<Choice>
                      label={Text.choiceLabel(person.name)}
                      options={[
                        { value: "required", label: Text.choices.required },
                        { value: "optional", label: Text.choices.optional },
                      ]}
                      value={required ? "required" : "optional"}
                      onChange={(choice) =>
                        setRequired(
                          choice === "required"
                            ? [...value.requiredIds, person.id]
                            : value.requiredIds.filter(
                                (id) => id !== person.id,
                              ),
                        )
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.muted}>{Text.laterNote}</p>
          <Checkbox
            label={Text.everyReply}
            description={Text.everyReplyHelp}
            checked={value.tellEveryReply}
            onChange={(event) =>
              onChange({ ...value, tellEveryReply: event.target.checked })
            }
          />
        </>
      ) : null}
    </fieldset>
  );
}
