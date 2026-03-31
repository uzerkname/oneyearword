import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";

// World English Bible USFM files from eBible.org — public domain
// These contain \wj...\wj* tags marking the words of Jesus
const USFM_ZIP_URL = "https://ebible.org/Scriptures/eng-web_usfm.zip";

const BOOKS_WITH_JESUS_WORDS: { usfmFile: string; displayName: string }[] = [
  { usfmFile: "70-MATeng-web.usfm", displayName: "Matthew" },
  { usfmFile: "71-MRKeng-web.usfm", displayName: "Mark" },
  { usfmFile: "72-LUKeng-web.usfm", displayName: "Luke" },
  { usfmFile: "73-JHNeng-web.usfm", displayName: "John" },
  { usfmFile: "74-ACTeng-web.usfm", displayName: "Acts" },
  { usfmFile: "96-REVeng-web.usfm", displayName: "Revelation" },
];

interface RedLetterData {
  [book: string]: { [chapter: string]: number[] };
}

function extractRedLetterVerses(usfm: string): { [chapter: string]: number[] } {
  const chapters: { [chapter: string]: Set<number> } = {};
  let currentChapter = 0;
  let currentVerse = 0;
  let inWJ = false;

  for (const line of usfm.split("\n")) {
    // Track chapter
    const chapterMatch = line.match(/\\c\s+(\d+)/);
    if (chapterMatch) {
      currentChapter = parseInt(chapterMatch[1], 10);
      currentVerse = 0;
    }

    // Track verse — handle multiple verses on same line
    const verseMatches = line.matchAll(/\\v\s+(\d+)/g);
    for (const m of verseMatches) {
      currentVerse = parseInt(m[1], 10);
    }

    // Check if line contains \wj markers
    const hasWjOpen = /\\wj\s/.test(line) || /\\wj$/.test(line);
    const hasWjClose = line.includes("\\wj*");

    if (hasWjOpen || inWJ) {
      if (currentChapter > 0 && currentVerse > 0) {
        const chKey = String(currentChapter);
        if (!chapters[chKey]) chapters[chKey] = new Set();
        chapters[chKey].add(currentVerse);
      }
    }

    if (hasWjOpen && !hasWjClose) {
      inWJ = true;
    }
    if (hasWjClose) {
      // Mark the closing verse too
      if (currentChapter > 0 && currentVerse > 0) {
        const chKey = String(currentChapter);
        if (!chapters[chKey]) chapters[chKey] = new Set();
        chapters[chKey].add(currentVerse);
      }
      inWJ = false;
    }
  }

  // Convert Sets to sorted arrays
  const result: { [chapter: string]: number[] } = {};
  for (const [ch, verses] of Object.entries(chapters)) {
    result[ch] = Array.from(verses).sort((a, b) => a - b);
  }
  return result;
}

async function main() {
  const tmp = tmpdir();
  const tmpDir = resolve(tmp, "web_usfm");
  const zipPath = resolve(tmp, "web_usfm.zip");

  // Download and extract if not already done
  if (!existsSync(resolve(tmpDir, BOOKS_WITH_JESUS_WORDS[0].usfmFile))) {
    console.log("Downloading World English Bible USFM files...");
    mkdirSync(tmpDir, { recursive: true });

    // Use fetch instead of curl for cross-platform
    const res = await fetch(USFM_ZIP_URL);
    if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(zipPath, buffer);

    const fileList = BOOKS_WITH_JESUS_WORDS.map((b) => `"${b.usfmFile}"`).join(" ");
    execSync(`unzip -o "${zipPath}" ${fileList} -d "${tmpDir}"`, { timeout: 30000 });
    console.log("Downloaded and extracted.\n");
  } else {
    console.log("Using cached USFM files.\n");
  }

  const redLetters: RedLetterData = {};
  let totalVerses = 0;

  console.log("Extracting red-letter verse references...\n");

  for (const book of BOOKS_WITH_JESUS_WORDS) {
    const filePath = resolve(tmpDir, book.usfmFile);
    const usfm = readFileSync(filePath, "utf-8");
    const chapters = extractRedLetterVerses(usfm);
    const verseCount = Object.values(chapters).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    if (verseCount > 0) {
      redLetters[book.displayName] = chapters;
      totalVerses += verseCount;
      const chapterCount = Object.keys(chapters).length;
      console.log(
        `  ${book.displayName}: ${verseCount} verses across ${chapterCount} chapters`
      );
    } else {
      console.log(`  ${book.displayName}: no red-letter verses found`);
    }
  }

  // Write output
  const outPath = resolve(__dirname, "../public/data/red-letters.json");
  writeFileSync(outPath, JSON.stringify(redLetters, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`Books with Jesus's words: ${Object.keys(redLetters).length}`);
  console.log(`Total verses marked: ${totalVerses}`);
  console.log(`Written to: ${outPath}`);
}

main().catch(console.error);
