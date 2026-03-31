import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Bible In A Year - 365 Day Reading Plan Parser
// Parses the Fr. Mike Schmitz / Jeff Cavins reading plan into JSON.
// ============================================================================

interface Reading {
  book: string;
  chapters: number[];
  type: "narrative" | "psalm" | "proverb" | "song" | "supplemental";
}

interface Day {
  day: number;
  period: string;
  periodIndex: number;
  readings: Reading[];
}

interface ReadingPlan {
  days: Day[];
}

// -- Period definitions by day range --
const PERIOD_RANGES: { start: number; end: number; name: string; index: number }[] = [
  { start: 1, end: 5, name: "Early World", index: 0 },
  { start: 6, end: 26, name: "Patriarchs", index: 1 },
  { start: 27, end: 51, name: "Egypt and Exodus", index: 2 },
  { start: 52, end: 80, name: "Desert Wanderings", index: 3 },
  { start: 81, end: 98, name: "Conquest and Judges", index: 4 },
  { start: 99, end: 105, name: "Messianic Checkpoint", index: 5 },
  { start: 106, end: 153, name: "Royal Kingdom", index: 6 },
  { start: 154, end: 161, name: "Messianic Checkpoint", index: 7 },
  { start: 162, end: 183, name: "Divided Kingdom", index: 8 },
  { start: 184, end: 257, name: "Exile", index: 9 },
  { start: 258, end: 266, name: "Messianic Checkpoint", index: 10 },
  { start: 267, end: 281, name: "Return", index: 11 },
  { start: 282, end: 312, name: "Maccabean Revolt", index: 12 },
  { start: 313, end: 321, name: "Messianic Fulfillment", index: 13 },
  { start: 322, end: 365, name: "The Church", index: 14 },
];

// The 14 narrative books
const NARRATIVE_BOOKS = new Set([
  "Genesis",
  "Exodus",
  "Numbers",
  "Joshua",
  "Judges",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "Ezra",
  "Nehemiah",
  "1 Maccabees",
  "Luke",
  "Acts",
]);

function getPeriod(day: number): { name: string; index: number } {
  for (const p of PERIOD_RANGES) {
    if (day >= p.start && day <= p.end) {
      return { name: p.name, index: p.index };
    }
  }
  throw new Error(`Day ${day} not found in any period range`);
}

function getType(book: string): Reading["type"] {
  if (book === "Psalms" || book === "Psalm") return "psalm";
  if (book === "Proverbs") return "proverb";
  if (book === "Song of Solomon") return "song";
  if (NARRATIVE_BOOKS.has(book)) return "narrative";
  return "supplemental";
}

/**
 * Parse a chapter reference string into an array of chapter numbers.
 * Examples:
 *   "1-2" or "1\u20132" -> [1, 2]
 *   "24" -> [24]
 *   "1:1-56" -> [1]  (verse-level, just chapter)
 *   "22:39-24:50" -> [22, 23, 24]
 *   "3, 13" -> [3, 13]
 *   "15, 6-7" -> [15, 6, 7]
 */
function parseChapters(ref: string): number[] {
  // Handle comma-separated parts like "3, 13" or "15, 6-7"
  if (ref.includes(",")) {
    const parts = ref.split(",").map((s) => s.trim());
    const chapters: number[] = [];
    for (const part of parts) {
      chapters.push(...parseChapters(part));
    }
    return chapters;
  }

  // Handle cross-chapter verse references like "22:39-24:50" or "22:39\u201324:50"
  const crossChapterMatch = ref.match(/^(\d+):\d+[\u2013\-](\d+):\d+$/);
  if (crossChapterMatch) {
    const start = parseInt(crossChapterMatch[1]);
    const end = parseInt(crossChapterMatch[2]);
    const chapters: number[] = [];
    for (let i = start; i <= end; i++) {
      chapters.push(i);
    }
    return chapters;
  }

  // Handle "20-22:38" pattern (chapter range where end has a verse reference)
  const rangeToVerseMatch = ref.match(/^(\d+)[\u2013\-](\d+):\d+/);
  if (rangeToVerseMatch) {
    const start = parseInt(rangeToVerseMatch[1]);
    const end = parseInt(rangeToVerseMatch[2]);
    const chapters: number[] = [];
    for (let i = start; i <= end; i++) {
      chapters.push(i);
    }
    return chapters;
  }

  // Handle verse-level references like "119:1-56" or "1:1-7" or "119:57-120"
  const verseMatch = ref.match(/^(\d+):\d+/);
  if (verseMatch) {
    return [parseInt(verseMatch[1])];
  }

  // Handle chapter ranges like "1-2" or "1\u20132"
  const rangeMatch = ref.match(/^(\d+)[\u2013\-](\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const chapters: number[] = [];
    for (let i = start; i <= end; i++) {
      chapters.push(i);
    }
    return chapters;
  }

  // Single chapter
  const singleMatch = ref.match(/^(\d+)$/);
  if (singleMatch) {
    return [parseInt(singleMatch[1])];
  }

  throw new Error(`Cannot parse chapter reference: "${ref}"`);
}

function r(book: string, chaptersStr: string): Reading {
  return {
    book,
    chapters: parseChapters(chaptersStr),
    type: getType(book),
  };
}

// ============================================================================
// All 365 days of readings, hardcoded from the PDF
// ============================================================================

function buildReadings(): Reading[][] {
  return [
    // Day 1
    [r("Genesis", "1-2"), r("Psalms", "19")],
    // Day 2
    [r("Genesis", "3-4"), r("Psalms", "104")],
    // Day 3
    [r("Genesis", "5-6"), r("Psalms", "136")],
    // Day 4
    [r("Genesis", "7-9"), r("Psalms", "1")],
    // Day 5
    [r("Genesis", "10-11"), r("Psalms", "2")],
    // Day 6
    [r("Genesis", "12-13"), r("Job", "1-2"), r("Proverbs", "1:1-7")],
    // Day 7
    [r("Genesis", "14-15"), r("Job", "3-4"), r("Proverbs", "1:8-19")],
    // Day 8
    [r("Genesis", "16-17"), r("Job", "5-6"), r("Proverbs", "1:20-33")],
    // Day 9
    [r("Genesis", "18-19"), r("Job", "7-8"), r("Proverbs", "2:1-5")],
    // Day 10
    [r("Genesis", "20-21"), r("Job", "9-10"), r("Proverbs", "2:6-8")],
    // Day 11
    [r("Genesis", "22-23"), r("Job", "11-12"), r("Proverbs", "2:9-15")],
    // Day 12
    [r("Genesis", "24"), r("Job", "13-14"), r("Proverbs", "2:16-19")],
    // Day 13
    [r("Genesis", "25-26"), r("Job", "15-16"), r("Proverbs", "2:20-22")],
    // Day 14
    [r("Genesis", "27-28"), r("Job", "17-18"), r("Proverbs", "3:1-4")],
    // Day 15
    [r("Genesis", "29-30"), r("Job", "19-20"), r("Proverbs", "3:5-8")],
    // Day 16
    [r("Genesis", "31-32"), r("Job", "21-22"), r("Proverbs", "3:9-12")],
    // Day 17
    [r("Genesis", "33-34"), r("Job", "23-24"), r("Proverbs", "3:13-18")],
    // Day 18
    [r("Genesis", "35-36"), r("Job", "25-26"), r("Proverbs", "3:19-24")],
    // Day 19
    [r("Genesis", "37"), r("Job", "27-28"), r("Proverbs", "3:25-27")],
    // Day 20
    [r("Genesis", "38"), r("Job", "29-30"), r("Proverbs", "3:28-32")],
    // Day 21
    [r("Genesis", "39-40"), r("Job", "31-32"), r("Proverbs", "3:33-35")],
    // Day 22
    [r("Genesis", "41-42"), r("Job", "33-34"), r("Proverbs", "4:1-9")],
    // Day 23
    [r("Genesis", "43-44"), r("Job", "35-36"), r("Proverbs", "4:10-19")],
    // Day 24
    [r("Genesis", "45-46"), r("Job", "37-38"), r("Proverbs", "4:20-27")],
    // Day 25
    [r("Genesis", "47-48"), r("Job", "39-40"), r("Psalms", "16")],
    // Day 26
    [r("Genesis", "49-50"), r("Job", "41-42"), r("Psalms", "17")],
    // Day 27
    [r("Exodus", "1-2"), r("Leviticus", "1"), r("Psalms", "44")],
    // Day 28
    [r("Exodus", "3"), r("Leviticus", "2-3"), r("Psalms", "45")],
    // Day 29
    [r("Exodus", "4-5"), r("Leviticus", "4"), r("Psalms", "46")],
    // Day 30
    [r("Exodus", "6-7"), r("Leviticus", "5"), r("Psalms", "47")],
    // Day 31
    [r("Exodus", "8"), r("Leviticus", "6"), r("Psalms", "48")],
    // Day 32
    [r("Exodus", "9"), r("Leviticus", "7"), r("Psalms", "49")],
    // Day 33
    [r("Exodus", "10-11"), r("Leviticus", "8"), r("Psalms", "50")],
    // Day 34
    [r("Exodus", "12"), r("Leviticus", "9"), r("Psalms", "114")],
    // Day 35
    [r("Exodus", "13-14"), r("Leviticus", "10"), r("Psalms", "53")],
    // Day 36
    [r("Exodus", "15-16"), r("Leviticus", "11"), r("Psalms", "71")],
    // Day 37
    [r("Exodus", "17-18"), r("Leviticus", "12"), r("Psalms", "73")],
    // Day 38
    [r("Exodus", "19-20"), r("Leviticus", "13"), r("Psalms", "74")],
    // Day 39
    [r("Exodus", "21"), r("Leviticus", "14"), r("Psalms", "75")],
    // Day 40
    [r("Exodus", "22"), r("Leviticus", "15"), r("Psalms", "76")],
    // Day 41
    [r("Exodus", "23"), r("Leviticus", "16"), r("Psalms", "77")],
    // Day 42
    [r("Exodus", "24"), r("Leviticus", "17-18"), r("Psalms", "78")],
    // Day 43
    [r("Exodus", "25-26"), r("Leviticus", "19"), r("Psalms", "119:1-56")],
    // Day 44
    [r("Exodus", "27-28"), r("Leviticus", "20"), r("Psalms", "119:57-120")],
    // Day 45
    [r("Exodus", "29"), r("Leviticus", "21"), r("Psalms", "119:121-176")],
    // Day 46
    [r("Exodus", "30-31"), r("Leviticus", "22"), r("Psalms", "115")],
    // Day 47
    [r("Exodus", "32"), r("Leviticus", "23"), r("Psalms", "79")],
    // Day 48
    [r("Exodus", "33-34"), r("Leviticus", "24"), r("Psalms", "80")],
    // Day 49
    [r("Exodus", "35-36"), r("Leviticus", "25"), r("Psalms", "81")],
    // Day 50
    [r("Exodus", "37-38"), r("Leviticus", "26"), r("Psalms", "82")],
    // Day 51
    [r("Exodus", "39-40"), r("Leviticus", "27"), r("Psalms", "83")],
    // Day 52
    [r("Numbers", "1"), r("Deuteronomy", "1"), r("Psalms", "84")],
    // Day 53
    [r("Numbers", "2"), r("Deuteronomy", "2"), r("Psalms", "85")],
    // Day 54
    [r("Numbers", "3"), r("Deuteronomy", "3"), r("Psalms", "87")],
    // Day 55
    [r("Numbers", "4"), r("Deuteronomy", "4"), r("Psalms", "88")],
    // Day 56
    [r("Numbers", "5"), r("Deuteronomy", "5"), r("Psalms", "90")],
    // Day 57
    [r("Numbers", "6"), r("Deuteronomy", "6"), r("Psalms", "91")],
    // Day 58
    [r("Numbers", "7"), r("Deuteronomy", "7"), r("Psalms", "92")],
    // Day 59
    [r("Numbers", "8-9"), r("Deuteronomy", "8"), r("Psalms", "93")],
    // Day 60
    [r("Numbers", "10"), r("Deuteronomy", "9"), r("Psalms", "10")],
    // Day 61
    [r("Numbers", "11"), r("Deuteronomy", "10"), r("Psalms", "33")],
    // Day 62
    [r("Numbers", "12-13"), r("Deuteronomy", "11"), r("Psalms", "94")],
    // Day 63
    [r("Numbers", "14"), r("Deuteronomy", "12"), r("Psalms", "95")],
    // Day 64
    [r("Numbers", "15"), r("Deuteronomy", "13-14"), r("Psalms", "96")],
    // Day 65
    [r("Numbers", "16"), r("Deuteronomy", "15-16"), r("Psalms", "97")],
    // Day 66
    [r("Numbers", "17"), r("Deuteronomy", "17-18"), r("Psalms", "98")],
    // Day 67
    [r("Numbers", "18"), r("Deuteronomy", "19-20"), r("Psalms", "99")],
    // Day 68
    [r("Numbers", "19-20"), r("Deuteronomy", "21"), r("Psalms", "100")],
    // Day 69
    [r("Numbers", "21"), r("Deuteronomy", "22"), r("Psalms", "102")],
    // Day 70
    [r("Numbers", "22"), r("Deuteronomy", "23"), r("Psalms", "105")],
    // Day 71
    [r("Numbers", "23"), r("Deuteronomy", "24-25"), r("Psalms", "106")],
    // Day 72
    [r("Numbers", "24-25"), r("Deuteronomy", "26"), r("Psalms", "107")],
    // Day 73
    [r("Numbers", "26"), r("Deuteronomy", "27"), r("Psalms", "111")],
    // Day 74
    [r("Numbers", "27-28"), r("Deuteronomy", "28"), r("Psalms", "112")],
    // Day 75
    [r("Numbers", "29-30"), r("Deuteronomy", "29"), r("Psalms", "113")],
    // Day 76
    [r("Numbers", "31"), r("Deuteronomy", "30"), r("Psalms", "116")],
    // Day 77
    [r("Numbers", "32"), r("Deuteronomy", "31"), r("Psalms", "117")],
    // Day 78
    [r("Numbers", "33"), r("Deuteronomy", "32"), r("Psalms", "118")],
    // Day 79
    [r("Numbers", "34"), r("Deuteronomy", "33"), r("Psalms", "120")],
    // Day 80
    [r("Numbers", "35-36"), r("Deuteronomy", "34"), r("Psalms", "121")],
    // Day 81
    [r("Joshua", "1-4"), r("Psalms", "123")],
    // Day 82
    [r("Joshua", "5-7"), r("Psalms", "125")],
    // Day 83
    [r("Joshua", "8-9"), r("Psalms", "126")],
    // Day 84
    [r("Joshua", "10-11"), r("Psalms", "128")],
    // Day 85
    [r("Joshua", "12-14"), r("Psalms", "129")],
    // Day 86
    [r("Joshua", "15-18"), r("Psalms", "130")],
    // Day 87
    [r("Joshua", "19-21"), r("Psalms", "131")],
    // Day 88
    [r("Joshua", "22-24"), r("Psalms", "132")],
    // Day 89
    [r("Judges", "1-3"), r("Ruth", "1"), r("Psalms", "133")],
    // Day 90
    [r("Judges", "4-5"), r("Ruth", "2"), r("Psalms", "134")],
    // Day 91
    [r("Judges", "6-8"), r("Ruth", "3"), r("Psalms", "135")],
    // Day 92
    [r("Judges", "9-11"), r("Ruth", "4"), r("Psalms", "137")],
    // Day 93
    [r("Judges", "12-15"), r("Psalms", "146")],
    // Day 94
    [r("Judges", "16-18"), r("Psalms", "147")],
    // Day 95
    [r("Judges", "19-21"), r("Psalms", "148")],
    // Day 96
    [r("1 Samuel", "1-2"), r("Psalms", "149")],
    // Day 97
    [r("1 Samuel", "3-5"), r("Psalms", "150")],
    // Day 98
    [r("1 Samuel", "6-8"), r("Psalms", "86")],
    // Day 99
    [r("John", "1-3"), r("Proverbs", "5:1-6")],
    // Day 100
    [r("John", "4-6"), r("Proverbs", "5:7-14")],
    // Day 101
    [r("John", "7-9"), r("Proverbs", "5:15-23")],
    // Day 102
    [r("John", "10-12"), r("Proverbs", "6:1-5")],
    // Day 103
    [r("John", "13-15"), r("Proverbs", "6:6-11")],
    // Day 104
    [r("John", "16-18"), r("Proverbs", "6:12-15")],
    // Day 105
    [r("John", "19-21"), r("Proverbs", "6:16-22")],
    // Day 106
    [r("1 Samuel", "9-10"), r("Proverbs", "6:23-35")],
    // Day 107
    [r("1 Samuel", "11-12"), r("Psalms", "55")],
    // Day 108
    [r("1 Samuel", "13-14"), r("Psalms", "58")],
    // Day 109
    [r("1 Samuel", "15-16"), r("Psalms", "61")],
    // Day 110
    [r("1 Samuel", "17"), r("Psalms", "12")],
    // Day 111
    [r("1 Samuel", "18-19"), r("Psalms", "59")],
    // Day 112
    [r("1 Samuel", "20"), r("Psalms", "142")],
    // Day 113
    [r("1 Samuel", "21-22"), r("Psalms", "52")],
    // Day 114
    [r("1 Samuel", "23"), r("Psalms", "54")],
    // Day 115
    [r("1 Samuel", "24"), r("Psalms", "57")],
    // Day 116
    [r("1 Samuel", "25"), r("Psalms", "63")],
    // Day 117
    [r("1 Samuel", "26"), r("Psalms", "56")],
    // Day 118
    [r("1 Samuel", "27-28"), r("Psalms", "34")],
    // Day 119
    [r("1 Samuel", "29-31"), r("Psalms", "18")],
    // Day 120
    [r("2 Samuel", "1"), r("1 Chronicles", "1"), r("Psalms", "13")],
    // Day 121
    [r("2 Samuel", "2"), r("1 Chronicles", "2"), r("Psalms", "24")],
    // Day 122
    [r("2 Samuel", "3"), r("1 Chronicles", "3-4"), r("Psalms", "25")],
    // Day 123
    [r("2 Samuel", "4"), r("1 Chronicles", "5-6"), r("Psalms", "26")],
    // Day 124
    [r("2 Samuel", "5"), r("1 Chronicles", "7-8"), r("Psalms", "27")],
    // Day 125
    [r("2 Samuel", "6-7"), r("1 Chronicles", "9"), r("Psalms", "89")],
    // Day 126
    [r("2 Samuel", "8"), r("1 Chronicles", "10-11"), r("Psalms", "60")],
    // Day 127
    [r("2 Samuel", "9"), r("1 Chronicles", "12"), r("Psalms", "28")],
    // Day 128
    [r("2 Samuel", "10"), r("1 Chronicles", "13"), r("Psalms", "31")],
    // Day 129
    [r("2 Samuel", "11"), r("1 Chronicles", "14-15"), r("Psalms", "32")],
    // Day 130
    [r("2 Samuel", "12"), r("1 Chronicles", "16"), r("Psalms", "51")],
    // Day 131
    [r("2 Samuel", "13"), r("1 Chronicles", "17"), r("Psalms", "35")],
    // Day 132
    [r("2 Samuel", "14"), r("1 Chronicles", "18"), r("Psalms", "14")],
    // Day 133
    [r("2 Samuel", "15"), r("1 Chronicles", "19-20"), r("Psalms", "3")],
    // Day 134
    [r("2 Samuel", "16"), r("1 Chronicles", "21"), r("Psalms", "15")],
    // Day 135
    [r("2 Samuel", "17"), r("1 Chronicles", "22"), r("Psalms", "36")],
    // Day 136
    [r("2 Samuel", "18"), r("1 Chronicles", "23"), r("Psalms", "37")],
    // Day 137
    [r("2 Samuel", "19"), r("1 Chronicles", "24"), r("Psalms", "38")],
    // Day 138
    [r("2 Samuel", "20"), r("1 Chronicles", "25"), r("Psalms", "39")],
    // Day 139
    [r("2 Samuel", "21"), r("1 Chronicles", "26"), r("Psalms", "40")],
    // Day 140
    [r("2 Samuel", "22"), r("1 Chronicles", "27"), r("Psalms", "41")],
    // Day 141
    [r("2 Samuel", "23"), r("1 Chronicles", "28"), r("Psalms", "42")],
    // Day 142
    [r("2 Samuel", "24"), r("1 Chronicles", "29"), r("Psalms", "30")],
    // Day 143
    [r("1 Kings", "1"), r("2 Chronicles", "1"), r("Psalms", "43")],
    // Day 144
    [r("1 Kings", "2"), r("2 Chronicles", "2-3"), r("Psalms", "62")],
    // Day 145
    [r("1 Kings", "3"), r("2 Chronicles", "4-5"), r("Psalms", "64")],
    // Day 146
    [r("1 Kings", "4"), r("2 Chronicles", "6"), r("Psalms", "65")],
    // Day 147
    [r("1 Kings", "5"), r("2 Chronicles", "7-8"), r("Psalms", "66")],
    // Day 148
    [r("1 Kings", "6"), r("2 Chronicles", "9"), r("Psalms", "4")],
    // Day 149
    [r("1 Kings", "7"), r("Ecclesiastes", "1-2"), r("Psalms", "5")],
    // Day 150
    [r("1 Kings", "8"), r("Ecclesiastes", "3-5"), r("Psalms", "6")],
    // Day 151
    [r("1 Kings", "9"), r("Ecclesiastes", "6-7"), r("Psalms", "7")],
    // Day 152
    [r("1 Kings", "10"), r("Ecclesiastes", "8-9"), r("Psalms", "8")],
    // Day 153
    [r("1 Kings", "11"), r("Ecclesiastes", "10-12"), r("Psalms", "9")],
    // Day 154
    [r("Mark", "1-2"), r("Psalms", "11")],
    // Day 155
    [r("Mark", "3-4"), r("Psalms", "20")],
    // Day 156
    [r("Mark", "5-6"), r("Psalms", "21")],
    // Day 157
    [r("Mark", "7-8"), r("Psalms", "23")],
    // Day 158
    [r("Mark", "9-10"), r("Psalms", "29")],
    // Day 159
    [r("Mark", "11-12"), r("Psalms", "67")],
    // Day 160
    [r("Mark", "13-14"), r("Psalms", "68")],
    // Day 161
    [r("Mark", "15-16"), r("Psalms", "22")],
    // Day 162
    [r("1 Kings", "12"), r("2 Chronicles", "10-11"), r("Song of Solomon", "1")],
    // Day 163
    [r("1 Kings", "13"), r("2 Chronicles", "12-13"), r("Song of Solomon", "2")],
    // Day 164
    [r("1 Kings", "14"), r("2 Chronicles", "14-15"), r("Song of Solomon", "3")],
    // Day 165
    [r("1 Kings", "15-16"), r("2 Chronicles", "16-17"), r("Song of Solomon", "4")],
    // Day 166
    [r("1 Kings", "17-18"), r("2 Chronicles", "18-19"), r("Song of Solomon", "5")],
    // Day 167
    [r("1 Kings", "19-20"), r("2 Chronicles", "20"), r("Song of Solomon", "6")],
    // Day 168
    [r("1 Kings", "21"), r("2 Chronicles", "21-22"), r("Song of Solomon", "7")],
    // Day 169
    [r("1 Kings", "22"), r("2 Chronicles", "23"), r("Song of Solomon", "8")],
    // Day 170
    [r("2 Kings", "1"), r("2 Chronicles", "24"), r("Psalms", "69")],
    // Day 171
    [r("2 Kings", "2"), r("2 Chronicles", "25"), r("Psalms", "70")],
    // Day 172
    [r("2 Kings", "3"), r("2 Chronicles", "26-27"), r("Psalms", "72")],
    // Day 173
    [r("2 Kings", "4"), r("2 Chronicles", "28"), r("Psalms", "127")],
    // Day 174
    [r("2 Kings", "5"), r("Hosea", "1-3"), r("Psalms", "101")],
    // Day 175
    [r("2 Kings", "6-7"), r("Hosea", "4-7"), r("Psalms", "103")],
    // Day 176
    [r("2 Kings", "8"), r("Hosea", "8-10"), r("Psalms", "108")],
    // Day 177
    [r("2 Kings", "9"), r("Hosea", "11-14"), r("Psalms", "109")],
    // Day 178
    [r("2 Kings", "10"), r("Amos", "1-3"), r("Psalms", "110")],
    // Day 179
    [r("2 Kings", "11-12"), r("Amos", "4-6"), r("Psalms", "122")],
    // Day 180
    [r("2 Kings", "13-14"), r("Amos", "7-9"), r("Psalms", "124")],
    // Day 181
    [r("2 Kings", "15"), r("Jonah", "1-4"), r("Psalms", "138")],
    // Day 182
    [r("2 Kings", "16"), r("Micah", "1-4"), r("Psalms", "139")],
    // Day 183
    [r("2 Kings", "17"), r("Micah", "5-7"), r("Psalms", "140")],
    // Day 184
    [r("2 Kings", "18"), r("2 Chronicles", "29"), r("Psalms", "141")],
    // Day 185
    [r("2 Kings", "19"), r("2 Chronicles", "30"), r("Psalms", "143")],
    // Day 186
    [r("2 Kings", "20"), r("2 Chronicles", "31"), r("Psalms", "144")],
    // Day 187
    [r("2 Kings", "21"), r("2 Chronicles", "32"), r("Psalms", "145")],
    // Day 188
    [r("2 Kings", "22"), r("2 Chronicles", "33"), r("Proverbs", "7")],
    // Day 189
    [r("2 Kings", "23"), r("2 Chronicles", "34"), r("Proverbs", "8:1-21")],
    // Day 190
    [r("2 Kings", "24"), r("2 Chronicles", "35"), r("Proverbs", "8:22-36")],
    // Day 191
    [r("2 Kings", "25"), r("2 Chronicles", "36"), r("Proverbs", "9:1-6")],
    // Day 192
    [r("Isaiah", "1-2"), r("Tobit", "1-2"), r("Proverbs", "9:7-12")],
    // Day 193
    [r("Isaiah", "3-4"), r("Tobit", "3-4"), r("Proverbs", "9:13-18")],
    // Day 194
    [r("Isaiah", "5-6"), r("Tobit", "5-6"), r("Proverbs", "10:1-4")],
    // Day 195
    [r("Isaiah", "7-8"), r("Tobit", "7-9"), r("Proverbs", "10:5-8")],
    // Day 196
    [r("Isaiah", "9-10"), r("Tobit", "10-12"), r("Proverbs", "10:9-12")],
    // Day 197
    [r("Isaiah", "11-13"), r("Tobit", "13-14"), r("Proverbs", "10:13-16")],
    // Day 198
    [r("Isaiah", "14-15"), r("Joel", "1-2"), r("Proverbs", "10:17-20")],
    // Day 199
    [r("Isaiah", "16-17"), r("Joel", "3"), r("Proverbs", "10:21-24")],
    // Day 200
    [r("Isaiah", "18-20"), r("Nahum", "1-2"), r("Proverbs", "10:25-28")],
    // Day 201
    [r("Isaiah", "21-22"), r("Nahum", "3"), r("Proverbs", "10:29-32")],
    // Day 202
    [r("Isaiah", "23-24"), r("Habakkuk", "1-2"), r("Proverbs", "11:1-4")],
    // Day 203
    [r("Isaiah", "25-27"), r("Habakkuk", "3"), r("Proverbs", "11:5-8")],
    // Day 204
    [r("Isaiah", "28-29"), r("Zephaniah", "1-2"), r("Proverbs", "11:9-12")],
    // Day 205
    [r("Isaiah", "30-31"), r("Zephaniah", "3"), r("Proverbs", "11:13-16")],
    // Day 206
    [r("Isaiah", "32-33"), r("Baruch", "1-2"), r("Proverbs", "11:17-20")],
    // Day 207
    [r("Isaiah", "34-36"), r("Baruch", "3-4"), r("Proverbs", "11:21-24")],
    // Day 208
    [r("Isaiah", "37-38"), r("Baruch", "5-6"), r("Proverbs", "11:25-28")],
    // Day 209
    [r("Isaiah", "39-40"), r("Ezekiel", "1"), r("Proverbs", "11:29-31")],
    // Day 210
    [r("Isaiah", "41-42"), r("Ezekiel", "2-3"), r("Proverbs", "12:1-4")],
    // Day 211
    [r("Isaiah", "43-44"), r("Ezekiel", "4-5"), r("Proverbs", "12:5-8")],
    // Day 212
    [r("Isaiah", "45-46"), r("Ezekiel", "6-7"), r("Proverbs", "12:9-12")],
    // Day 213
    [r("Isaiah", "47-48"), r("Ezekiel", "8-9"), r("Proverbs", "12:13-16")],
    // Day 214
    [r("Isaiah", "49-50"), r("Ezekiel", "10-11"), r("Proverbs", "12:17-20")],
    // Day 215
    [r("Isaiah", "51-52"), r("Ezekiel", "12-13"), r("Proverbs", "12:21-24")],
    // Day 216
    [r("Isaiah", "53-54"), r("Ezekiel", "14-15"), r("Proverbs", "12:25-28")],
    // Day 217
    [r("Isaiah", "55-56"), r("Ezekiel", "16"), r("Proverbs", "13:1-4")],
    // Day 218
    [r("Isaiah", "57-58"), r("Ezekiel", "17-18"), r("Proverbs", "13:5-8")],
    // Day 219
    [r("Isaiah", "59-60"), r("Ezekiel", "19"), r("Proverbs", "13:9-12")],
    // Day 220
    [r("Isaiah", "61-62"), r("Ezekiel", "20"), r("Proverbs", "13:13-16")],
    // Day 221
    [r("Isaiah", "63-64"), r("Ezekiel", "21-22"), r("Proverbs", "13:17-20")],
    // Day 222
    [r("Isaiah", "65"), r("Ezekiel", "23-24"), r("Proverbs", "13:21-25")],
    // Day 223
    [r("Isaiah", "66"), r("Ezekiel", "25-26"), r("Proverbs", "14:1-4")],
    // Day 224
    [r("Jeremiah", "1"), r("Ezekiel", "27"), r("Proverbs", "14:5-8")],
    // Day 225
    [r("Jeremiah", "2"), r("Ezekiel", "28"), r("Proverbs", "14:9-12")],
    // Day 226
    [r("Jeremiah", "3"), r("Ezekiel", "29-30"), r("Proverbs", "14:13-16")],
    // Day 227
    [r("Jeremiah", "4"), r("Ezekiel", "31-32"), r("Proverbs", "14:17-20")],
    // Day 228
    [r("Jeremiah", "5"), r("Ezekiel", "33"), r("Proverbs", "14:21-24")],
    // Day 229
    [r("Jeremiah", "6"), r("Ezekiel", "34-35"), r("Proverbs", "14:25-28")],
    // Day 230
    [r("Jeremiah", "7"), r("Ezekiel", "36"), r("Proverbs", "14:29-32")],
    // Day 231
    [r("Jeremiah", "8"), r("Ezekiel", "37-38"), r("Proverbs", "14:33-35")],
    // Day 232
    [r("Jeremiah", "9"), r("Ezekiel", "39"), r("Proverbs", "15:1-4")],
    // Day 233
    [r("Jeremiah", "10-11"), r("Ezekiel", "40"), r("Proverbs", "15:5-8")],
    // Day 234
    [r("Jeremiah", "12-13"), r("Ezekiel", "41-42"), r("Proverbs", "15:9-12")],
    // Day 235
    [r("Jeremiah", "14-15"), r("Ezekiel", "43-44"), r("Proverbs", "15:13-16")],
    // Day 236
    [r("Jeremiah", "16-17"), r("Ezekiel", "45-46"), r("Proverbs", "15:17-20")],
    // Day 237
    [r("Jeremiah", "18-19"), r("Ezekiel", "47-48"), r("Proverbs", "15:21-24")],
    // Day 238
    [r("Jeremiah", "20-21"), r("Daniel", "1-2"), r("Proverbs", "15:25-28")],
    // Day 239
    [r("Jeremiah", "22"), r("Daniel", "3"), r("Proverbs", "15:29-33")],
    // Day 240
    [r("Jeremiah", "23"), r("Daniel", "4-5"), r("Proverbs", "16:1-4")],
    // Day 241
    [r("Jeremiah", "24-25"), r("Daniel", "6-7"), r("Proverbs", "16:5-8")],
    // Day 242
    [r("Jeremiah", "26-27"), r("Daniel", "8-9"), r("Proverbs", "16:9-12")],
    // Day 243
    [r("Jeremiah", "28-29"), r("Daniel", "10-11"), r("Proverbs", "16:13-16")],
    // Day 244
    [r("Jeremiah", "30"), r("Daniel", "12-13"), r("Proverbs", "16:17-20")],
    // Day 245
    [r("Jeremiah", "31"), r("Daniel", "14"), r("Proverbs", "16:21-24")],
    // Day 246
    [r("Jeremiah", "32"), r("Judith", "1-2"), r("Proverbs", "16:25-28")],
    // Day 247
    [r("Jeremiah", "33-34"), r("Judith", "3-5"), r("Proverbs", "16:29-33")],
    // Day 248
    [r("Jeremiah", "35-36"), r("Judith", "6-7"), r("Proverbs", "17:1-4")],
    // Day 249
    [r("Jeremiah", "37-38"), r("Judith", "8-9"), r("Proverbs", "17:5-8")],
    // Day 250
    [r("Jeremiah", "39-40"), r("Judith", "10-11"), r("Proverbs", "17:9-12")],
    // Day 251
    [r("Jeremiah", "41-42"), r("Judith", "12-14"), r("Proverbs", "17:13-16")],
    // Day 252
    [r("Jeremiah", "43-44"), r("Judith", "15-16"), r("Proverbs", "17:17-20")],
    // Day 253
    [r("Jeremiah", "45-46"), r("Lamentations", "1"), r("Proverbs", "17:21-28")],
    // Day 254
    [r("Jeremiah", "47-48"), r("Lamentations", "2"), r("Proverbs", "18:1-4")],
    // Day 255
    [r("Jeremiah", "49-50"), r("Lamentations", "3"), r("Proverbs", "18:5-8")],
    // Day 256
    [r("Jeremiah", "51"), r("Lamentations", "4-5"), r("Proverbs", "18:9-12")],
    // Day 257
    [r("Jeremiah", "52"), r("Obadiah", "1"), r("Proverbs", "18:13-16")],
    // Day 258
    [r("Matthew", "1-4"), r("Proverbs", "18:17-20")],
    // Day 259
    [r("Matthew", "5-7"), r("Proverbs", "18:21-24")],
    // Day 260
    [r("Matthew", "8-10"), r("Proverbs", "19:1-4")],
    // Day 261
    [r("Matthew", "11-13"), r("Proverbs", "19:5-8")],
    // Day 262
    [r("Matthew", "14-17"), r("Proverbs", "19:9-12")],
    // Day 263
    [r("Matthew", "18-21"), r("Proverbs", "19:13-16")],
    // Day 264
    [r("Matthew", "22-24"), r("Proverbs", "19:17-20")],
    // Day 265
    [r("Matthew", "25-26"), r("Proverbs", "19:21-24")],
    // Day 266
    [r("Matthew", "27-28"), r("Proverbs", "19:25-29")],
    // Day 267
    [r("Ezra", "1-2"), r("Haggai", "1-2"), r("Proverbs", "20:1-3")],
    // Day 268
    [r("Ezra", "3-4"), r("Zechariah", "1-3"), r("Proverbs", "20:4-7")],
    // Day 269
    [r("Ezra", "5-6"), r("Zechariah", "4-6"), r("Proverbs", "20:8-11")],
    // Day 270
    [r("Ezra", "7-8"), r("Zechariah", "7-8"), r("Proverbs", "20:12-15")],
    // Day 271
    [r("Ezra", "9-10"), r("Zechariah", "9-11"), r("Proverbs", "20:16-19")],
    // Day 272
    [r("Nehemiah", "1-2"), r("Zechariah", "12-13"), r("Proverbs", "20:20-22")],
    // Day 273
    [r("Nehemiah", "3"), r("Zechariah", "14"), r("Proverbs", "20:23-26")],
    // Day 274
    [r("Nehemiah", "4-5"), r("Esther", "11-12"), r("Proverbs", "20:27-30")],
    // Day 275
    [r("Nehemiah", "6-7"), r("Esther", "1-2"), r("Proverbs", "21:1-4")],
    // Day 276
    [r("Nehemiah", "8"), r("Esther", "3, 13"), r("Proverbs", "21:5-8")],
    // Day 277
    [r("Nehemiah", "9"), r("Esther", "4, 14"), r("Proverbs", "21:9-12")],
    // Day 278
    [r("Nehemiah", "10"), r("Esther", "15, 6-7"), r("Proverbs", "21:13-16")],
    // Day 279
    [r("Nehemiah", "11"), r("Esther", "8, 16"), r("Proverbs", "21:17-20")],
    // Day 280
    [r("Nehemiah", "12"), r("Esther", "9-11"), r("Proverbs", "21:21-24")],
    // Day 281
    [r("Nehemiah", "13"), r("Malachi", "1-4"), r("Proverbs", "21:25-28")],
    // Day 282
    [r("1 Maccabees", "1"), r("Sirach", "1-3"), r("Proverbs", "21:29-31")],
    // Day 283
    [r("1 Maccabees", "2"), r("Sirach", "4-6"), r("Proverbs", "22:1-4")],
    // Day 284
    [r("1 Maccabees", "3"), r("Sirach", "7-9"), r("Proverbs", "22:5-8")],
    // Day 285
    [r("1 Maccabees", "4"), r("Sirach", "10-12"), r("Proverbs", "22:9-12")],
    // Day 286
    [r("1 Maccabees", "5"), r("Sirach", "13-15"), r("Proverbs", "22:13-16")],
    // Day 287
    [r("1 Maccabees", "6"), r("Sirach", "16-18"), r("Proverbs", "22:17-21")],
    // Day 288
    [r("1 Maccabees", "7"), r("Sirach", "19-21"), r("Proverbs", "22:22-25")],
    // Day 289
    [r("1 Maccabees", "8"), r("Sirach", "22-23"), r("Proverbs", "22:26-29")],
    // Day 290
    [r("1 Maccabees", "9"), r("Sirach", "24-25"), r("Proverbs", "23:1-4")],
    // Day 291
    [r("1 Maccabees", "10"), r("Sirach", "26-27"), r("Proverbs", "23:5-8")],
    // Day 292
    [r("1 Maccabees", "11"), r("Sirach", "28-29"), r("Proverbs", "23:9-12")],
    // Day 293
    [r("1 Maccabees", "12"), r("Sirach", "30-31"), r("Proverbs", "23:13-16")],
    // Day 294
    [r("1 Maccabees", "13"), r("Sirach", "32-33"), r("Proverbs", "23:17-21")],
    // Day 295
    [r("1 Maccabees", "14"), r("Sirach", "34-35"), r("Proverbs", "23:22-25")],
    // Day 296
    [r("1 Maccabees", "15"), r("Sirach", "36-37"), r("Proverbs", "23:26-28")],
    // Day 297
    [r("1 Maccabees", "16"), r("Sirach", "38-39"), r("Proverbs", "23:29-35")],
    // Day 298
    [r("2 Maccabees", "1"), r("Sirach", "40-41"), r("Proverbs", "24:1-7")],
    // Day 299
    [r("2 Maccabees", "2"), r("Sirach", "42-44"), r("Proverbs", "24:8-9")],
    // Day 300
    [r("2 Maccabees", "3"), r("Sirach", "45-46"), r("Proverbs", "24:10-12")],
    // Day 301
    [r("2 Maccabees", "4"), r("Sirach", "47-49"), r("Proverbs", "24:13-16")],
    // Day 302
    [r("2 Maccabees", "5"), r("Sirach", "50-51"), r("Proverbs", "24:17-20")],
    // Day 303
    [r("2 Maccabees", "6"), r("Wisdom", "1-2"), r("Proverbs", "24:21-26")],
    // Day 304
    [r("2 Maccabees", "7"), r("Wisdom", "3-4"), r("Proverbs", "24:27-29")],
    // Day 305
    [r("2 Maccabees", "8"), r("Wisdom", "5-6"), r("Proverbs", "24:30-34")],
    // Day 306
    [r("2 Maccabees", "9"), r("Wisdom", "7-8"), r("Proverbs", "25:1-3")],
    // Day 307
    [r("2 Maccabees", "10"), r("Wisdom", "9-10"), r("Proverbs", "25:4-7")],
    // Day 308
    [r("2 Maccabees", "11"), r("Wisdom", "11-12"), r("Proverbs", "25:8-10")],
    // Day 309
    [r("2 Maccabees", "12"), r("Wisdom", "13-14"), r("Proverbs", "25:11-14")],
    // Day 310
    [r("2 Maccabees", "13"), r("Wisdom", "15-16"), r("Proverbs", "25:15-17")],
    // Day 311
    [r("2 Maccabees", "14"), r("Wisdom", "17-18"), r("Proverbs", "25:18-20")],
    // Day 312
    [r("2 Maccabees", "15"), r("Wisdom", "19"), r("Proverbs", "25:21-23")],
    // Day 313
    [r("Luke", "1-2"), r("Proverbs", "25:24-26")],
    // Day 314
    [r("Luke", "3-5"), r("Proverbs", "25:27-28")],
    // Day 315
    [r("Luke", "6-8"), r("Proverbs", "26:1-3")],
    // Day 316
    [r("Luke", "9-10"), r("Proverbs", "26:4-6")],
    // Day 317
    [r("Luke", "11-12"), r("Proverbs", "26:7-9")],
    // Day 318
    [r("Luke", "13-16"), r("Proverbs", "26:10-12")],
    // Day 319
    [r("Luke", "17-19"), r("Proverbs", "26:13-16")],
    // Day 320
    [r("Luke", "20-22:38"), r("Proverbs", "26:17-19")],
    // Day 321
    [r("Luke", "22:39-24:50"), r("Proverbs", "26:20-23")],
    // Day 322
    [r("Acts", "1"), r("Romans", "1"), r("Proverbs", "26:24-26")],
    // Day 323
    [r("Acts", "2"), r("Romans", "2-3"), r("Proverbs", "26:27-28")],
    // Day 324
    [r("Acts", "3"), r("Romans", "4-5"), r("Proverbs", "27:1-3")],
    // Day 325
    [r("Acts", "4"), r("Romans", "6-7"), r("Proverbs", "27:4-6")],
    // Day 326
    [r("Acts", "5"), r("Romans", "8"), r("Proverbs", "27:7-9")],
    // Day 327
    [r("Acts", "6"), r("Romans", "9-10"), r("Proverbs", "27:10-12")],
    // Day 328
    [r("Acts", "7"), r("Romans", "11-12"), r("Proverbs", "27:13-14")],
    // Day 329
    [r("Acts", "8"), r("Romans", "13-14"), r("Proverbs", "27:15-17")],
    // Day 330
    [r("Acts", "9"), r("Romans", "15-16"), r("Proverbs", "27:18-20")],
    // Day 331
    [r("Acts", "10"), r("1 Corinthians", "1-2"), r("Proverbs", "27:21-22")],
    // Day 332
    [r("Acts", "11"), r("1 Corinthians", "3-4"), r("Proverbs", "27:23-27")],
    // Day 333
    [r("Acts", "12"), r("1 Corinthians", "5-6"), r("Proverbs", "28:1-3")],
    // Day 334
    [r("Acts", "13"), r("1 Corinthians", "7-8"), r("Proverbs", "28:4-6")],
    // Day 335
    [r("Acts", "14"), r("1 Corinthians", "9-10"), r("Proverbs", "28:7-9")],
    // Day 336
    [r("Acts", "15"), r("1 Corinthians", "11-12"), r("Proverbs", "28:10-12")],
    // Day 337
    [r("Acts", "16"), r("1 Corinthians", "13-14"), r("Proverbs", "28:13-15")],
    // Day 338
    [r("Acts", "17"), r("1 Corinthians", "15"), r("Proverbs", "28:16-18")],
    // Day 339
    [r("Acts", "18"), r("1 Corinthians", "16"), r("Proverbs", "28:19-21")],
    // Day 340
    [r("Acts", "19"), r("2 Corinthians", "1-2"), r("Proverbs", "28:22-24")],
    // Day 341
    [r("Acts", "20"), r("2 Corinthians", "3-5"), r("Proverbs", "28:25-28")],
    // Day 342
    [r("Acts", "21"), r("2 Corinthians", "6-8"), r("Proverbs", "29:1-4")],
    // Day 343
    [r("Acts", "22"), r("2 Corinthians", "9-11"), r("Proverbs", "29:5-7")],
    // Day 344
    [r("Acts", "23"), r("2 Corinthians", "12-13"), r("Proverbs", "29:8-11")],
    // Day 345
    [r("Acts", "24"), r("Galatians", "1-3"), r("Proverbs", "29:12-14")],
    // Day 346
    [r("Acts", "25"), r("Galatians", "4-6"), r("Proverbs", "29:15-17")],
    // Day 347
    [r("Acts", "26"), r("Ephesians", "1-3"), r("Proverbs", "29:18-21")],
    // Day 348
    [r("Acts", "27"), r("Ephesians", "4-6"), r("Proverbs", "29:22-24")],
    // Day 349
    [r("Acts", "28"), r("Philippians", "1-2"), r("Proverbs", "29:25-27")],
    // Day 350
    [r("James", "1-2"), r("Philippians", "3-4"), r("Proverbs", "30:1-6")],
    // Day 351
    [r("James", "3-5"), r("Colossians", "1-2"), r("Proverbs", "30:7-9")],
    // Day 352
    [r("1 Peter", "1-2"), r("Colossians", "3-4"), r("Proverbs", "30:10-14")],
    // Day 353
    [r("1 Peter", "3-5"), r("1 Thessalonians", "1-3"), r("Proverbs", "30:15-16")],
    // Day 354
    [r("2 Peter", "1-3"), r("1 Thessalonians", "4-5"), r("Proverbs", "30:17-19")],
    // Day 355
    [r("1 John", "1-3"), r("2 Thessalonians", "1-3"), r("Proverbs", "30:20-23")],
    // Day 356
    [r("1 John", "4-5"), r("1 Timothy", "1-3"), r("Proverbs", "30:24-28")],
    // Day 357
    [r("2 John", "1"), r("3 John", "1"), r("1 Timothy", "4-6"), r("Proverbs", "30:29-33")],
    // Day 358
    [r("Jude", "1"), r("2 Timothy", "1-2"), r("Proverbs", "31:1-7")],
    // Day 359
    [r("Revelation", "1-3"), r("2 Timothy", "3-4"), r("Proverbs", "31:8-9")],
    // Day 360
    [r("Revelation", "4-7"), r("Titus", "1-3"), r("Proverbs", "31:10-15")],
    // Day 361
    [r("Revelation", "8-11"), r("Philemon", "1"), r("Proverbs", "31:16-18")],
    // Day 362
    [r("Revelation", "12-14"), r("Hebrews", "1-4"), r("Proverbs", "31:19-22")],
    // Day 363
    [r("Revelation", "15-17"), r("Hebrews", "5-8"), r("Proverbs", "31:23-25")],
    // Day 364
    [r("Revelation", "18-20"), r("Hebrews", "9-10"), r("Proverbs", "31:26-29")],
    // Day 365
    [r("Revelation", "21-22"), r("Hebrews", "11-13"), r("Proverbs", "31:30-31")],
  ];
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const allReadings = buildReadings();

  if (allReadings.length !== 365) {
    throw new Error(`Expected 365 days but got ${allReadings.length}`);
  }

  const days: Day[] = allReadings.map((readings, index) => {
    const dayNum = index + 1;
    const { name, index: periodIndex } = getPeriod(dayNum);
    return {
      day: dayNum,
      period: name,
      periodIndex,
      readings,
    };
  });

  // Fix book name: "Psalms" should be used consistently (PDF says "Psalm" singular)
  // We use "Psalms" as the canonical book name
  for (const day of days) {
    for (const reading of day.readings) {
      if (reading.book === "Psalm") {
        reading.book = "Psalms";
      }
    }
  }

  const plan: ReadingPlan = { days };

  // Write output
  const outDir = path.join("C:", "Users", "akenn", "Bible In A Year", "public", "data");
  const outPath = path.join(outDir, "reading-plan.json");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf-8");

  // Summary stats
  console.log(`Written to: ${outPath}`);
  console.log(`Total days: ${plan.days.length}`);

  // Count by type
  const typeCounts: Record<string, number> = {};
  const periodCounts: Record<string, number> = {};
  let totalReadings = 0;

  for (const day of plan.days) {
    periodCounts[day.period] = (periodCounts[day.period] || 0) + 1;
    for (const reading of day.readings) {
      typeCounts[reading.type] = (typeCounts[reading.type] || 0) + 1;
      totalReadings++;
    }
  }

  console.log(`Total readings: ${totalReadings}`);
  console.log("\nReadings by type:");
  for (const [type, count] of Object.entries(typeCounts).sort()) {
    console.log(`  ${type}: ${count}`);
  }

  console.log("\nDays by period:");
  for (const range of PERIOD_RANGES) {
    const count = periodCounts[range.name] || 0;
    console.log(`  [${range.index}] ${range.name}: ${count} days (${range.start}-${range.end})`);
  }

  // Unique books
  const books = new Set<string>();
  for (const day of plan.days) {
    for (const reading of day.readings) {
      books.add(reading.book);
    }
  }
  console.log(`\nUnique books: ${books.size}`);
  console.log([...books].sort().join(", "));
}

main();
