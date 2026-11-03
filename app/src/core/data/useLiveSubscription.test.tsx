// File : /TeamSamsara.Workflow/app/src/core/data/useLiveSubscription.test.tsx
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Tests the live-data engine with a fake listener: loading, then ready,
// errors, starting over when the key changes (ignoring late answers for the old
// key), and stopping when the component goes.

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FirebaseError } from "firebase/app";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LiveResult } from "./liveTypes";
import { useLiveSubscription } from "./useLiveSubscription";

// Lets React run effects inside act() in this test environment.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

interface FakeSource {
  key: string;
  send: (value: string) => void;
  fail: (error: unknown) => void;
  stopped: boolean;
}

let sources: FakeSource[];
let results: LiveResult<string>[];
let container: HTMLDivElement;
let root: Root;

function Probe({ sourceKey }: { sourceKey: string | null }) {
  const result = useLiveSubscription<string>(sourceKey, (onData, onError) => {
    const source: FakeSource = {
      key: sourceKey ?? "",
      send: onData,
      fail: onError,
      stopped: false,
    };
    sources.push(source);
    return () => {
      source.stopped = true;
    };
  });
  useEffect(() => {
    results.push(result);
  });
  return null;
}

function render(sourceKey: string | null) {
  act(() => root.render(<Probe sourceKey={sourceKey} />));
}

const latest = () => results.at(-1);

beforeEach(() => {
  sources = [];
  results = [];
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
});

describe("useLiveSubscription", () => {
  it("is idle with no key and starts nothing", () => {
    render(null);
    expect(latest()?.status).toBe("idle");
    expect(sources).toHaveLength(0);
  });

  it("is loading until the first answer, then ready", () => {
    render("a");
    expect(latest()?.status).toBe("loading");
    act(() => sources[0].send("first"));
    expect(latest()).toEqual({ status: "ready", data: "first", error: null });
    act(() => sources[0].send("second"));
    expect(latest()?.data).toBe("second");
  });

  it("reports an error by kind", () => {
    render("a");
    act(() => sources[0].fail(new FirebaseError("permission-denied", "")));
    expect(latest()).toEqual({
      status: "error",
      data: undefined,
      error: "notAllowed",
    });
  });

  it("starts over on a new key and ignores late answers for the old one", () => {
    render("a");
    act(() => sources[0].send("from a"));
    render("b");
    expect(sources[0].stopped).toBe(true);
    expect(latest()?.status).toBe("loading");
    act(() => sources[0].send("late from a"));
    expect(latest()?.status).toBe("loading");
    act(() => sources[1].send("from b"));
    expect(latest()?.data).toBe("from b");
  });

  it("stops listening when the component goes", () => {
    render("a");
    act(() => root.unmount());
    expect(sources[0].stopped).toBe(true);
    root = createRoot(container);
  });
});
