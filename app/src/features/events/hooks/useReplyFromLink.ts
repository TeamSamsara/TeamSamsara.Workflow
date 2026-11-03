// File : /TeamSamsara.Workflow/app/src/features/events/hooks/useReplyFromLink.ts
// Version : 1.0.0
// Latest commit: feature/branded-emails
// Author : Gerrah
// Purpose : The "asked to reply" email has Going / Maybe / Can't go buttons
// that open the event with ?reply=<answer>. This saves that answer once (any
// note already given is kept), says so, and takes it out of the address.

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/shared/components/Toast/useToast";
import { isAsked } from "../model/attendance";
import { saveReply } from "../service/replyService";
import { ReplyAnswers, type ReplyAnswer } from "../types/attendance";
import type { EventRecord } from "../types/eventTypes";
import { answerLabels, ReplyText } from "../ui/attendanceContent";

const replyParameter = "reply";

export function useReplyFromLink(
  event: EventRecord,
  member: { id: string; workGroupIds: readonly string[] } | null,
): void {
  const [search, setSearch] = useSearchParams();
  const toast = useToast();
  const done = useRef(false);
  const asked = search.get(replyParameter);

  useEffect(() => {
    if (!asked || !member || done.current) return;
    done.current = true;
    const answer = ReplyAnswers.find((entry) => entry === asked) as
      ReplyAnswer | undefined;
    const next = new URLSearchParams(search);
    next.delete(replyParameter);
    setSearch(next, { replace: true });
    if (!answer) return;
    if (!isAsked(event, member)) {
      toast.show({ tone: "info", title: ReplyText.notAsked });
      return;
    }
    saveReply(event.id, member.id, answer, event.replies[member.id]?.note ?? "")
      .then(() =>
        toast.show({
          tone: "success",
          title: ReplyText.fromEmail(answerLabels[answer]),
          detail: ReplyText.fromEmailDetail,
        }),
      )
      .catch(() => toast.show({ tone: "error", title: ReplyText.failed }));
  }, [asked, member, event, search, setSearch, toast]);
}
