"use client";

import PrevNextNav from "./PrevNextNav";
import PeriodDropdown from "./PeriodDropdown";
import DayJumpInput from "./DayJumpInput";

interface NavBarProps {
  day: number;
}

export default function NavBar({ day }: NavBarProps) {
  return (
    <nav className="bg-leather-nav border-b border-leather-border px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
      <PrevNextNav day={day} />
      <div className="flex items-center gap-2 flex-wrap">
        <PeriodDropdown day={day} />
        <DayJumpInput />
      </div>
    </nav>
  );
}
