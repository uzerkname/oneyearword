/**
 * generate-discussions.ts
 *
 * Build-time pipeline: RSS → Whisper transcription → Claude discussion extraction → JSON
 *
 * Usage:
 *   npx tsx scripts/generate-discussions.ts            # process all 365 days
 *   npx tsx scripts/generate-discussions.ts --day 1   # process a single day
 *   npx tsx scripts/generate-discussions.ts --force   # overwrite existing output
 *
 * Required env vars:
 *   OPENAI_API_KEY      — for Whisper transcription
 *   ANTHROPIC_API_KEY   — for Claude discussion extraction
 *
 * RSS feed note:
 *   "The Bible in a Year (with Fr. Mike Schmitz)" by Ascension Press.
 *   The RSS URL below is the publicly known Ascension Press / Podbean feed.
 *   If it stops working, check: https://media.ascensionpress.com or search
 *   "Bible in a Year Fr Mike Schmitz RSS" to find the current feed URL.
 */

import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import { tmpdir } from "os";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RSS_URL =
  // TODO: Verify this URL is current. Ascension Press has published their feed
  // at this address, but if requests fail, replace with the current feed URL.
  // You can find it by searching "Bible in a Year Fr. Mike Schmitz podcast RSS"
  // or visiting: https://podcasts.apple.com/us/podcast/the-bible-in-a-year/id1539568321
  "https://feeds.podbean.com/biblebreakdown/feed.xml";

const COLORS = ["gold", "sage", "rose", "violet", "copper"] as const;
type Color = (typeof COLORS)[number];

const ROOT = resolve(__dirname, "..");
const DISCUSSIONS_DIR = join(ROOT, "public", "data", "discussions");
const READING_PLAN_PATH = join(ROOT, "public", "data", "reading-plan.json");
const BOOK_INDEX_PATH = join(ROOT, "public", "data", "book-index.json");
const BIBLE_DIR = join(ROOT, "public", "data", "bible");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadingEntry {
  book: string;
  chapters: number[];
  type: string;
}

interface DayPlan {
  day: number;
  period: string;
  periodIndex: number;
  readings: ReadingEntry[];
}

interface ReadingPlan {
  days: DayPlan[];
}

interface BookIndex {
  [bookName: string]: { slug: string };
}

interface BibleVerse {
  verse: number;
  text: string;
}

interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

interface BibleBook {
  book: string;
  chapters: BibleChapter[];
}

interface RssEpisode {
  title: string;
  audioUrl: string;
  dayNumber: number;
}

interface Connection {
  id: number;
  color: Color;
  discussion: { text: string };
  bible: { book: string; chapter: number; verse: number };
}

interface DiscussionData {
  day: number;
  transcript: string;
  connections: Connection[];
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { days: number[]; force: boolean } {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dayIdx = args.indexOf("--day");

  if (dayIdx !== -1) {
    const dayVal = parseInt(args[dayIdx + 1], 10);
    if (isNaN(dayVal) || dayVal < 1 || dayVal > 365) {
      console.error("--day must be a number between 1 and 365");
      process.exit(1);
    }
    return { days: [dayVal], force };
  }

  // All 365 days
  return { days: Array.from({ length: 365 }, (_, i) => i + 1), force };
}

// ---------------------------------------------------------------------------
// Env var validation
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(
      `Missing required environment variable: ${name}\n` +
        `Usage: ${name}=xxx npx tsx scripts/generate-discussions.ts`
    );
    process.exit(1);
  }
  return val;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDayNumber(title: string): number | null {
  const match = title.match(/Day\s+0*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper.
 * Retries on 429 (rate limit) or network errors, up to maxRetries times.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes("429");
      const delayMs = is429
        ? Math.min(60_000, 1000 * Math.pow(2, attempt))
        : 1000 * attempt;
      console.warn(
        `  [${label}] attempt ${attempt}/${maxRetries} failed: ${msg}. Retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 1: RSS feed download
// ---------------------------------------------------------------------------

async function fetchRssEpisodes(): Promise<Map<number, RssEpisode>> {
  console.log(`Fetching RSS feed: ${RSS_URL}`);
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "BibleInAYear-Generator/1.0" },
  });
  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  // Parse <item> blocks from RSS XML using regex (no external XML parser)
  const episodes = new Map<number, RssEpisode>();

  // Extract all <item>...</item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const block = itemMatch[1];

    // Extract title
    const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      block.match(/<title>(.*?)<\/title>/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // Extract audio URL from <enclosure>
    const enclosureMatch = block.match(/<enclosure[^>]+url="([^"]+)"/);
    if (!enclosureMatch) continue;
    const audioUrl = enclosureMatch[1];

    const dayNumber = parseDayNumber(title);
    if (dayNumber === null || dayNumber < 1 || dayNumber > 365) continue;

    // Take the first occurrence of each day (feeds are typically newest-first)
    if (!episodes.has(dayNumber)) {
      episodes.set(dayNumber, { title, audioUrl, dayNumber });
    }
  }

  console.log(`  Found ${episodes.size} episodes in RSS feed`);
  return episodes;
}

async function downloadMp3(audioUrl: string, dayNumber: number): Promise<string> {
  const tmpPath = join(tmpdir(), `bible-day-${dayNumber}-${Date.now()}.mp3`);

  const res = await fetch(audioUrl, {
    headers: { "User-Agent": "BibleInAYear-Generator/1.0" },
  });
  if (!res.ok) {
    throw new Error(`MP3 download failed: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  writeFileSync(tmpPath, Buffer.from(buffer));
  return tmpPath;
}

// ---------------------------------------------------------------------------
// Step 2: Whisper transcription
// ---------------------------------------------------------------------------

async function transcribeAudio(
  mp3Path: string,
  openaiKey: string
): Promise<string> {
  const fileBuffer = readFileSync(mp3Path);
  const blob = new Blob([fileBuffer], { type: "audio/mpeg" });

  const formData = new FormData();
  formData.append("file", blob, "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "text");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      // Content-Type is set automatically by fetch when using FormData
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Whisper API error ${res.status}: ${body}`);
  }

  // response_format=text returns plain text
  return await res.text();
}

// ---------------------------------------------------------------------------
// Step 3: Load Bible text for day's readings
// ---------------------------------------------------------------------------

function loadBibleTextForDay(dayPlan: DayPlan, bookIndex: BookIndex): string {
  const parts: string[] = [];

  for (const reading of dayPlan.readings) {
    const bookInfo = bookIndex[reading.book];
    if (!bookInfo) {
      console.warn(`  [bible] No slug for book "${reading.book}", skipping`);
      continue;
    }

    const biblePath = join(BIBLE_DIR, `${bookInfo.slug}.json`);
    if (!existsSync(biblePath)) {
      console.warn(`  [bible] File not found: ${biblePath}, skipping`);
      continue;
    }

    let bibleBook: BibleBook;
    try {
      bibleBook = JSON.parse(readFileSync(biblePath, "utf-8")) as BibleBook;
    } catch {
      console.warn(`  [bible] Failed to parse ${biblePath}, skipping`);
      continue;
    }

    for (const chapterNum of reading.chapters) {
      const chapterData = bibleBook.chapters.find(
        (c) => c.chapter === chapterNum
      );
      if (!chapterData) continue;

      parts.push(`\n${reading.book} ${chapterNum}:`);
      for (const v of chapterData.verses) {
        parts.push(`[${v.verse}] ${v.text}`);
      }
    }
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Step 4: Claude discussion extraction + connection mapping
// ---------------------------------------------------------------------------

interface ClaudeRawConnection {
  discussion: { text: string };
  bible: { book: string; chapter: number; verse: number };
}

interface ClaudeResponse {
  transcript: string;
  connections: ClaudeRawConnection[];
}

function buildClaudePrompt(
  transcript: string,
  bibleText: string,
  dayPlan: DayPlan
): string {
  const readingsSummary = dayPlan.readings
    .map((r) => `${r.book} chapters ${r.chapters.join(", ")}`)
    .join("; ");

  return `You are analyzing a podcast episode of "The Bible in a Year with Fr. Mike Schmitz" for Day ${dayPlan.day}.

Today's Bible readings: ${readingsSummary}

Here is the Bible text for today's readings:
<bible_text>
${bibleText}
</bible_text>

Here is the full podcast transcript:
<transcript>
${transcript}
</transcript>

Your task has two parts:

PART 1: Extract only the discussion/reflection segment from the transcript.
- Skip: episode intro, scripture readings, prayers, closing blessings
- Keep: Fr. Mike's commentary, reflection, and discussion of the readings

PART 2: Map phrases from the discussion to specific Bible verse references.
- Find 3-8 meaningful connections where a phrase in the discussion clearly relates to a specific verse
- Each connection must use an EXACT substring from the extracted discussion text
- Each Bible reference must be from today's readings listed above

Return your response as a JSON object with exactly this structure (no markdown, no extra text):
{
  "transcript": "<the extracted discussion/reflection text only>",
  "connections": [
    {
      "discussion": { "text": "<exact substring from the transcript field above>" },
      "bible": { "book": "<BookName>", "chapter": <N>, "verse": <N> }
    }
  ]
}`;
}

async function extractDiscussions(
  transcript: string,
  dayPlan: DayPlan,
  bookIndex: BookIndex,
  anthropicKey: string
): Promise<DiscussionData> {
  const bibleText = loadBibleTextForDay(dayPlan, bookIndex);
  const prompt = buildClaudePrompt(transcript, bibleText, dayPlan);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const apiResponse = await res.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = apiResponse.content?.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("Claude returned no text content");
  }

  // Parse JSON — strip any accidental markdown fences
  let jsonStr = textBlock.text.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let parsed: ClaudeResponse;
  try {
    parsed = JSON.parse(jsonStr) as ClaudeResponse;
  } catch {
    throw new Error(`Failed to parse Claude JSON response: ${jsonStr.slice(0, 200)}`);
  }

  if (!parsed.transcript || !Array.isArray(parsed.connections)) {
    throw new Error("Claude response missing required fields");
  }

  // Validate connections: discussion text must be substring of transcript,
  // and bible ref must match one of today's readings
  const validBooks = new Set(dayPlan.readings.map((r) => r.book));
  const validChapters = new Map<string, Set<number>>();
  for (const r of dayPlan.readings) {
    if (!validChapters.has(r.book)) validChapters.set(r.book, new Set());
    for (const ch of r.chapters) validChapters.get(r.book)!.add(ch);
  }

  const validatedConnections: Connection[] = [];
  for (const conn of parsed.connections) {
    // Check discussion text is a substring
    if (!parsed.transcript.includes(conn.discussion.text)) {
      console.warn(
        `  [validate] Skipping connection: "${conn.discussion.text.slice(0, 50)}..." not found in transcript`
      );
      continue;
    }

    // Check bible reference is in today's readings
    const { book, chapter } = conn.bible;
    if (!validBooks.has(book)) {
      console.warn(
        `  [validate] Skipping connection: book "${book}" not in today's readings`
      );
      continue;
    }
    const chapSet = validChapters.get(book);
    if (!chapSet || !chapSet.has(chapter)) {
      console.warn(
        `  [validate] Skipping connection: ${book} ch.${chapter} not in today's readings`
      );
      continue;
    }

    const idx = validatedConnections.length;
    validatedConnections.push({
      id: idx + 1,
      color: COLORS[idx % COLORS.length],
      discussion: { text: conn.discussion.text },
      bible: { book, chapter, verse: conn.bible.verse },
    });
  }

  return {
    day: dayPlan.day,
    transcript: parsed.transcript,
    connections: validatedConnections,
  };
}

// ---------------------------------------------------------------------------
// Step 5: Orchestration
// ---------------------------------------------------------------------------

async function processDay(
  dayNumber: number,
  rssEpisodes: Map<number, RssEpisode>,
  readingPlan: ReadingPlan,
  bookIndex: BookIndex,
  openaiKey: string,
  anthropicKey: string,
  force: boolean
): Promise<"processed" | "skipped" | "failed"> {
  const outputPath = join(DISCUSSIONS_DIR, `day-${dayNumber}.json`);

  // Incremental check
  if (!force && existsSync(outputPath)) {
    return "skipped";
  }

  const episode = rssEpisodes.get(dayNumber);
  if (!episode) {
    console.warn(`  Day ${dayNumber}: No RSS episode found, skipping`);
    return "failed";
  }

  const dayPlan = readingPlan.days.find((d) => d.day === dayNumber);
  if (!dayPlan) {
    console.warn(`  Day ${dayNumber}: No reading plan entry found, skipping`);
    return "failed";
  }

  process.stdout.write(`Processing day ${dayNumber}... `);
  let mp3Path: string | null = null;

  try {
    // Download MP3
    mp3Path = await withRetry(
      () => downloadMp3(episode.audioUrl, dayNumber),
      `day-${dayNumber}/download`
    );

    // Transcribe
    await sleep(1000); // rate limit between API calls
    const transcript = await withRetry(
      () => transcribeAudio(mp3Path!, openaiKey),
      `day-${dayNumber}/whisper`
    );

    // Extract discussions
    await sleep(1000);
    const data = await withRetry(
      () => extractDiscussions(transcript, dayPlan, bookIndex, anthropicKey),
      `day-${dayNumber}/claude`
    );

    // Write output
    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`done (${data.connections.length} connections)`);
    return "processed";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`FAILED: ${msg}`);
    return "failed";
  } finally {
    // Clean up temp file
    if (mp3Path && existsSync(mp3Path)) {
      try {
        unlinkSync(mp3Path);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { days, force } = parseArgs();
  const openaiKey = requireEnv("OPENAI_API_KEY");
  const anthropicKey = requireEnv("ANTHROPIC_API_KEY");

  // Ensure output directory exists
  mkdirSync(DISCUSSIONS_DIR, { recursive: true });

  // Load static data
  const readingPlan: ReadingPlan = JSON.parse(
    readFileSync(READING_PLAN_PATH, "utf-8")
  );
  const bookIndex: BookIndex = JSON.parse(
    readFileSync(BOOK_INDEX_PATH, "utf-8")
  );

  // Fetch RSS feed once
  let rssEpisodes: Map<number, RssEpisode>;
  try {
    rssEpisodes = await withRetry(fetchRssEpisodes, "rss");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Fatal: Failed to fetch RSS feed: ${msg}`);
    process.exit(1);
  }

  // Process each day
  const counts = { processed: 0, skipped: 0, failed: 0 };
  const failedDays: number[] = [];

  for (const dayNumber of days) {
    const result = await processDay(
      dayNumber,
      rssEpisodes,
      readingPlan,
      bookIndex,
      openaiKey,
      anthropicKey,
      force
    );

    if (result === "skipped") {
      counts.skipped++;
    } else if (result === "failed") {
      counts.failed++;
      failedDays.push(dayNumber);
    } else {
      counts.processed++;
    }

    // Rate limiting between days
    if (result === "processed" && dayNumber !== days[days.length - 1]) {
      await sleep(1000);
    }
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Processed: ${counts.processed}`);
  console.log(`Skipped (already exist): ${counts.skipped}`);
  console.log(`Failed: ${counts.failed}`);
  if (failedDays.length > 0) {
    console.log(`Failed days: ${failedDays.join(", ")}`);
  }
  console.log(`Output: ${DISCUSSIONS_DIR}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
