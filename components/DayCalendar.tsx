"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PERIODS } from "@/lib/constants";

interface DayCalendarProps {
  day: number;
  onClose: () => void;
}

export default function DayCalendar({ day, onClose }: DayCalendarProps) {
  const router = useRouter();
  const activeSectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  useEffect(() => {
    if (activeSectionRef.current && panelRef.current) {
      const section = activeSectionRef.current;
      const panel = panelRef.current;
      const sectionTop = section.offsetTop - panel.offsetTop;
      panel.scrollTo({ top: sectionTop - 12, behavior: "instant" });
    }
  }, []);

  function handleDayClick(d: number) {
    router.push(`/day/${d}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={panelRef}
        className="absolute right-2 top-11 w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-leather-border bg-leather-nav shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 space-y-4">
          {PERIODS.map((period) => {
            const days = Array.from(
              { length: period.endDay - period.startDay + 1 },
              (_, i) => period.startDay + i
            );
            const isActivePeriod =
              day >= period.startDay && day <= period.endDay;

            return (
              <div
                key={period.periodIndex}
                ref={isActivePeriod ? activeSectionRef : undefined}
              >
                <div className="mb-1.5">
                  <span className="text-leather-accent font-sans font-semibold text-xs">
                    {period.name}
                  </span>
                  <span className="text-leather-muted text-[10px] font-sans ml-1.5">
                    {period.startDay}&ndash;{period.endDay}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((d) => {
                    const isCurrent = d === day;
                    return (
                      <button
                        key={d}
                        onClick={() => handleDayClick(d)}
                        className={`w-full aspect-square rounded text-[10px] font-sans transition-colors ${
                          isCurrent
                            ? "bg-leather-accent text-leather-bg font-bold"
                            : "bg-leather-border/30 text-leather-body hover:bg-leather-border/60"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
