"use client";

import { Verse } from "@/lib/types";

interface ChapterBlock {
  chapter: number;
  verses: Verse[];
}

interface VerseListProps {
  chapters: ChapterBlock[];
  bookName: string;
}

export default function VerseList({ chapters, bookName }: VerseListProps) {
  return (
    <div className="px-4 py-3 font-serif">
      {chapters.map((ch, idx) => (
        <div key={ch.chapter}>
          {(chapters.length > 1 || idx === 0) && (
            <h3 className="text-leather-accent font-bold text-sm font-sans mb-3 mt-2 first:mt-0 sticky top-0 bg-leather-text py-1">
              {bookName} {ch.chapter}
            </h3>
          )}
          {ch.verses.map((v) => (
            <p key={v.verse} className="text-leather-body text-sm leading-relaxed mb-1">
              <sup className="text-leather-muted font-sans text-xs mr-1 select-none">
                {v.verse}
              </sup>
              {v.text}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
