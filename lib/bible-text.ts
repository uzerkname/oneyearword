import { BookData, BookIndex, BookIndexEntry, Chapter, Verse } from "./types";

let bookIndex: BookIndex | null = null;
const bookCache = new Map<string, BookData>();

async function loadIndex(): Promise<BookIndex> {
  if (bookIndex) return bookIndex;
  const res = await fetch("/data/book-index.json");
  if (!res.ok) throw new Error("Failed to load book index");
  bookIndex = await res.json();
  return bookIndex!;
}

export async function getBookIndex(): Promise<BookIndex> {
  return loadIndex();
}

export async function getBookData(
  displayName: string
): Promise<BookData | undefined> {
  if (bookCache.has(displayName)) return bookCache.get(displayName)!;

  const index = await loadIndex();
  const entry: BookIndexEntry | undefined = index[displayName];
  if (!entry) {
    console.warn(`Book not found in index: ${displayName}`);
    return undefined;
  }

  const SAFE_SLUG_PATTERN = /^[a-z0-9-]+$/;
  if (!SAFE_SLUG_PATTERN.test(entry.slug)) {
    console.warn(`Invalid book slug: ${entry.slug}`);
    return undefined;
  }

  const res = await fetch(`/data/bible/${entry.slug}.json`);
  if (!res.ok) {
    console.warn(`Failed to fetch book: ${entry.slug}`);
    return undefined;
  }

  const data: BookData = await res.json();
  bookCache.set(displayName, data);
  return data;
}

export function getChapterVerses(
  book: BookData,
  chapter: number
): Verse[] | undefined {
  const ch = book.chapters.find((c: Chapter) => c.chapter === chapter);
  return ch?.verses;
}
