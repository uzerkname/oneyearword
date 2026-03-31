"use client";

import Link from "next/link";
import { MIN_DAY, MAX_DAY } from "@/lib/constants";

interface PrevNextNavProps {
  day: number;
}

export default function PrevNextNav({ day }: PrevNextNavProps) {
  const hasPrev = day > MIN_DAY;
  const hasNext = day < MAX_DAY;

  return (
    <div className="flex items-center gap-1">
      {hasPrev ? (
        <Link
          href={`/day/${day - 1}`}
          className="text-leather-accent hover:text-leather-body transition-colors px-2 py-1 text-lg"
          aria-label={`Go to Day ${day - 1}`}
        >
          &larr;
        </Link>
      ) : (
        <span className="text-leather-muted/50 px-2 py-1 text-lg cursor-not-allowed">
          &larr;
        </span>
      )}

      <span className="text-leather-body font-bold text-base font-sans min-w-[70px] text-center">
        Day {day}
      </span>

      {hasNext ? (
        <Link
          href={`/day/${day + 1}`}
          className="text-leather-accent hover:text-leather-body transition-colors px-2 py-1 text-lg"
          aria-label={`Go to Day ${day + 1}`}
        >
          &rarr;
        </Link>
      ) : (
        <span className="text-leather-muted/50 px-2 py-1 text-lg cursor-not-allowed">
          &rarr;
        </span>
      )}
    </div>
  );
}
