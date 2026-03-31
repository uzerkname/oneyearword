import { VideoCatalog, DayVideo } from "./types";

let cached: VideoCatalog | null = null;

async function load(): Promise<VideoCatalog> {
  if (cached) return cached;
  const res = await fetch("/data/video-catalog.json");
  if (!res.ok) throw new Error("Failed to load video catalog");
  cached = await res.json();
  return cached!;
}

export async function getVideoForDay(
  day: number
): Promise<DayVideo | undefined> {
  const catalog = await load();
  for (const period of catalog.periods) {
    const video = period.days.find((d) => d.day === day);
    if (video) return video;
  }
  return undefined;
}

export async function getVideoCatalog(): Promise<VideoCatalog> {
  return load();
}
