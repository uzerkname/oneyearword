"use client";

import { useState, useEffect, type RefObject } from "react";
import { Connection } from "@/lib/types";

interface DiscussionPanelProps {
  transcript: string;
  connections: Connection[];
  activeConnectionId: number | null;
  onConnectionHover: (id: number | null) => void;
  onConnectionClick: (id: number, side: "disc" | "bible") => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}

interface Segment {
  text: string;
  connectionId?: number;
  color?: Connection["color"];
  bibleRef?: string;
}

// Short book abbreviations — first-3-char fallback covers most names
const BOOK_ABBREV: Record<string, string> = {
  Genesis: "Gen",
  Exodus: "Ex",
  Leviticus: "Lev",
  Numbers: "Num",
  Deuteronomy: "Dt",
  Joshua: "Jos",
  Judges: "Jdg",
  Ruth: "Ru",
  "1 Samuel": "1Sam",
  "2 Samuel": "2Sam",
  "1 Kings": "1Kgs",
  "2 Kings": "2Kgs",
  "1 Chronicles": "1Chr",
  "2 Chronicles": "2Chr",
  Ezra: "Ezra",
  Nehemiah: "Neh",
  Tobit: "Tob",
  Judith: "Jdt",
  Esther: "Est",
  "1 Maccabees": "1Mac",
  "2 Maccabees": "2Mac",
  Job: "Job",
  Psalms: "Ps",
  Psalm: "Ps",
  Proverbs: "Prov",
  Ecclesiastes: "Eccl",
  "Song of Songs": "Song",
  "Song of Solomon": "Song",
  Wisdom: "Wis",
  Sirach: "Sir",
  Isaiah: "Is",
  Jeremiah: "Jer",
  Lamentations: "Lam",
  Baruch: "Bar",
  Ezekiel: "Ezek",
  Daniel: "Dan",
  Hosea: "Hos",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Ob",
  Jonah: "Jon",
  Micah: "Mic",
  Nahum: "Nah",
  Habakkuk: "Hab",
  Zephaniah: "Zeph",
  Haggai: "Hag",
  Zechariah: "Zech",
  Malachi: "Mal",
  Matthew: "Mt",
  Mark: "Mk",
  Luke: "Lk",
  John: "Jn",
  Acts: "Acts",
  Romans: "Rom",
  "1 Corinthians": "1Cor",
  "2 Corinthians": "2Cor",
  Galatians: "Gal",
  Ephesians: "Eph",
  Philippians: "Phil",
  Colossians: "Col",
  "1 Thessalonians": "1Thes",
  "2 Thessalonians": "2Thes",
  "1 Timothy": "1Tim",
  "2 Timothy": "2Tim",
  Titus: "Tit",
  Philemon: "Phm",
  Hebrews: "Heb",
  James: "Jas",
  "1 Peter": "1Pet",
  "2 Peter": "2Pet",
  "1 John": "1Jn",
  "2 John": "2Jn",
  "3 John": "3Jn",
  Jude: "Jude",
  Revelation: "Rev",
};

function getAbbrev(book: string): string {
  return BOOK_ABBREV[book] ?? book.slice(0, 3);
}

const COLOR_PILL: Record<Connection["color"], string> = {
  gold: "#d4a574",
  sage: "#7eb89e",
  rose: "#c47a8a",
  violet: "#9b8ec4",
  copper: "#c49a6c",
};

function buildSegments(
  transcript: string,
  connections: Connection[]
): Segment[] {
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
    if (idx < cursor) continue;

    if (idx > cursor) {
      segments.push({ text: transcript.slice(cursor, idx) });
    }

    const abbrev = getAbbrev(conn.bible.book);
    segments.push({
      text: conn.discussion.text,
      connectionId: conn.id,
      color: conn.color,
      bibleRef: `${abbrev} ${conn.bible.chapter}:${conn.bible.verse}`,
    });

    cursor = idx + conn.discussion.text.length;
  }

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <div className="flex flex-col h-full bg-leather-text">
      {/* Header — clickable toggle on mobile */}
      <div
        className={`flex items-center justify-between border-b border-leather-border bg-leather-text px-4 py-2${isMobile ? " cursor-pointer select-none" : ""}`}
        onClick={isMobile ? () => setIsExpanded((v) => !v) : undefined}
      >
        <span className="text-leather-accent font-bold text-xs font-sans uppercase tracking-widest">
          Discussion
        </span>
        {isMobile && (
          <span className="text-leather-accent text-sm leading-none">
            {isExpanded ? "▼" : "▸"}
          </span>
        )}
      </div>

      {/* Scrollable transcript — always visible on desktop, collapsible on mobile */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 transition-all duration-300"
        style={
          isMobile
            ? {
                maxHeight: isExpanded ? "2000px" : "0px",
                overflow: "hidden",
                padding: isExpanded ? undefined : "0",
              }
            : undefined
        }
      >
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
                  {/* Mobile inline badge */}
                  {isMobile && seg.bibleRef && (
                    <span
                      className="lg:hidden inline-block ml-1 px-1.5 py-0.5 rounded-full text-white font-sans"
                      style={{
                        fontSize: "0.65rem",
                        lineHeight: "1",
                        backgroundColor: COLOR_PILL[seg.color!],
                        verticalAlign: "middle",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onConnectionClick(seg.connectionId!, "disc");
                      }}
                    >
                      {seg.bibleRef}
                    </span>
                  )}
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
