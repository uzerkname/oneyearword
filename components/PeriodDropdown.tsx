"use client";

import { useRouter } from "next/navigation";
import { PERIODS, getPeriodForDay } from "@/lib/constants";

interface PeriodDropdownProps {
  day: number;
}

export default function PeriodDropdown({ day }: PeriodDropdownProps) {
  const router = useRouter();
  const currentPeriod = getPeriodForDay(day);

  return (
    <select
      value={currentPeriod?.periodIndex ?? 0}
      onChange={(e) => {
        const period = PERIODS[parseInt(e.target.value, 10)];
        if (period) router.push(`/day/${period.startDay}`);
      }}
      className="bg-leather-border/50 text-leather-accent text-xs font-sans border border-leather-border rounded px-2 py-1 outline-none cursor-pointer hover:bg-leather-border transition-colors"
    >
      {PERIODS.map((p) => (
        <option key={p.periodIndex} value={p.periodIndex}>
          {p.name} ({p.startDay}-{p.endDay})
        </option>
      ))}
    </select>
  );
}
