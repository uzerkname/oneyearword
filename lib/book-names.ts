import { Reading } from "./types";

const ABBREVIATIONS: Record<string, string> = {
  Genesis: "Gen",
  Exodus: "Ex",
  Leviticus: "Lev",
  Numbers: "Num",
  Deuteronomy: "Deut",
  Joshua: "Josh",
  Judges: "Judg",
  Ruth: "Ruth",
  "1 Samuel": "1 Sam",
  "2 Samuel": "2 Sam",
  "1 Kings": "1 Kgs",
  "2 Kings": "2 Kgs",
  "1 Chronicles": "1 Chr",
  "2 Chronicles": "2 Chr",
  Ezra: "Ezra",
  Nehemiah: "Neh",
  Tobit: "Tob",
  Judith: "Jdt",
  Esther: "Esth",
  Job: "Job",
  Psalms: "Ps",
  Proverbs: "Prov",
  Ecclesiastes: "Eccl",
  "Song of Solomon": "Song",
  Wisdom: "Wis",
  Sirach: "Sir",
  Isaiah: "Isa",
  Jeremiah: "Jer",
  Lamentations: "Lam",
  Baruch: "Bar",
  Ezekiel: "Ezek",
  Daniel: "Dan",
  Hosea: "Hos",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Obad",
  Jonah: "Jonah",
  Micah: "Mic",
  Nahum: "Nah",
  Habakkuk: "Hab",
  Zephaniah: "Zeph",
  Haggai: "Hag",
  Zechariah: "Zech",
  Malachi: "Mal",
  "1 Maccabees": "1 Macc",
  "2 Maccabees": "2 Macc",
  Matthew: "Matt",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Romans: "Rom",
  "1 Corinthians": "1 Cor",
  "2 Corinthians": "2 Cor",
  Galatians: "Gal",
  Ephesians: "Eph",
  Philippians: "Phil",
  Colossians: "Col",
  "1 Thessalonians": "1 Thess",
  "2 Thessalonians": "2 Thess",
  "1 Timothy": "1 Tim",
  "2 Timothy": "2 Tim",
  Titus: "Titus",
  Philemon: "Phlm",
  Hebrews: "Heb",
  James: "Jas",
  "1 Peter": "1 Pet",
  "2 Peter": "2 Pet",
  "1 John": "1 John",
  "2 John": "2 John",
  "3 John": "3 John",
  Jude: "Jude",
  Revelation: "Rev",
};

export function abbreviateBook(name: string): string {
  return ABBREVIATIONS[name] ?? name;
}

export function readingLabel(reading: Reading): string {
  const name = reading.book;
  const chapters = reading.chapters;

  if (chapters.length === 0) return name;
  if (chapters.length === 1) return `${name} ${chapters[0]}`;

  // Check if consecutive
  const isConsecutive = chapters.every(
    (ch, i) => i === 0 || ch === chapters[i - 1] + 1
  );

  if (isConsecutive) {
    return `${name} ${chapters[0]}-${chapters[chapters.length - 1]}`;
  }

  return `${name} ${chapters.join(", ")}`;
}
