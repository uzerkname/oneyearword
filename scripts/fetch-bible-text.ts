/**
 * fetch-bible-text.ts
 *
 * Downloads the Douay-Rheims Bible from the isaacronan/douay-rheims-json
 * GitHub repo and transforms it into per-book JSON files for the app.
 *
 * Usage:
 *   npx tsx scripts/fetch-bible-text.ts
 *
 * Output:
 *   - public/data/bible/{slug}.json   (73 files, one per book)
 *   - public/data/book-index.json     (display-name -> slug + DRB name)
 *
 * NOTE on Psalms: Psalm numbers follow the Vulgate / Douay-Rheims tradition,
 * which differs from the Hebrew / modern Protestant numbering for Psalms 10-147.
 * Renumbering may be added later if needed.
 */

import { writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DRBBook {
  booknumber: number;
  bookname: string;
  shortname: string;
}

interface DRBVerse {
  booknumber: number;
  chapternumber: number;
  versenumber: number;
  text: string;
}

interface OutputVerse {
  verse: number;
  text: string;
}

interface OutputChapter {
  chapter: number;
  verses: OutputVerse[];
}

interface OutputBook {
  book: string;
  chapters: OutputChapter[];
}

interface BookIndexEntry {
  slug: string;
  drbName: string;
}

// ---------------------------------------------------------------------------
// Complete booknumber -> modern name mapping for all 73 books.
//
// The source data (isaacronan/douay-rheims-json) uses verbose, all-caps DRB
// titles like "THE BOOK OF GENESIS" or "THE FIRST BOOK OF SAMUEL, OTHERWISE
// CALLED THE FIRST BOOK OF KINGS". We map every booknumber to the standard
// modern display name used in Catholic Bibles.
// ---------------------------------------------------------------------------

const BOOK_NUMBER_TO_MODERN: Record<number, string> = {
  // -- Old Testament --
  1: "Genesis",
  2: "Exodus",
  3: "Leviticus",
  4: "Numbers",
  5: "Deuteronomy",
  6: "Joshua",            // DRB: Josue
  7: "Judges",
  8: "Ruth",
  9: "1 Samuel",          // DRB: 1 Kings
  10: "2 Samuel",         // DRB: 2 Kings
  11: "1 Kings",          // DRB: 3 Kings
  12: "2 Kings",          // DRB: 4 Kings
  13: "1 Chronicles",     // DRB: 1 Paralipomenon
  14: "2 Chronicles",     // DRB: 2 Paralipomenon
  15: "Ezra",             // DRB: 1 Esdras
  16: "Nehemiah",         // DRB: 2 Esdras
  17: "Tobit",            // DRB: Tobias
  18: "Judith",
  19: "Esther",
  20: "Job",
  21: "Psalms",
  22: "Proverbs",
  23: "Ecclesiastes",
  24: "Song of Solomon",  // DRB: Canticle of Canticles
  25: "Wisdom",
  26: "Sirach",           // DRB: Ecclesiasticus
  27: "Isaiah",           // DRB: Isaias
  28: "Jeremiah",         // DRB: Jeremias
  29: "Lamentations",
  30: "Baruch",
  31: "Ezekiel",          // DRB: Ezechiel
  32: "Daniel",
  33: "Hosea",            // DRB: Osee
  34: "Joel",
  35: "Amos",
  36: "Obadiah",          // DRB: Abdias
  37: "Jonah",            // DRB: Jonas
  38: "Micah",            // DRB: Micheas
  39: "Nahum",
  40: "Habakkuk",         // DRB: Habacuc
  41: "Zephaniah",        // DRB: Sophonias
  42: "Haggai",           // DRB: Aggeus
  43: "Zechariah",        // DRB: Zacharias
  44: "Malachi",          // DRB: Malachias
  45: "1 Maccabees",      // DRB: 1 Machabees
  46: "2 Maccabees",      // DRB: 2 Machabees

  // -- New Testament --
  47: "Matthew",
  48: "Mark",
  49: "Luke",
  50: "John",
  51: "Acts",
  52: "Romans",
  53: "1 Corinthians",
  54: "2 Corinthians",
  55: "Galatians",
  56: "Ephesians",
  57: "Philippians",
  58: "Colossians",
  59: "1 Thessalonians",
  60: "2 Thessalonians",
  61: "1 Timothy",
  62: "2 Timothy",
  63: "Titus",
  64: "Philemon",
  65: "Hebrews",
  66: "James",
  67: "1 Peter",
  68: "2 Peter",
  69: "1 John",
  70: "2 John",
  71: "3 John",
  72: "Jude",
  73: "Revelation",       // DRB: Apocalypse
};

function toSlug(modernName: string): string {
  return modernName.toLowerCase().replace(/\s+/g, "-");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const BOOKS_URL =
  "https://raw.githubusercontent.com/isaacronan/douay-rheims-json/master/books.json";
const VERSES_URL =
  "https://raw.githubusercontent.com/isaacronan/douay-rheims-json/master/verses.json";

const ROOT = join(__dirname, "..");
const BIBLE_DIR = join(ROOT, "public", "data", "bible");
const INDEX_PATH = join(ROOT, "public", "data", "book-index.json");

async function main() {
  console.log("Fetching books.json ...");
  const booksRes = await fetch(BOOKS_URL);
  if (!booksRes.ok) throw new Error(`Failed to fetch books.json: ${booksRes.status}`);
  const books: DRBBook[] = await booksRes.json();

  console.log("Fetching verses.json ...");
  const versesRes = await fetch(VERSES_URL);
  if (!versesRes.ok) throw new Error(`Failed to fetch verses.json: ${versesRes.status}`);
  const verses: DRBVerse[] = await versesRes.json();

  console.log(`Downloaded ${books.length} books and ${verses.length} verses.`);

  // Clean and re-create output directory
  if (existsSync(BIBLE_DIR)) {
    rmSync(BIBLE_DIR, { recursive: true });
  }
  mkdirSync(BIBLE_DIR, { recursive: true });

  // Validate we have a modern name for every book number
  for (const book of books) {
    if (!BOOK_NUMBER_TO_MODERN[book.booknumber]) {
      throw new Error(
        `No modern name mapping for booknumber ${book.booknumber}: "${book.bookname}"`
      );
    }
  }

  // Group verses: booknumber -> chapternumber -> verses[]
  const grouped = new Map<number, Map<number, DRBVerse[]>>();
  for (const v of verses) {
    if (!grouped.has(v.booknumber)) {
      grouped.set(v.booknumber, new Map());
    }
    const chapters = grouped.get(v.booknumber)!;
    if (!chapters.has(v.chapternumber)) {
      chapters.set(v.chapternumber, []);
    }
    chapters.get(v.chapternumber)!.push(v);
  }

  // Build book-index and write per-book JSON files
  const bookIndex: Record<string, BookIndexEntry> = {};
  let filesWritten = 0;

  for (const book of books) {
    const drbName = book.bookname;
    const modernName = BOOK_NUMBER_TO_MODERN[book.booknumber];
    const slug = toSlug(modernName);

    // Build chapters array, sorted by chapter number
    const chaptersMap = grouped.get(book.booknumber);
    const outputChapters: OutputChapter[] = [];

    if (chaptersMap) {
      const chapterNumbers = [...chaptersMap.keys()].sort((a, b) => a - b);
      for (const chNum of chapterNumbers) {
        const rawVerses = chaptersMap.get(chNum)!;
        // Sort verses by verse number
        rawVerses.sort((a, b) => a.versenumber - b.versenumber);
        outputChapters.push({
          chapter: chNum,
          verses: rawVerses.map((v) => ({ verse: v.versenumber, text: v.text })),
        });
      }
    }

    const outputBook: OutputBook = {
      book: modernName,
      chapters: outputChapters,
    };

    const filePath = join(BIBLE_DIR, `${slug}.json`);
    writeFileSync(filePath, JSON.stringify(outputBook, null, 2), "utf-8");
    filesWritten++;

    // Add to index (keyed by modern display name)
    bookIndex[modernName] = { slug, drbName };
  }

  // Write book-index.json
  writeFileSync(INDEX_PATH, JSON.stringify(bookIndex, null, 2), "utf-8");

  console.log(`\nDone! Wrote ${filesWritten} book files to public/data/bible/`);
  console.log(`Wrote book-index.json to public/data/`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
