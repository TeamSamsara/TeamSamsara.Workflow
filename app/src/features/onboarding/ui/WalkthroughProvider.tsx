// File : /TeamSamsara.Workflow/app/src/features/onboarding/ui/WalkthroughProvider.tsx
// Version : 1.0.0
// Latest commit: feature/onboarding
// Author : Gerrah
// Purpose : Runs the walkthrough around the signed-in app. The first time
// someone signs in it welcomes them; then it goes chapter by chapter, opening
// each step's page and pointing at its part. Each chapter finished (or
// skipped) is saved on their record, so it picks up where they left it on any
// device and offers only new chapters after a new role. It ends with "Make it
// yours".

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/core/access";
import type { MemberRecord, Walkthrough } from "@/core/data";
import { useSession } from "@/core/session";
import { memberName } from "@/features/members";
import { useToast } from "@/shared/components/Toast/useToast";
import { RoutePaths } from "@/shared/constants/routePaths";
import {
  WalkthroughContext,
  type WalkthroughApi,
} from "../hooks/WalkthroughContext";
import { chaptersFor, type Chapter, type ChapterId } from "../model/chapters";
import { saveWalkthrough } from "../service/walkthroughService";
import { MakeItYoursDialog } from "./MakeItYoursDialog";
import { WalkthroughText } from "./onboardingContent";
import { WalkthroughOverlay } from "./WalkthroughOverlay";
import { WelcomeDialog } from "./WelcomeDialog";

interface Run {
  chapters: Chapter[];
  chapter: number;
  step: number;
}

function WalkthroughRunner({
  member,
  children,
}: {
  member: MemberRecord;
  children: ReactNode;
}) {
  const access = usePermissions();
  const navigate = useNavigate();
  const toast = useToast();
  const [run, setRun] = useState<Run | null>(null);
  const [isYoursOpen, setIsYoursOpen] = useState(false);
  // Saved changes show on the record a moment later; this covers the gap.
  const [local, setLocal] = useState<Walkthrough | null>(null);
  const record = local ?? member.walkthrough;
  const chapters = useMemo(
    () => (access.status === "ready" ? chaptersFor(access.permissions) : []),
    [access.status, access.permissions],
  );
  const left = chapters.filter(
    (chapter) => !(record?.done ?? []).includes(chapter.id),
  );

  const save = useCallback(
    (next: Walkthrough) => {
      setLocal(next);
      saveWalkthrough(member.id, next).catch(() => undefined);
    },
    [member.id],
  );
  const markDone = useCallback(
    (id: ChapterId) => {
      const current = record ?? { done: [], hidden: false };
      if (current.done.includes(id)) return;
      save({ ...current, done: [...current.done, id] });
    },
    [record, save],
  );

  const begin = useCallback(
    (list: Chapter[]) => {
      if (list.length === 0) return;
      if (!record) save({ done: [], hidden: false });
      if (list[0].steps.length === 0) {
        setIsYoursOpen(true);
        return;
      }
      setRun({ chapters: list, chapter: 0, step: 0 });
    },
    [record, save],
  );

  const api: WalkthroughApi = {
    chapters,
    left,
    record,
    isRunning: run !== null || isYoursOpen,
    start: (ids) =>
      begin(
        ids ? chapters.filter((chapter) => ids.includes(chapter.id)) : left,
      ),
    replay: () => begin(chapters),
    hide: () => save({ done: record?.done ?? [], hidden: true }),
  };

  // Each step opens its own page (once, so the page can be used).
  const current = run ? run.chapters[run.chapter] : null;
  const step = current ? current.steps[run?.step ?? 0] : null;
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (!step || !current) {
      opened.current = null;
      return;
    }
    const key = `${current.id}:${step.target}:${step.path}`;
    if (opened.current === key) return;
    opened.current = key;
    navigate(step.path);
  }, [step, current, navigate]);

  function finishChapter(from: Run) {
    markDone(from.chapters[from.chapter].id);
    const next = from.chapter + 1;
    const after = from.chapters[next];
    if (!after) {
      setRun(null);
      return;
    }
    if (after.steps.length === 0) {
      // "Make it yours" is a dialog, not steps.
      setRun(null);
      setIsYoursOpen(true);
      return;
    }
    setRun({ ...from, chapter: next, step: 0 });
  }

  const flat = run
    ? run.chapters.flatMap((chapter, index) =>
        chapter.steps.map((_step, at) => ({ chapter: index, step: at })),
      )
    : [];
  const position = run
    ? flat.findIndex(
        (entry) => entry.chapter === run.chapter && entry.step === run.step,
      ) + 1
    : 0;

  const showWelcome =
    !record && !run && !isYoursOpen && access.status === "ready";

  return (
    <WalkthroughContext value={api}>
      {children}
      {showWelcome ? (
        <WelcomeDialog
          name={memberName(member)}
          chapters={chapters}
          onStart={() => begin(chapters)}
          onLater={() => save({ done: [], hidden: false })}
        />
      ) : null}
      {run && current && step ? (
        <WalkthroughOverlay
          key={`${run.chapter}:${run.step}`}
          step={step}
          chapterTitle={current.title}
          position={position}
          total={flat.length}
          isFirst={position === 1}
          isLastOfChapter={run.step === current.steps.length - 1}
          onBack={() =>
            setRun(
              run.step > 0
                ? { ...run, step: run.step - 1 }
                : {
                    ...run,
                    chapter: run.chapter - 1,
                    step: run.chapters[run.chapter - 1].steps.length - 1,
                  },
            )
          }
          onNext={() =>
            run.step < current.steps.length - 1
              ? setRun({ ...run, step: run.step + 1 })
              : finishChapter(run)
          }
          onSkipChapter={() => finishChapter(run)}
          onClose={() => {
            setRun(null);
            toast.show({ tone: "info", title: WalkthroughText.paused });
          }}
        />
      ) : null}
      {isYoursOpen ? (
        <MakeItYoursDialog
          member={member}
          onDone={(result) => {
            setIsYoursOpen(false);
            markDone("yours");
            if (result === "paint") navigate(RoutePaths.availability);
          }}
        />
      ) : null}
    </WalkthroughContext>
  );
}

/** Wraps the signed-in app; does nothing until someone is signed in. */
export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session.status !== "active") return <>{children}</>;
  return (
    <WalkthroughRunner key={session.member.id} member={session.member}>
      {children}
    </WalkthroughRunner>
  );
}
