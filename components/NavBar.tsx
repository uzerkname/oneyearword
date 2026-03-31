"use client";

import PrevNextNav from "./PrevNextNav";
import PeriodDropdown from "./PeriodDropdown";

interface NavBarProps {
  day: number;
}

export default function NavBar({ day }: NavBarProps) {
  return (
    <nav className="bg-leather-nav border-b border-leather-border px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
      <PrevNextNav day={day} />
      <PeriodDropdown day={day} />
    </nav>
  );
}
