"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Reading, Verse } from "@/lib/types";
import { getBookData, getChapterVerses } from "@/lib/bible-text";
import ReadingTabs from "./ReadingTabs";
import VerseList from "./VerseList";

interface BibleTextPanelProps {
  readings: Reading[];
  day: number;
}

interface ChapterBlock {
  chapter: number;
  verses: Verse[];
}

export default function BibleTextPanel({ readings, day }: BibleTextPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [chapters, setChapters] = useState<ChapterBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlightJesus, setHighlightJesus] = useState(true);
  const [hasRedLetters, setHasRedLetters] = useState(false);

  const onHasRedLetters = useCallback((has: boolean) => {
    setHasRedLetters(has);
  }, []);

  // Reset active tab when day changes
  useEffect(() => {
    setActiveIndex(0);
  }, [day]);

  const loadReading = useCallback(async (reading: Reading) => {
    setLoading(true);
    setError(null);

    try {
      const book = await getBookData(reading.book);
      if (!book) {
        setError(`Could not load ${reading.book}`);
        setChapters([]);
        return;
      }

      const blocks: ChapterBlock[] = [];
      for (const ch of reading.chapters) {
        const verses = getChapterVerses(book, ch);
        if (verses) {
          blocks.push({ chapter: ch, verses });
        }
      }

      if (blocks.length === 0) {
        setError(`No verses found for ${reading.book} ${reading.chapters.join(", ")}`);
      }

      setChapters(blocks);
    } catch {
      setError("Failed to load Bible text");
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (readings[activeIndex]) {
      loadReading(readings[activeIndex]);
    }
  }, [activeIndex, readings, loadReading]);

  // Scroll to top when tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [activeIndex, chapters]);

  const activeReading = readings[activeIndex];

  return (
    <div className="flex flex-col h-full bg-leather-text">
      <div className="flex items-center border-b border-leather-border bg-leather-text">
        <ReadingTabs
          readings={readings}
          activeIndex={activeIndex}
          onTabChange={setActiveIndex}
        />
        {hasRedLetters && (
          <button
            onClick={() => setHighlightJesus((p) => !p)}
            className="ml-auto flex-shrink-0 px-3 py-2 flex items-center gap-1.5 text-xs font-sans transition-colors"
            title={highlightJesus ? "Hide Jesus' words highlighting" : "Highlight Jesus' words"}
          >
            <span
              className={`inline-block w-7 h-4 rounded-full relative transition-colors duration-200 ${
                highlightJesus ? "bg-amber-600/80" : "bg-leather-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                  highlightJesus ? "translate-x-3" : "translate-x-0"
                }`}
              />
            </span>
            <span className={highlightJesus ? "text-amber-500/90" : "text-leather-muted"}>
              Highlight Jesus&apos; words
            </span>
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 space-y-2">
            {[75, 60, 85, 70, 90, 65, 80, 55].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-leather-border/30 rounded animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}
        {error && (
          <div className="p-4 text-leather-muted text-sm">{error}</div>
        )}
        {!loading && !error && activeReading && (
          <VerseList
            chapters={chapters}
            bookName={activeReading.book}
            highlightJesus={highlightJesus}
            onHasRedLetters={onHasRedLetters}
          />
        )}
      </div>
    </div>
  );
}
