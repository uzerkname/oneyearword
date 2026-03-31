import { PodcastCatalog, PodcastEpisode } from "./types";

let cached: PodcastCatalog | null = null;

async function load(): Promise<PodcastCatalog> {
  if (cached) return cached;
  const res = await fetch("/data/podcast-catalog.json");
  if (!res.ok) throw new Error("Failed to load podcast catalog");
  cached = await res.json();
  return cached!;
}

export async function getPodcastForDay(
  day: number
): Promise<PodcastEpisode | undefined> {
  const catalog = await load();
  return catalog.episodes.find((e) => e.day === day);
}

export async function getPodcastCatalog(): Promise<PodcastCatalog> {
  return load();
}
