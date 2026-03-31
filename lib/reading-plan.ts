import { ReadingPlan, DayPlan } from "./types";

let cached: ReadingPlan | null = null;

async function load(): Promise<ReadingPlan> {
  if (cached) return cached;
  const res = await fetch("/data/reading-plan.json");
  if (!res.ok) throw new Error("Failed to load reading plan");
  cached = await res.json();
  return cached!;
}

export async function getDayPlan(day: number): Promise<DayPlan | undefined> {
  const plan = await load();
  return plan.days.find((d) => d.day === day);
}

export async function getReadingPlan(): Promise<ReadingPlan> {
  return load();
}
