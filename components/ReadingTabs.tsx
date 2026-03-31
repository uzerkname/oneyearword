"use client";

import { Reading } from "@/lib/types";
import { readingLabel } from "@/lib/book-names";

interface ReadingTabsProps {
  readings: Reading[];
  activeIndex: number;
  onTabChange: (index: number) => void;
}

export default function ReadingTabs({
  readings,
  activeIndex,
  onTabChange,
}: ReadingTabsProps) {
  return (
    <div className="flex overflow-x-auto bg-leather-text scrollbar-none">
      {readings.map((reading, i) => (
        <button
          key={i}
          onClick={() => onTabChange(i)}
          className={`px-3 py-2 text-sm font-sans whitespace-nowrap transition-colors flex-shrink-0 ${
            i === activeIndex
              ? "text-leather-accent border-b-2 border-leather-accent font-semibold"
              : "text-leather-muted hover:text-leather-body"
          }`}
        >
          {readingLabel(reading)}
        </button>
      ))}
    </div>
  );
}
