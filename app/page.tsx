"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLastVisitedDay } from "@/lib/storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const day = getLastVisitedDay();
    router.replace(`/day/${day}`);
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-leather-bg">
      <div className="text-leather-muted font-sans animate-pulse">
        Loading...
      </div>
    </div>
  );
}
