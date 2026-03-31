"use client";

import { Connection } from "@/lib/types";

interface DiscussionPanelProps {
  transcript: string;
  connections: Connection[];
  activeConnectionId: number | null;
  onConnectionHover: (id: number | null) => void;
  onConnectionClick: (id: number, side: "disc" | "bible") => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

interface Segment {
  text: string;
  connectionId?: number;
  color?: Connection["color"];
}

function buildSegments(transcript: string, connections: Connection[]): Segment[] {
  // Find each connection's first occurrence index in the transcript
  const located = connections
    .map((conn) => {
      const idx = transcript.indexOf(conn.discussion.text);
      return { conn, idx };
    })
    .filter(({ idx }) => idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { conn, idx } of located) {
    // Skip if this range was already consumed by a previous (overlapping) match
    if (idx < cursor) continue;

    // Plain text before this match
    if (idx > cursor) {
      segments.push({ text: transcript.slice(cursor, idx) });
    }

    // Highlighted segment
    segments.push({
      text: conn.discussion.text,
      connectionId: conn.id,
      color: conn.color,
    });

    cursor = idx + conn.discussion.text.length;
  }

  // Trailing plain text
  if (cursor < transcript.length) {
    segments.push({ text: transcript.slice(cursor) });
  }

  return segments;
}

export default function DiscussionPanel({
  transcript,
  connections,
  activeConnectionId,
  onConnectionHover,
  onConnectionClick,
  scrollRef,
}: DiscussionPanelProps) {
  const segments = buildSegments(transcript, connections);

  return (
    <div className="flex flex-col h-full bg-leather-text">
      {/* Header */}
      <div className="flex items-center border-b border-leather-border bg-leather-text px-4 py-2">
        <span className="text-leather-accent font-bold text-xs font-sans uppercase tracking-widest">
          Discussion
        </span>
      </div>

      {/* Scrollable transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <p className="font-serif text-sm leading-relaxed text-leather-body">
          {segments.map((seg, i) => {
            if (seg.connectionId !== undefined && seg.color !== undefined) {
              const isActive = activeConnectionId === seg.connectionId;
              return (
                <span
                  key={i}
                  className={`conn-highlight${isActive ? " conn-active" : ""}`}
                  data-color={seg.color}
                  data-connection-id={seg.connectionId}
                  data-side="disc"
                  onMouseEnter={() => onConnectionHover(seg.connectionId!)}
                  onMouseLeave={() => onConnectionHover(null)}
                  onClick={() => onConnectionClick(seg.connectionId!, "disc")}
                >
                  <span className="conn-anchor-dot" />
                  {seg.text}
                </span>
              );
            }
            return <span key={i}>{seg.text}</span>;
          })}
        </p>
      </div>
    </div>
  );
}
