/**
 * Convert RSVCE SQLite database to JSON files matching the app's expected format.
 *
 * Reads from rsvce.sqlite3 (in project root) and writes:
 *   - public/data/bible/<slug>.json   (one per book)
 *   - public/data/book-index.json     (updated, no drbName)
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "rsvce.sqlite3");
const BIBLE_DIR = path.join(ROOT, "public", "data", "bible");
const INDEX_PATH = path.join(ROOT, "public", "data", "book-index.json");

const db = new Database(DB_PATH, { readonly: true });

// ---------------------------------------------------------------------------
// 1. Build a set of section-heading strings per chapter from the HTML content
//    so we can strip them from the unformatted verse text.
// ---------------------------------------------------------------------------

function extractHeadings() {
  const rows = db
    .prepare("SELECT reference_osis, content FROM chapters")
    .all();

  const headings = new Map(); // "Gen.1" -> Set<string>

  for (const row of rows) {
    const ref = row.reference_osis; // e.g. "Gen.1"
    // Match text inside <h3> tags (may contain nested spans)
    const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    let m;
    while ((m = h3Re.exec(row.content)) !== null) {
      // Strip inner HTML tags to get plain text
      const plain = m[1].replace(/<[^>]+>/g, "").trim();
      if (plain) {
        if (!headings.has(ref)) headings.set(ref, new Set());
        headings.get(ref).add(plain);
      }
    }
  }

  return headings;
}

const chapterHeadings = extractHeadings();

// ---------------------------------------------------------------------------
// 2. Load book metadata
// ---------------------------------------------------------------------------

const books = db
  .prepare("SELECT number, osis, human, chapters FROM books ORDER BY number")
  .all();

// Map from OSIS abbreviation to the display name used in the current index
// (e.g. the reading plan uses "Psalms" but RSVCE says "Psalm")
const DISPLAY_NAME_OVERRIDES = {
  Psalm: "Psalms",
};

function displayName(human) {
  return DISPLAY_NAME_OVERRIDES[human] || human;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ---------------------------------------------------------------------------
// 3. Process each book
// ---------------------------------------------------------------------------

const newIndex = {};
let totalVerses = 0;

for (const book of books) {
  const name = displayName(book.human);
  const slug = slugify(name);

  // Fetch all verses for this book
  const verses = db
    .prepare("SELECT verse, unformatted FROM verses WHERE book = ? ORDER BY verse")
    .all(book.osis);

  // Group by chapter
  const chaptersMap = new Map();

  for (const v of verses) {
    const chapterNum = Math.floor(v.verse);
    const verseNum = Math.round((v.verse % 1) * 1000);

    if (!chaptersMap.has(chapterNum)) chaptersMap.set(chapterNum, []);

    // Strip section headings from unformatted text
    const ref = `${book.osis}.${chapterNum}`;
    const headingSet = chapterHeadings.get(ref) || new Set();

    let text = v.unformatted;

    if (headingSet.size > 0 && text.includes("\n")) {
      // Split into lines, remove any that exactly match a heading
      const lines = text.split("\n");
      const filtered = lines.filter((line) => !headingSet.has(line.trim()));
      text = filtered.join(" ").trim();
    } else {
      // Replace any remaining newlines with spaces (poetry, etc.)
      text = text.replace(/\n/g, " ").trim();
    }

    // Clean up smart quotes and special characters
    text = text
      .replace(/\u2018/g, "\u2018") // left single quote (keep)
      .replace(/\u2019/g, "\u2019") // right single quote (keep)
      .replace(/\u201C/g, "\u201C") // left double quote (keep)
      .replace(/\u201D/g, "\u201D") // right double quote (keep)
      .replace(/\u2032/g, "\u2032") // prime (keep)
      .replace(/\s{2,}/g, " "); // collapse multiple spaces

    chaptersMap.get(chapterNum).push({
      verse: verseNum,
      text,
    });

    totalVerses++;
  }

  // Build the output structure
  const chapters = [];
  for (const [chapterNum, verseList] of chaptersMap) {
    chapters.push({
      chapter: chapterNum,
      verses: verseList,
    });
  }

  const bookData = {
    book: name,
    chapters,
  };

  // Write the JSON file
  const outPath = path.join(BIBLE_DIR, `${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(bookData, null, 2), "utf8");
  console.log(`  ${name} -> ${slug}.json (${chapters.length} chapters, ${verses.length} verses)`);

  // Build index entry
  newIndex[name] = { slug };
}

// ---------------------------------------------------------------------------
// 4. Write updated book-index.json
// ---------------------------------------------------------------------------

fs.writeFileSync(INDEX_PATH, JSON.stringify(newIndex, null, 2), "utf8");

console.log(`\nDone! ${books.length} books, ${totalVerses} verses total.`);
console.log(`Updated ${INDEX_PATH}`);

db.close();
