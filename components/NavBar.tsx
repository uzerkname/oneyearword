"use client";

import Image from "next/image";
import PrevNextNav from "./PrevNextNav";
import PeriodDropdown from "./PeriodDropdown";

interface NavBarProps {
  day: number;
}

export default function NavBar({ day }: NavBarProps) {
  return (
    <nav className="bg-leather-nav border-b border-leather-border px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Bible in a Year" width={80} height={80} className="rounded" />
        <PrevNextNav day={day} />
      </div>
      <PeriodDropdown day={day} />
    </nav>
  );
}
