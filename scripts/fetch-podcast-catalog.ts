import { writeFileSync } from "fs";
import { resolve } from "path";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SHOW_ID = "4Pppt42NPK2XzKwNIoW7BR";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars.");
  console.error("Usage: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx npx tsx scripts/fetch-podcast-catalog.ts");
  process.exit(1);
}

interface SpotifyEpisode {
  id: string;
  name: string;
  release_date: string;
  duration_ms: number;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchAllEpisodes(token: string): Promise<SpotifyEpisode[]> {
  const episodes: SpotifyEpisode[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    console.log(`  Fetching episodes offset=${offset}...`);
    const res = await fetch(
      `https://api.spotify.com/v1/shows/${SHOW_ID}/episodes?limit=${limit}&offset=${offset}&market=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    episodes.push(...data.items);

    if (data.next === null || data.items.length < limit) break;
    offset += limit;
  }

  return episodes;
}

function parseDayNumber(title: string): number | null {
  const match = title.match(/Day\s+0*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

async function main() {
  console.log("Authenticating with Spotify...");
  const token = await getAccessToken();
  console.log("Authenticated!\n");

  console.log("Fetching all episodes...");
  const allEpisodes = await fetchAllEpisodes(token);
  console.log(`Total episodes fetched: ${allEpisodes.length}\n`);

  // Sort by release date descending (newest first) so we pick the most recent year's episodes
  allEpisodes.sort(
    (a, b) =>
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  );

  // Map day numbers, taking the first (most recent) match for each day
  const dayMap = new Map<number, { episodeId: string; title: string }>();
  const skipped: string[] = [];

  for (const ep of allEpisodes) {
    const day = parseDayNumber(ep.name);
    if (day === null) {
      skipped.push(ep.name);
      continue;
    }
    if (day < 1 || day > 365) continue;

    // Only take the first (most recent) episode for each day number
    if (!dayMap.has(day)) {
      dayMap.set(day, { episodeId: ep.id, title: ep.name });
    }
  }

  // Build catalog
  const episodes = Array.from(dayMap.entries())
    .map(([day, { episodeId, title }]) => ({ day, episodeId, title }))
    .sort((a, b) => a.day - b.day);

  const catalog = {
    showId: SHOW_ID,
    episodes,
  };

  // Write output
  const outPath = resolve(__dirname, "../public/data/podcast-catalog.json");
  writeFileSync(outPath, JSON.stringify(catalog, null, 2));

  // Summary
  console.log("=== Summary ===");
  console.log(`Episodes mapped to days: ${episodes.length}`);

  const missing: number[] = [];
  for (let i = 1; i <= 365; i++) {
    if (!dayMap.has(i)) missing.push(i);
  }

  if (missing.length > 0) {
    console.log(`Missing days (${missing.length}): ${missing.join(", ")}`);
  } else {
    console.log("All 365 days accounted for!");
  }

  console.log(`Skipped non-day episodes: ${skipped.length}`);
  if (skipped.length > 0 && skipped.length <= 20) {
    skipped.forEach((t) => console.log(`  - ${t}`));
  }

  console.log(`\nWritten to: ${outPath}`);
}

main().catch(console.error);
