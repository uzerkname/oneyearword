"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MIN_DAY, MAX_DAY } from "@/lib/constants";

export default function DayJumpInput() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const day = parseInt(value, 10);
    if (day >= MIN_DAY && day <= MAX_DAY) {
      router.push(`/day/${day}`);
      setValue("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        type="number"
        min={MIN_DAY}
        max={MAX_DAY}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Day #"
        className="bg-leather-border/50 text-leather-body text-xs font-sans border border-leather-border rounded px-2 py-1 w-16 outline-none placeholder:text-leather-muted/50 focus:border-leather-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="submit"
        className="bg-leather-accent/20 text-leather-accent text-xs font-sans border border-leather-accent/40 rounded px-2 py-1 hover:bg-leather-accent/30 transition-colors"
      >
        Go
      </button>
    </form>
  );
}
