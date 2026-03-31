import { writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

interface PeriodConfig {
  name: string;
  periodIndex: number;
  playlistId: string;
}

const PERIODS: PeriodConfig[] = [
  { name: "Early World", periodIndex: 0, playlistId: "PL0QzUlsjD3k3RQG9IqnQm2lL9BC4J859k" },
  { name: "Patriarchs", periodIndex: 1, playlistId: "PL0QzUlsjD3k0FGQKAKHkgvKhQYw-vDKtr" },
  { name: "Egypt and Exodus", periodIndex: 2, playlistId: "PL0QzUlsjD3k2bI9HhmVEz8k4G2KSCq3d9" },
  { name: "Desert Wanderings", periodIndex: 3, playlistId: "PL0QzUlsjD3k1lJqkMKOBmYD3TAwJ28FT-" },
  { name: "Conquest and Judges", periodIndex: 4, playlistId: "PL0QzUlsjD3k1Pb7S8s6H4DkATBek-Em2g" },
  { name: "Messianic Checkpoint — John", periodIndex: 5, playlistId: "PL0QzUlsjD3k3Ia2NLkKHjUPXhx8PixJ2T" },
  { name: "Royal Kingdom", periodIndex: 6, playlistId: "PL0QzUlsjD3k34WN4Jypigb9rhP78Z0yKG" },
  { name: "Messianic Checkpoint — Mark", periodIndex: 7, playlistId: "PL0QzUlsjD3k1ah_aTj2AgWBGUWrHSYMNk" },
  { name: "Divided Kingdom", periodIndex: 8, playlistId: "PL0QzUlsjD3k2VUhmfdISIKDmdvDfEKs-1" },
  { name: "Exile", periodIndex: 9, playlistId: "PL0QzUlsjD3k2n6-dEeafHLfRxzdUh4LG-" },
  { name: "Messianic Checkpoint — Matthew", periodIndex: 10, playlistId: "PL0QzUlsjD3k31tFaKokDhTWlrcJd1fGXu" },
  { name: "Return", periodIndex: 11, playlistId: "PL0QzUlsjD3k0ZcAJTyelxDrdiq_aYs0TV" },
  { name: "Maccabean Revolt", periodIndex: 12, playlistId: "PL0QzUlsjD3k3GoB3WSZbo6EC2fPimveCD" },
  { name: "Messianic Fulfillment — Luke", periodIndex: 13, playlistId: "PL0QzUlsjD3k23YSnSJFpkOuV20_616mVc" },
  { name: "The Church", periodIndex: 14, playlistId: "PL0QzUlsjD3k0apt5Zy0HfPUWfWdrCaD-u" },
];

function fetchPlaylist(playlistId: string): { id: string; title: string }[] {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  try {
    const output = execSync(
      `py -m yt_dlp --flat-playlist --print "%(id)s\t%(title)s" "${url}"`,
      { encoding: "utf-8", timeout: 120000 }
    );
    return output
      .trim()
      .split("\n")
      .filter((line) => line.includes("\t"))
      .map((line) => {
        const [id, ...titleParts] = line.split("\t");
        return { id: id.trim(), title: titleParts.join("\t").trim() };
      });
  } catch (err) {
    console.error(`  Error fetching playlist ${playlistId}:`, err);
    return [];
  }
}

function parseDayNumber(title: string): number | null {
  // Match patterns like "Day 42", "Day 42:", "Day 042"
  const match = title.match(/Day\s+0*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

async function main() {
  const catalog: {
    periods: {
      name: string;
      periodIndex: number;
      playlistId: string;
      days: { day: number; videoId: string; title: string }[];
    }[];
  } = { periods: [] };

  let totalVideos = 0;
  const allDays = new Set<number>();
  const warnings: string[] = [];

  for (const period of PERIODS) {
    console.log(`Fetching: ${period.name} (${period.playlistId})...`);
    const videos = fetchPlaylist(period.playlistId);
    console.log(`  Found ${videos.length} videos`);

    const days: { day: number; videoId: string; title: string }[] = [];

    for (const video of videos) {
      const dayNum = parseDayNumber(video.title);
      if (dayNum === null) {
        // Check if this is an intro/special episode
        if (
          video.title.toLowerCase().includes("introduction") ||
          video.title.toLowerCase().includes("intro")
        ) {
          console.log(`  Skipping intro: ${video.title}`);
          continue;
        }
        warnings.push(`Could not parse day number: "${video.title}" (${video.id})`);
        continue;
      }

      if (allDays.has(dayNum)) {
        warnings.push(`Duplicate day ${dayNum}: "${video.title}" (${video.id})`);
        continue;
      }

      allDays.add(dayNum);
      days.push({ day: dayNum, videoId: video.id, title: video.title });
    }

    // Sort by day number
    days.sort((a, b) => a.day - b.day);
    totalVideos += days.length;

    catalog.periods.push({
      name: period.name,
      periodIndex: period.periodIndex,
      playlistId: period.playlistId,
      days,
    });
  }

  // Write output
  const outPath = resolve(__dirname, "../public/data/video-catalog.json");
  writeFileSync(outPath, JSON.stringify(catalog, null, 2));

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total videos mapped: ${totalVideos}`);
  console.log(`Unique days: ${allDays.size}`);

  // Check for missing days
  const missing: number[] = [];
  for (let i = 1; i <= 365; i++) {
    if (!allDays.has(i)) missing.push(i);
  }
  if (missing.length > 0) {
    console.log(`Missing days: ${missing.join(", ")}`);
  } else {
    console.log("All 365 days accounted for!");
  }

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }

  console.log(`\nWritten to: ${outPath}`);
}

main().catch(console.error);
