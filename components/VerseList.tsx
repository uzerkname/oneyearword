"use client";

import { useEffect, useState } from "react";
import { Verse } from "@/lib/types";

interface ChapterBlock {
  chapter: number;
  verses: Verse[];
}

interface VerseListProps {
  chapters: ChapterBlock[];
  bookName: string;
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

export default function VerseList({ chapters, bookName }: VerseListProps) {
  const [redLetters, setRedLetters] = useState<RedLetterData>({});

  useEffect(() => {
    loadRedLetters().then(setRedLetters);
  }, []);

  return (
    <div className="px-4 py-3 font-serif">
      {chapters.map((ch, idx) => (
        <div key={ch.chapter}>
          {(chapters.length > 1 || idx === 0) && (
            <h3 className="text-leather-accent font-bold text-sm font-sans mb-3 mt-2 first:mt-0 sticky top-0 bg-leather-text py-1">
              {bookName} {ch.chapter}
            </h3>
          )}
          {ch.verses.map((v) => {
            const isJesus = isRedLetter(redLetters, bookName, ch.chapter, v.verse);
            return (
              <p
                key={v.verse}
                className={`text-sm leading-relaxed mb-1 ${
                  isJesus ? "verse-jesus" : "text-leather-body"
                }`}
              >
                <sup className="text-leather-muted font-sans text-xs mr-1 select-none">
                  {v.verse}
                </sup>
                {v.text}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}
