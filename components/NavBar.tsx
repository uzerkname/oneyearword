"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PrevNextNav from "./PrevNextNav";
import PeriodDropdown from "./PeriodDropdown";

interface NavBarProps {
  day?: number;
}

export default function NavBar({ day }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-leather-nav border-b border-leather-border px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Bible in a Year" width={80} height={80} className="rounded" />
        {day != null && <PrevNextNav day={day} />}
      </div>
      <div className="flex items-center gap-2">
        {day != null && <PeriodDropdown day={day} />}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded hover:bg-leather-border/40 transition-colors"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-leather-muted hover:text-leather-accent transition-colors">
              <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
              <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
              <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
              <div
                className="absolute right-2 top-11 w-44 rounded-lg border border-leather-border bg-leather-nav shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href="/info"
                  className="block px-4 py-3 text-sm font-sans text-leather-body hover:bg-leather-border/40 hover:text-leather-accent transition-colors rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  About
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
