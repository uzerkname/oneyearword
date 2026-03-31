"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Connection } from "@/lib/types";

interface ConnectionArcsProps {
  connections: Connection[];
  activeConnectionId: number | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  discScrollRef: React.RefObject<HTMLDivElement | null>;
  bibleScrollRef: React.RefObject<HTMLDivElement | null>;
}

const COLOR_MAP: Record<Connection["color"], string> = {
  gold: "#d4a574",
  sage: "#7eb89e",
  rose: "#c47a8a",
  violet: "#9b8ec4",
  copper: "#c49a6c",
};

interface ArcData {
  id: number;
  d: string;
  color: string;
  visible: boolean;
  active: boolean;
}

const VISIBILITY_THRESHOLD = 20;

export default function ConnectionArcs({
  connections,
  activeConnectionId,
  containerRef,
  discScrollRef,
  bibleScrollRef,
}: ConnectionArcsProps) {
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafPending = useRef(false);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const discScroll = discScrollRef.current;
    const bibleScroll = bibleScrollRef.current;

    const newArcs: ArcData[] = [];

    for (const conn of connections) {
      const discEl = document.querySelector(
        `[data-connection-id="${conn.id}"][data-side="disc"]`
      ) as HTMLElement | null;
      const bibleEl = document.querySelector(
        `[data-connection-id="${conn.id}"][data-side="bible"]`
      ) as HTMLElement | null;

      if (!discEl || !bibleEl) continue;

      const discElRect = discEl.getBoundingClientRect();
      const bibleElRect = bibleEl.getBoundingClientRect();

      // Visibility check: each endpoint must be within its scroll container's visible bounds
      let visible = true;

      if (discScroll) {
        const scrollRect = discScroll.getBoundingClientRect();
        if (
          discElRect.top < scrollRect.top - VISIBILITY_THRESHOLD ||
          discElRect.bottom > scrollRect.bottom + VISIBILITY_THRESHOLD
        ) {
          visible = false;
        }
      }

      if (bibleScroll) {
        const scrollRect = bibleScroll.getBoundingClientRect();
        if (
          bibleElRect.top < scrollRect.top - VISIBILITY_THRESHOLD ||
          bibleElRect.bottom > scrollRect.bottom + VISIBILITY_THRESHOLD
        ) {
          visible = false;
        }
      }

      // Anchor positions relative to the container
      const x1 = discElRect.left + discElRect.width / 2 - containerRect.left;
      const y1 = discElRect.top - containerRect.top;
      const x2 = bibleElRect.left + bibleElRect.width / 2 - containerRect.left;
      const y2 = bibleElRect.top - containerRect.top;

      // Cubic bezier arc rising above the endpoints
      const cpY = Math.max(
        Math.min(y1, y2) - 40 - Math.abs(y2 - y1) * 0.3,
        -20
      );
      const d = `M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY}, ${x2} ${y2}`;

      newArcs.push({
        id: conn.id,
        d,
        color: COLOR_MAP[conn.color],
        visible,
        active: conn.id === activeConnectionId,
      });
    }

    setArcs(newArcs);
  }, [connections, activeConnectionId, containerRef, discScrollRef, bibleScrollRef]);

  const scheduleRecalc = useCallback(() => {
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      recalculate();
    });
  }, [recalculate]);

  // Set up scroll and resize listeners
  useEffect(() => {
    const discScroll = discScrollRef.current;
    const bibleScroll = bibleScrollRef.current;

    // Initial calculation
    scheduleRecalc();

    if (discScroll) {
      discScroll.addEventListener("scroll", scheduleRecalc, { passive: true });
    }
    if (bibleScroll) {
      bibleScroll.addEventListener("scroll", scheduleRecalc, { passive: true });
    }
    window.addEventListener("resize", scheduleRecalc);

    return () => {
      if (discScroll) {
        discScroll.removeEventListener("scroll", scheduleRecalc);
      }
      if (bibleScroll) {
        bibleScroll.removeEventListener("scroll", scheduleRecalc);
      }
      window.removeEventListener("resize", scheduleRecalc);
    };
  }, [scheduleRecalc, discScrollRef, bibleScrollRef]);

  // Check reduced motion preference at mount
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <svg
      className="connection-arcs-svg"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      {arcs.map((arc, index) => {
        const isActive = arc.active;
        const isVisible = arc.visible;

        let opacity: number;
        let strokeWidth: number;
        let filter: string | undefined;
        let animationClass = "arc-path";

        if (!isVisible) {
          opacity = 0;
          strokeWidth = 1.5;
        } else if (isActive) {
          opacity = 0.8;
          strokeWidth = 2.5;
          filter = `drop-shadow(0 0 4px ${arc.color})`;
        } else {
          // Inactive but visible
          strokeWidth = 1.5;
          if (reducedMotion) {
            opacity = 0.45;
          } else {
            opacity = 0.45; // base opacity; arc-breathe animates between 0.35 and 0.55
            animationClass = "arc-path arc-breathe";
          }
        }

        return (
          <path
            key={arc.id}
            className={animationClass}
            d={arc.d}
            stroke={arc.color}
            strokeWidth={strokeWidth}
            fill="none"
            style={{
              opacity,
              filter,
              animationDelay:
                !reducedMotion && isVisible && !isActive
                  ? `${index * 0.5}s`
                  : undefined,
            }}
          />
        );
      })}
    </svg>
  );
}
