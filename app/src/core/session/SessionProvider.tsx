// File : /TeamSamsara.Workflow/app/src/core/session/SessionProvider.tsx
// Version : 1.0.0
// Latest commit: core/session
// Author : Gerrah
// Purpose : Keeps the session current for the whole app. It listens to Firebase
// Auth, then to the signed-in account's member record, and works out the state
// from both. On the way it marks invited members active and notes last activity.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useLiveSubscription, type MemberRecord } from "@/core/data";
import { auth } from "@/lib/firebase";
import {
  activateOwnMember,
  listenToOwnMember,
  touchLastActive,
} from "./memberRecordService";
import { SessionContext } from "./SessionContext";
import { deriveSessionState, type AuthUserState } from "./sessionState";

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [authUser, setAuthUser] = useState<AuthUserState>(undefined);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) =>
        setAuthUser(user ? { id: user.uid, email: user.email ?? "" } : null),
      ),
    [],
  );

  const memberId = authUser?.id ?? null;
  const member = useLiveSubscription<MemberRecord | null>(
    memberId,
    (onData, onError) => listenToOwnMember(memberId ?? "", onData, onError),
  );

  const session = useMemo(
    () => deriveSessionState(authUser, member),
    [authUser, member],
  );

  // Writes on sign-in: Invited → Active the first time, then "last active" once
  // per visit. A failed write is simply tried again on the next visit.
  const recordedFor = useRef<string | null>(null);
  useEffect(() => {
    if (session.status !== "active") return;
    const { member: record } = session;
    if (recordedFor.current === record.id) return;
    recordedFor.current = record.id;
    const write =
      record.status === "invited" ? activateOwnMember : touchLastActive;
    write(record.id).catch(() => {
      recordedFor.current = null;
    });
  }, [session]);

  return <SessionContext value={session}>{children}</SessionContext>;
}
