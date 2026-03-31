"use client";

import { useEffect, useState } from "react";
import { DayPlan, DayVideo } from "@/lib/types";
import { getDayPlan } from "@/lib/reading-plan";
import { getVideoForDay } from "@/lib/video-catalog";
import { setLastVisitedDay } from "@/lib/storage";
import NavBar from "./NavBar";
import YouTubePlayer from "./YouTubePlayer";
import BibleTextPanel from "./BibleTextPanel";

interface DayViewProps {
  day: number;
}

export default function DayView({ day }: DayViewProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [video, setVideo] = useState<DayVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedDay(day);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [plan, vid] = await Promise.all([
          getDayPlan(day),
          getVideoForDay(day),
        ]);
        setDayPlan(plan ?? null);
        setVideo(vid ?? null);
      } catch {
        setError("Failed to load day data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [day]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-leather-bg">
        <div className="bg-leather-nav border-b border-leather-border h-12 animate-pulse" />
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="lg:w-[70%] bg-leather-video animate-pulse aspect-video lg:aspect-auto" />
          <div className="lg:w-[30%] bg-leather-text p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-leather-border/30 rounded animate-pulse"
                style={{ width: `${50 + Math.random() * 45}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-leather-bg">
        <div className="text-center">
          <p className="text-leather-muted text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-leather-accent text-leather-bg px-4 py-2 rounded font-sans"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-leather-bg">
      <NavBar day={day} />
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Video Panel - 70% */}
        <div className="lg:w-[70%] w-full lg:h-full">
          {video ? (
            <YouTubePlayer videoId={video.videoId} />
          ) : (
            <div className="w-full h-full bg-leather-video flex items-center justify-center">
              <p className="text-leather-muted font-sans">
                No video available for Day {day}
              </p>
            </div>
          )}
        </div>

        {/* Bible Text Panel - 30% */}
        <div className="lg:w-[30%] w-full lg:h-full border-l border-leather-border flex-1 lg:flex-initial">
          {dayPlan ? (
            <BibleTextPanel readings={dayPlan.readings} day={day} />
          ) : (
            <div className="h-full flex items-center justify-center bg-leather-text">
              <p className="text-leather-muted font-sans">
                No reading plan for Day {day}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
