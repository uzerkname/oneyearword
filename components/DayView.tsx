"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { DayPlan, PodcastEpisode, DiscussionData, Connection } from "@/lib/types";
import { getDayPlan } from "@/lib/reading-plan";
import { getPodcastForDay } from "@/lib/podcast-catalog";
import { getDiscussionForDay } from "@/lib/discussion-data";
import { setLastVisitedDay } from "@/lib/storage";
import NavBar from "./NavBar";
import SpotifyPlayer from "./SpotifyPlayer";
import BibleTextPanel from "./BibleTextPanel";
import DiscussionPanel from "./DiscussionPanel";
import ConnectionArcs from "./ConnectionArcs";

interface DayViewProps {
  day: number;
}

export default function DayView({ day }: DayViewProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [podcast, setPodcast] = useState<PodcastEpisode | null>(null);
  const [discussion, setDiscussion] = useState<DiscussionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeConnectionId, setActiveConnectionId] = useState<number | null>(null);
  const [currentBibleTab, setCurrentBibleTab] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const discScrollRef = useRef<HTMLDivElement>(null);
  const bibleScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastVisitedDay(day);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [plan, ep, disc] = await Promise.all([
          getDayPlan(day),
          getPodcastForDay(day),
          getDiscussionForDay(day),
        ]);
        setDayPlan(plan ?? null);
        setPodcast(ep ?? null);
        setDiscussion(disc ?? null);
      } catch {
        setError("Failed to load day data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [day]);

  const connectionVerses = useMemo(() => {
    if (!discussion) return undefined;
    const map = new Map<string, { id: number; color: Connection["color"] }>();
    for (const conn of discussion.connections) {
      const key = `${conn.bible.book}:${conn.bible.chapter}:${conn.bible.verse}`;
      map.set(key, { id: conn.id, color: conn.color });
    }
    return map;
  }, [discussion]);

  const handleConnectionClick = useCallback(
    (id: number, side: "disc" | "bible") => {
      if (!discussion || !dayPlan) return;
      const conn = discussion.connections.find((c) => c.id === id);
      if (!conn) return;

      function scrollToEl(selector: string) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("conn-pulse");
        setTimeout(() => el.classList.remove("conn-pulse"), 1200);
      }

      if (side === "disc") {
        // Clicked in discussion -> scroll Bible panel to the verse
        const targetBook = conn.bible.book;
        const tabIndex = dayPlan.readings.findIndex(
          (r) => r.book === targetBook
        );
        if (tabIndex !== -1 && tabIndex !== currentBibleTab) {
          setCurrentBibleTab(tabIndex);
          // Wait for tab switch and content to render
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollToEl(
                `[data-connection-id="${id}"][data-side="bible"]`
              );
            });
          });
        } else {
          scrollToEl(
            `[data-connection-id="${id}"][data-side="bible"]`
          );
        }
      } else {
        // Clicked in Bible -> scroll discussion panel
        scrollToEl(`[data-connection-id="${id}"][data-side="disc"]`);
      }
    },
    [discussion, dayPlan, currentBibleTab]
  );

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-leather-bg">
        <div className="bg-leather-nav border-b border-leather-border h-12 animate-pulse" />
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="lg:w-[70%] bg-leather-video animate-pulse aspect-video lg:aspect-auto" />
          <div className="lg:w-[30%] bg-leather-text p-4 space-y-2">
            {[75, 60, 85, 70, 90, 65, 80, 55, 72, 88].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-leather-border/30 rounded animate-pulse"
                style={{ width: `${w}%` }}
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

  // Three-column layout when discussion data AND dayPlan exist
  if (discussion && dayPlan) {
    return (
      <div className="h-screen flex flex-col bg-leather-bg">
        <NavBar day={day} />
        <div
          ref={mainRef}
          className="flex-1 flex flex-col lg:flex-row min-h-0 relative"
        >
          {/* Discussion Panel - 25% */}
          <div className="order-2 lg:order-1 lg:w-[25%] w-full lg:h-full border-r border-leather-border">
            <DiscussionPanel
              transcript={discussion.transcript}
              connections={discussion.connections}
              activeConnectionId={activeConnectionId}
              onConnectionHover={setActiveConnectionId}
              onConnectionClick={handleConnectionClick}
              scrollRef={discScrollRef}
            />
          </div>

          {/* Podcast Panel - 50% */}
          <div className="order-1 lg:order-2 lg:w-[50%] w-full lg:h-full">
            {podcast ? (
              <SpotifyPlayer
                episodeId={podcast.episodeId}
                title={podcast.title}
              />
            ) : (
              <div className="w-full h-full bg-leather-video flex items-center justify-center">
                <p className="text-leather-muted font-sans">
                  No podcast episode available for Day {day}
                </p>
              </div>
            )}
          </div>

          {/* Bible Text Panel - 25% */}
          <div className="order-3 lg:order-3 lg:w-[25%] w-full lg:h-full border-l border-leather-border flex-1 lg:flex-initial">
            <BibleTextPanel
              readings={dayPlan.readings}
              day={day}
              connectionVerses={connectionVerses}
              activeConnectionId={activeConnectionId}
              onConnectionHover={setActiveConnectionId}
              onConnectionClick={handleConnectionClick}
              scrollRef={bibleScrollRef}
              activeTab={currentBibleTab}
              setActiveTab={(i) => setCurrentBibleTab(i)}
              onActiveTabChange={setCurrentBibleTab}
            />
          </div>

          {/* Arc overlay */}
          <ConnectionArcs
            connections={discussion.connections}
            activeConnectionId={activeConnectionId}
            containerRef={mainRef}
            discScrollRef={discScrollRef}
            bibleScrollRef={bibleScrollRef}
          />
        </div>
      </div>
    );
  }

  // Fallback: existing 2-column layout (70/30)
  return (
    <div className="h-screen flex flex-col bg-leather-bg">
      <NavBar day={day} />
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Podcast Panel - 70% */}
        <div className="lg:w-[70%] w-full lg:h-full">
          {podcast ? (
            <SpotifyPlayer episodeId={podcast.episodeId} title={podcast.title} />
          ) : (
            <div className="w-full h-full bg-leather-video flex items-center justify-center">
              <p className="text-leather-muted font-sans">
                No podcast episode available for Day {day}
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
