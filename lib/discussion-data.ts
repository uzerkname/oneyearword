import { DiscussionData } from "./types";

const cache = new Map<number, DiscussionData | null>();

export async function getDiscussionForDay(
  day: number
): Promise<DiscussionData | null> {
  if (cache.has(day)) return cache.get(day)!;

  try {
    const res = await fetch(`/data/discussions/day-${day}.json`);
    if (!res.ok) {
      cache.set(day, null);
      return null;
    }
    const data: DiscussionData = await res.json();
    cache.set(day, data);
    return data;
  } catch {
    cache.set(day, null);
    return null;
  }
}
