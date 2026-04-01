"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Verse, Connection } from "@/lib/types";

interface ChapterBlock {
  chapter: number;
  verses: Verse[];
}

interface VerseListProps {
  chapters: ChapterBlock[];
  bookName: string;
  highlightJesus?: boolean;
  onHasRedLetters?: (has: boolean) => void;
  connectionVerses?: Map<string, { id: number; color: Connection['color'] }>;
  activeConnectionId?: number | null;
  onConnectionHover?: (id: number | null) => void;
  onConnectionClick?: (id: number, side: 'disc' | 'bible') => void;
}

interface RedLetterData {
  [book: string]: { [chapter: string]: number[] };
}

let cachedRedLetters: RedLetterData | null = null;

async function loadRedLetters(): Promise<RedLetterData> {
  if (cachedRedLetters) return cachedRedLetters;
  const res = await fetch("/data/red-letters.json");
  if (!res.ok) return {};
  cachedRedLetters = await res.json();
  return cachedRedLetters!;
}

function isRedLetter(
  redLetters: RedLetterData,
  book: string,
  chapter: number,
  verse: number
): boolean {
  const bookData = redLetters[book];
  if (!bookData) return false;
  const verses = bookData[String(chapter)];
  if (!verses) return false;
  return verses.includes(verse);
}

// --- Seeded pseudo-random for deterministic particle/ray layout ---
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// --- Generate divine effect elements for a jesus group ---
function generateDivineEffects(groupKey: string) {
  // Seed from the group key for deterministic layout
  let seed = 0;
  for (let i = 0; i < groupKey.length; i++) {
    seed = ((seed << 5) - seed + groupKey.charCodeAt(i)) | 0;
  }
  const rand = seededRandom(Math.abs(seed) + 1);

  const elements: React.ReactNode[] = [];

  // Ambient glow
  elements.push(
    <div key={`${groupKey}-ambient`} className="divine-ambient" aria-hidden="true" />
  );

  // Vignette
  elements.push(
    <div key={`${groupKey}-vignette`} className="divine-vignette" aria-hidden="true" />
  );

  // Light rays: 18 rays fanning from center-top
  const rayCount = 18;
  for (let i = 0; i < rayCount; i++) {
    const angle = -40 + (80 * i) / (rayCount - 1) + (rand() - 0.5) * 6;
    const width = 1 + rand() * 5;
    const blur = 6 + rand() * 14;
    const opacity = 0.04 + rand() * 0.10;
    const delay = rand() * 2;
    const height = 60 + rand() * 50;

    elements.push(
      <div
        key={`${groupKey}-ray-${i}`}
        className="divine-ray"
        aria-hidden="true"
        style={{
          "--ray-angle": `${angle}deg`,
          "--ray-width": `${width}px`,
          "--ray-blur": `${blur}px`,
          "--ray-opacity": opacity,
          "--ray-delay": `${delay}s`,
          "--ray-height": `${height}px`,
        } as React.CSSProperties}
      />
    );
  }

  // Floating particles: 50
  const particleCount = 50;
  for (let i = 0; i < particleCount; i++) {
    const left = rand() * 100;
    const top = rand() * 100;
    const size = 2 + rand() * 5;
    const driftX = (rand() - 0.5) * 40;
    const driftY = -(10 + rand() * 40);
    const duration = 6 + rand() * 10;
    const delay = rand() * duration;
    const maxOpacity = 0.15 + rand() * 0.30;

    elements.push(
      <div
        key={`${groupKey}-particle-${i}`}
        className="divine-particle"
        aria-hidden="true"
        style={{
          "--p-left": `${left}%`,
          "--p-top": `${top}%`,
          "--p-size": `${size}px`,
          "--drift-x": `${driftX}px`,
          "--drift-y": `${driftY}px`,
          "--p-duration": `${duration}s`,
          "--p-delay": `${delay}s`,
          "--p-max-opacity": maxOpacity,
        } as React.CSSProperties}
      />
    );
  }

  // Sparkle dots: 30
  const sparkleCount = 30;
  for (let i = 0; i < sparkleCount; i++) {
    const left = 5 + rand() * 90;
    const top = 5 + rand() * 90;
    const size = 1 + rand() * 2.5;
    const duration = 2 + rand() * 4;
    const delay = rand() * duration;
    const maxOpacity = 0.3 + rand() * 0.5;

    elements.push(
      <div
        key={`${groupKey}-sparkle-${i}`}
        className="divine-sparkle"
        aria-hidden="true"
        style={{
          "--s-left": `${left}%`,
          "--s-top": `${top}%`,
          "--s-size": `${size}px`,
          "--s-duration": `${duration}s`,
          "--s-delay": `${delay}s`,
          "--s-max-opacity": maxOpacity,
        } as React.CSSProperties}
      />
    );
  }

  return elements;
}

interface ConnectionContext {
  connectionVerses?: Map<string, { id: number; color: Connection['color'] }>;
  bookName: string;
  chapter: number;
  activeConnectionId?: number | null;
  onConnectionHover?: (id: number | null) => void;
  onConnectionClick?: (id: number, side: 'disc' | 'bible') => void;
}

function renderVerse(v: Verse, isJesus: boolean, connCtx?: ConnectionContext) {
  const connKey = connCtx ? `${connCtx.bookName}:${connCtx.chapter}:${v.verse}` : null;
  const conn = connKey && connCtx?.connectionVerses ? connCtx.connectionVerses.get(connKey) : null;

  const textContent = conn && connCtx ? (
    <span
      className={`conn-highlight${connCtx.activeConnectionId === conn.id ? " conn-active" : ""}`}
      data-color={conn.color}
      data-connection-id={conn.id}
      data-side="bible"
      onMouseEnter={() => connCtx.onConnectionHover?.(conn.id)}
      onMouseLeave={() => connCtx.onConnectionHover?.(null)}
      onClick={() => connCtx.onConnectionClick?.(conn.id, 'bible')}
    >
      {v.text}
    </span>
  ) : v.text;

  return (
    <p
      key={v.verse}
      className={`text-sm leading-relaxed mb-1 ${
        isJesus ? "verse-jesus" : "text-leather-body"
      }`}
    >
      <sup className={`font-sans text-xs mr-1 select-none ${isJesus ? "" : "text-leather-muted"}`}>
        {v.verse}
      </sup>
      {textContent}
    </p>
  );
}

function groupVerses(
  verses: Verse[],
  redLetters: RedLetterData,
  bookName: string,
  chapter: number,
  highlightJesus: boolean,
  connCtx?: ConnectionContext
) {
  const elements: React.ReactNode[] = [];
  let jesusRun: Verse[] = [];

  function flushRun() {
    if (jesusRun.length === 0) return;
    if (highlightJesus) {
      const groupKey = `jesus-${chapter}-${jesusRun[0].verse}`;
      elements.push(
        <DivineGroup key={groupKey} groupKey={groupKey}>
          {jesusRun.map((v) => renderVerse(v, true, connCtx))}
        </DivineGroup>
      );
    } else {
      jesusRun.forEach((v) => elements.push(renderVerse(v, false, connCtx)));
    }
    jesusRun = [];
  }

  for (const v of verses) {
    const isJesus = isRedLetter(redLetters, bookName, chapter, v.verse);
    if (isJesus) {
      jesusRun.push(v);
    } else {
      flushRun();
      elements.push(renderVerse(v, false, connCtx));
    }
  }
  flushRun();
  return elements;
}

// --- Divine group component with IntersectionObserver for perf ---
function DivineGroup({
  groupKey,
  children,
}: {
  groupKey: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        setVisible(entry.isIntersecting);
      }
    },
    []
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "100px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  return (
    <div
      ref={ref}
      className="verse-jesus-group"
      style={{
        animationPlayState: visible ? "running" : "paused",
      }}
    >
      {children}
      {visible && generateDivineEffects(groupKey)}
    </div>
  );
}

export default function VerseList({
  chapters,
  bookName,
  highlightJesus = true,
  onHasRedLetters,
  connectionVerses,
  activeConnectionId,
  onConnectionHover,
  onConnectionClick,
}: VerseListProps) {
  const [redLetters, setRedLetters] = useState<RedLetterData>({});

  useEffect(() => {
    loadRedLetters().then(setRedLetters);
  }, []);

  // Detect whether current chapters contain any red-letter verses
  useEffect(() => {
    if (!onHasRedLetters || Object.keys(redLetters).length === 0) return;
    const found = chapters.some((ch) =>
      ch.verses.some((v) => isRedLetter(redLetters, bookName, ch.chapter, v.verse))
    );
    onHasRedLetters(found);
  }, [redLetters, chapters, bookName, onHasRedLetters]);

  return (
    <div className="px-4 py-3 font-serif">
      {chapters.map((ch, idx) => {
        const connCtx: ConnectionContext | undefined =
          connectionVerses
            ? {
                connectionVerses,
                bookName,
                chapter: ch.chapter,
                activeConnectionId,
                onConnectionHover,
                onConnectionClick,
              }
            : undefined;
        return (
          <div key={ch.chapter}>
            {(chapters.length > 1 || idx === 0) && (
              <h3 className="text-leather-accent font-bold text-sm font-sans mb-3 mt-2 first:mt-0 sticky top-0 bg-leather-text py-1">
                {bookName} {ch.chapter}
              </h3>
            )}
            {groupVerses(ch.verses, redLetters, bookName, ch.chapter, highlightJesus, connCtx)}
          </div>
        );
      })}
    </div>
  );
}
