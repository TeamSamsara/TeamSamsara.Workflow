// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/guide/WorkflowGuide.tsx
// Version : 1.0.0
// Latest commit: feature/workflow-guide
// Author : Gerrah
// Purpose : Making a workflow one question at a time: its name, its tasks,
// who does each, when each is due, then a last look before creating it. Each
// step says what it's asking and why, and suggests common answers.

import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { dataErrorMessage, type MemberRecord } from "@/core/data";
import { memberName } from "@/features/members";
import type { WorkGroupRecord } from "@/features/work-groups";
import { Banner } from "@/shared/components/Banner/Banner";
import { Button } from "@/shared/components/Button/Button";
import { IconButton } from "@/shared/components/Button/IconButton";
import { Select } from "@/shared/components/Fields/Select/Select";
import { TextArea } from "@/shared/components/Fields/TextArea/TextArea";
import { TextField } from "@/shared/components/Fields/TextField/TextField";
import { StepProgress } from "@/shared/components/StepProgress/StepProgress";
import { Icon } from "@/shared/icons/Icon";
import type { ClockFormat } from "@/shared/time/dates";
import { TextLimits } from "@/shared/validation/textLimits";
import { describeDue } from "../../model/dueOffset";
import { DuePresets, matchPreset } from "../../model/duePresets";
import { giveToValue, parseGiveTo } from "../../model/giveTo";
import {
  guideTask,
  guideToWorkflow,
  SuggestedNames,
  SuggestedTasks,
  type GuideAnswers,
} from "../../model/guide";
import { createWorkflow } from "../../service/workflowService";
import { WorkflowLimits } from "../../types/workflowTypes";
import { giveToOptions } from "../giveToOptions";
import { GuideText as Text } from "./guideContent";
import styles from "./WorkflowGuide.module.css";

const stepKeys = ["name", "tasks", "who", "when", "review"] as const;
type StepKey = (typeof stepKeys)[number];

interface WorkflowGuideProps {
  answers: GuideAnswers;
  onChange: (answers: GuideAnswers) => void;
  groups: readonly WorkGroupRecord[];
  members: readonly MemberRecord[];
  clockFormat: ClockFormat;
  onCancel: () => void;
  onCreated: (workflowId: string) => void;
}

export function WorkflowGuide({
  answers,
  onChange,
  groups,
  members,
  clockFormat,
  onCancel,
  onCreated,
}: WorkflowGuideProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [newTask, setNewTask] = useState("");
  const [tried, setTried] = useState(false);
  const step: StepKey = stepKeys[stepIndex];
  const words = Text.steps[step];

  const create = useMutation({
    mutationFn: () => createWorkflow(guideToWorkflow(answers)),
    onSuccess: onCreated,
  });

  const problem =
    step === "name" && !answers.name.trim()
      ? Text.needName
      : step === "tasks" && answers.tasks.length === 0
        ? Text.needTask
        : null;
  const canAdd = answers.tasks.length < WorkflowLimits.steps;
  const taken = new Set(answers.tasks.map((task) => task.title.toLowerCase()));

  function addTask(title: string) {
    if (!title.trim() || !canAdd || taken.has(title.trim().toLowerCase()))
      return;
    onChange({ ...answers, tasks: [...answers.tasks, guideTask(title)] });
  }

  function changeTask(
    id: string,
    changes: Partial<GuideAnswers["tasks"][number]>,
  ) {
    onChange({
      ...answers,
      tasks: answers.tasks.map((task) =>
        task.id === id ? { ...task, ...changes } : task,
      ),
    });
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (problem) {
      setTried(true);
      return;
    }
    setTried(false);
    if (step === "review") create.mutate();
    else setStepIndex(stepIndex + 1);
  }

  const giveToChoices = giveToOptions(groups, members);
  const whoLabel = (task: GuideAnswers["tasks"][number]) =>
    groups.find((group) => group.id === task.workGroupId)?.name ??
    (() => {
      const member = members.find((entry) => entry.id === task.memberId);
      return member ? memberName(member) : Text.steps.review.unassigned;
    })();
  const preview = guideToWorkflow(answers).steps;

  return (
    <form className={styles.guide} onSubmit={next} noValidate>
      <StepProgress
        current={stepIndex}
        total={stepKeys.length}
        label={words.label}
      />

      <header className={styles.header}>
        <h2 className={styles.title}>{words.title}</h2>
        <p className={styles.body}>{words.body}</p>
      </header>

      {tried && problem ? <Banner tone="error">{problem}</Banner> : null}
      {create.error ? (
        <Banner tone="error">
          {Text.createFailed}: {dataErrorMessage(create.error)}
        </Banner>
      ) : null}

      <div className={styles.content}>
        {step === "name" ? (
          <>
            <TextField
              label={Text.steps.name.name}
              placeholder={Text.steps.name.namePlaceholder}
              value={answers.name}
              maxLength={TextLimits.name}
              onChange={(event) =>
                onChange({ ...answers, name: event.target.value })
              }
              autoFocus
            />
            <div
              className={styles.suggestions}
              role="group"
              aria-label={Text.steps.name.suggestions}
            >
              <span className={styles.muted}>
                {Text.steps.name.suggestions}
              </span>
              {SuggestedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={styles.suggestion}
                  data-picked={answers.name === name}
                  onClick={() => onChange({ ...answers, name })}
                >
                  {name}
                </button>
              ))}
            </div>
            <TextArea
              label={Text.steps.name.description}
              placeholder={Text.steps.name.descriptionPlaceholder}
              value={answers.description}
              rows={2}
              maxLength={WorkflowLimits.description}
              onChange={(event) =>
                onChange({ ...answers, description: event.target.value })
              }
            />
          </>
        ) : null}

        {step === "tasks" ? (
          <>
            <div className={styles.addRow}>
              <TextField
                label={Text.steps.tasks.input}
                placeholder={Text.steps.tasks.inputPlaceholder}
                value={newTask}
                maxLength={WorkflowLimits.title}
                onChange={(event) => setNewTask(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTask(newTask);
                    setNewTask("");
                  }
                }}
                disabled={!canAdd}
                className={styles.addField}
                autoFocus
              />
              <Button
                iconStart="add"
                onClick={() => {
                  addTask(newTask);
                  setNewTask("");
                }}
                disabled={!newTask.trim() || !canAdd}
                className={styles.addButton}
              >
                {Text.steps.tasks.add}
              </Button>
            </div>
            <div
              className={styles.suggestions}
              role="group"
              aria-label={Text.steps.tasks.suggestions}
            >
              <span className={styles.muted}>
                {Text.steps.tasks.suggestions}
              </span>
              {SuggestedTasks.filter(
                (task) => !taken.has(task.title.toLowerCase()),
              ).map((task) => (
                <button
                  key={task.title}
                  type="button"
                  className={styles.suggestion}
                  onClick={() => addTask(task.title)}
                  disabled={!canAdd}
                >
                  <Icon name="add" />
                  {task.title}
                </button>
              ))}
            </div>
            {answers.tasks.length === 0 ? (
              <p className={styles.empty}>{Text.steps.tasks.none}</p>
            ) : (
              <ol
                className={styles.list}
                aria-label={Text.steps.tasks.count(answers.tasks.length)}
              >
                {answers.tasks.map((task, index) => (
                  <li key={task.id} className={styles.row}>
                    <span className={styles.number}>{index + 1}.</span>
                    <span className={styles.rowTitle}>{task.title}</span>
                    <IconButton
                      icon="close"
                      label={Text.steps.tasks.remove(task.title)}
                      variant="ghost"
                      size="small"
                      onClick={() =>
                        onChange({
                          ...answers,
                          tasks: answers.tasks.filter(
                            (entry) => entry.id !== task.id,
                          ),
                        })
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
            {!canAdd ? (
              <p className={styles.muted}>{Text.full(WorkflowLimits.steps)}</p>
            ) : null}
          </>
        ) : null}

        {step === "who" ? (
          <ol className={styles.list}>
            {answers.tasks.map((task) => (
              <li key={task.id} className={styles.choiceRow}>
                <span className={styles.rowTitle}>{task.title}</span>
                <Select
                  label={task.title}
                  hideLabel
                  options={giveToChoices}
                  value={giveToValue(task)}
                  onChange={(event) =>
                    changeTask(task.id, parseGiveTo(event.target.value))
                  }
                  className={styles.choice}
                />
              </li>
            ))}
          </ol>
        ) : null}

        {step === "when" ? (
          <ol className={styles.list}>
            {answers.tasks.map((task) => (
              <li key={task.id} className={styles.choiceRow}>
                <span className={styles.rowTitle}>{task.title}</span>
                <Select
                  label={task.title}
                  hideLabel
                  options={DuePresets.map((preset) => ({
                    value: preset.id,
                    label: describeDue(preset.offset, clockFormat),
                  }))}
                  value={matchPreset(task.due)?.id ?? DuePresets[0].id}
                  onChange={(event) => {
                    const preset = DuePresets.find(
                      (entry) => entry.id === event.target.value,
                    );
                    if (preset) changeTask(task.id, { due: preset.offset });
                  }}
                  className={styles.choice}
                />
              </li>
            ))}
          </ol>
        ) : null}

        {step === "review" ? (
          <div className={styles.review}>
            <h3 className={styles.reviewName}>{answers.name.trim()}</h3>
            {answers.description.trim() ? (
              <p className={styles.muted}>{answers.description.trim()}</p>
            ) : null}
            <ol className={styles.list}>
              {preview.map((task, index) => (
                <li key={task.id} className={styles.reviewRow}>
                  <span className={styles.number}>{index + 1}.</span>
                  <span className={styles.rowTitle}>{task.title}</span>
                  <span className={styles.reviewMeta}>
                    <span>{whoLabel(task)}</span>
                    <span className={styles.when}>
                      <Icon name="time" />
                      {describeDue(task.due, clockFormat)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <Button variant="ghost" onClick={onCancel} disabled={create.isPending}>
          {Text.cancel}
        </Button>
        <span className={styles.footerEnd}>
          {stepIndex > 0 ? (
            <Button
              variant="secondary"
              iconStart="back"
              onClick={() => {
                setTried(false);
                setStepIndex(stepIndex - 1);
              }}
              disabled={create.isPending}
            >
              {Text.back}
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            iconEnd={step === "review" ? undefined : "next"}
            iconStart={step === "review" ? "check" : undefined}
            isLoading={create.isPending}
          >
            {step === "review" ? Text.create : Text.next}
          </Button>
        </span>
      </footer>
    </form>
  );
}
