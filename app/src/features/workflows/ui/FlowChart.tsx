// File : /TeamSamsara.Workflow/app/src/features/workflows/ui/FlowChart.tsx
// Version : 1.1.0
// Latest commit: feature/1.2-flow-view
// Author : Gerrah
// Purpose : A flow of steps (or an event's tasks) in time order: one column
// per due time, the event's start marked between them, and the links drawn
// over them, solid when something has to happen first, dashed when it's only
// the order, red when it's out of order. Picking a box or a link tells the
// page; dragging from a box's edge onto another links them, when the page
// allows it.

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { FlowChartText as Text } from "./workflowsContent";
import styles from "./FlowChart.module.css";

export interface FlowNode {
  id: string;
  /** Which column (due time) it sits in. */
  column: number;
  title: string;
  /** Lines under the title: group, who has it, approval. */
  meta?: readonly ReactNode[];
  /** Top right: a status chip, a flag. */
  badge?: ReactNode;
  /** Outlined in red: it has a problem. */
  problem?: boolean;
  /** Shown faded with a lock: waiting on others. */
  waiting?: boolean;
}

export interface FlowLink {
  id: string;
  from: string;
  to: string;
  /** Solid when something has to happen first, dashed when only the order. */
  kind: "hard" | "soft";
  /** Red: it comes after a box due at the same moment or later. */
  bad?: boolean;
}

interface FlowChartProps {
  label: string;
  columns: readonly string[];
  /** The event starts before this column (a divider is drawn there). */
  startsBefore: number | null;
  nodes: readonly FlowNode[];
  links: readonly FlowLink[];
  selectedId?: string | null;
  selectedLinkId?: string | null;
  onSelect?: (nodeId: string) => void;
  onSelectLink?: (linkId: string) => void;
  /** Dragging from a box's edge onto another links them (from comes first). */
  onLink?: (from: string, to: string) => void;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * A curve between two boxes: from the right edge of one to the left edge of
 * the next when it's further right; down (or up) from one to the other when
 * they share a column; otherwise out to the right and back in.
 */
function curve(from: Box, to: Box): string {
  const x1 = from.right;
  const y1 = (from.top + from.bottom) / 2;
  const x2 = to.left;
  const y2 = (to.top + to.bottom) / 2;
  if (x2 > x1 + 8) {
    const bend = Math.max(24, (x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  }
  const sameColumn = from.left < to.right && to.left < from.right;
  if (sameColumn) {
    const x =
      (Math.max(from.left, to.left) + Math.min(from.right, to.right)) / 2;
    const down = to.top >= from.bottom;
    const ya = down ? from.bottom : from.top;
    const yb = down ? to.top : to.bottom;
    return `M ${x} ${ya} L ${x} ${yb}`;
  }
  // Backwards: loop out to the right and come back in.
  const out = 28;
  const below = Math.max(from.bottom, to.bottom) + 18;
  return `M ${x1} ${y1} C ${x1 + out} ${y1}, ${x1 + out} ${below}, ${(x1 + x2) / 2} ${below} S ${x2 - out} ${y2}, ${x2} ${y2}`;
}

export function FlowChart({
  label,
  columns,
  startsBefore,
  nodes,
  links,
  selectedId = null,
  selectedLinkId = null,
  onSelect,
  onSelectLink,
  onLink,
}: FlowChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef(new Map<string, HTMLElement>());
  const [boxes, setBoxes] = useState<Map<string, Box>>(new Map());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [drag, setDrag] = useState<{
    from: string;
    x: number;
    y: number;
  } | null>(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const origin = wrap.getBoundingClientRect();
    const next = new Map<string, Box>();
    for (const [id, element] of boxRefs.current) {
      const rect = element.getBoundingClientRect();
      next.set(id, {
        left: rect.left - origin.left + wrap.scrollLeft,
        right: rect.right - origin.left + wrap.scrollLeft,
        top: rect.top - origin.top + wrap.scrollTop,
        bottom: rect.bottom - origin.top + wrap.scrollTop,
      });
    }
    setBoxes(next);
    setSize({ width: wrap.scrollWidth, height: wrap.scrollHeight });
  }, []);

  useLayoutEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    for (const element of boxRefs.current.values()) observer.observe(element);
    return () => observer.disconnect();
  }, [measure, nodes, columns]);

  const pointAt = (event: { clientX: number; clientY: number }) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const origin = wrap.getBoundingClientRect();
    return {
      x: event.clientX - origin.left + wrap.scrollLeft,
      y: event.clientY - origin.top + wrap.scrollTop,
    };
  };

  const startDrag = (nodeId: string, event: ReactPointerEvent) => {
    if (!onLink) return;
    event.preventDefault();
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    setDrag({ from: nodeId, ...pointAt(event) });
  };

  const endDrag = (event: ReactPointerEvent) => {
    if (!drag) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-flow-node]");
    const to = target?.dataset.flowNode;
    if (to && to !== drag.from) onLink?.(drag.from, to);
    setDrag(null);
  };

  const byColumn = columns.map((_, index) =>
    nodes.filter((node) => node.column === index),
  );

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="group"
      aria-label={label}
      onPointerMove={(event) =>
        drag ? setDrag({ ...drag, ...pointAt(event) }) : undefined
      }
      onPointerUp={endDrag}
      onPointerCancel={() => setDrag(null)}
    >
      <div
        className={styles.columns}
        style={{
          gridTemplateColumns: `repeat(${columns.length}, 240px)`,
        }}
      >
        {columns.map((column, index) => (
          <div
            key={`${column}-${index}`}
            className={styles.column}
            data-start={startsBefore === index ? "" : undefined}
          >
            {startsBefore === index ? (
              <span className={styles.start}>{Text.eventStarts}</span>
            ) : null}
            <span className={styles.columnLabel}>{column}</span>
            {byColumn[index].map((node) => (
              <div
                key={node.id}
                ref={(element) => {
                  if (element) boxRefs.current.set(node.id, element);
                  else boxRefs.current.delete(node.id);
                }}
                data-flow-node={node.id}
                className={styles.node}
                data-selected={node.id === selectedId ? "" : undefined}
                data-problem={node.problem ? "" : undefined}
                data-waiting={node.waiting ? "" : undefined}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-pressed={onSelect ? node.id === selectedId : undefined}
                onClick={() => onSelect?.(node.id)}
                onKeyDown={(event: KeyboardEvent) => {
                  if (
                    onSelect &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onSelect(node.id);
                  }
                }}
              >
                <span className={styles.nodeHead}>
                  <b className={styles.nodeTitle}>{node.title}</b>
                  {node.badge}
                </span>
                {(node.meta ?? []).map((line, lineIndex) => (
                  <span key={lineIndex} className={styles.nodeMeta}>
                    {line}
                  </span>
                ))}
                {onLink ? (
                  <span
                    className={styles.handle}
                    title={Text.dragToLink}
                    aria-hidden
                    onPointerDown={(event) => startDrag(node.id, event)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <svg
        className={styles.links}
        width={size.width}
        height={size.height}
        aria-hidden
      >
        <defs>
          {(["hard", "soft", "bad"] as const).map((kind) => (
            <marker
              key={kind}
              id={`flow-arrow-${kind}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                className={styles[`arrow_${kind}`]}
              />
            </marker>
          ))}
        </defs>
        {links.map((link) => {
          const from = boxes.get(link.from);
          const to = boxes.get(link.to);
          if (!from || !to) return null;
          const kind = link.bad ? "bad" : link.kind;
          const d = curve(from, to);
          return (
            <g key={link.id}>
              <path
                d={d}
                className={styles.link}
                data-kind={kind}
                data-selected={link.id === selectedLinkId ? "" : undefined}
                markerEnd={`url(#flow-arrow-${kind})`}
              />
              {onSelectLink ? (
                <path
                  d={d}
                  className={styles.hit}
                  onClick={() => onSelectLink(link.id)}
                >
                  <title>{Text.changeLink}</title>
                </path>
              ) : null}
            </g>
          );
        })}
        {drag && boxes.get(drag.from) ? (
          <line
            x1={boxes.get(drag.from)!.right}
            y1={(boxes.get(drag.from)!.top + boxes.get(drag.from)!.bottom) / 2}
            x2={drag.x}
            y2={drag.y}
            className={styles.dragLine}
          />
        ) : null}
      </svg>
    </div>
  );
}

/** The legend under a flow: the two kinds of link and, for steps, what red means. */
export function FlowLegend({
  extra,
  showBad = true,
}: {
  extra?: ReactNode;
  showBad?: boolean;
}) {
  return (
    <p className={styles.legend}>
      <span className={styles.key} data-kind="hard" aria-hidden />
      {Text.hard}
      <span className={styles.key} data-kind="soft" aria-hidden />
      {Text.soft}
      {showBad ? (
        <>
          <span className={styles.key} data-kind="bad" aria-hidden />
          {Text.bad}
        </>
      ) : null}
      {extra}
    </p>
  );
}
