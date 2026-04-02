export interface Reading {
  book: string;
  chapters: number[];
  type: "narrative" | "supplemental" | "psalm" | "proverb" | "song";
}

export interface DayPlan {
  day: number;
  period: string;
  periodIndex: number;
  readings: Reading[];
}

export interface ReadingPlan {
  days: DayPlan[];
}

export interface DayVideo {
  day: number;
  videoId: string;
  title: string;
}

export interface PeriodVideos {
  name: string;
  periodIndex: number;
  playlistId: string;
  days: DayVideo[];
}

export interface VideoCatalog {
  periods: PeriodVideos[];
}

export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  chapter: number;
  verses: Verse[];
}

export interface BookData {
  book: string;
  chapters: Chapter[];
}

export interface BookIndexEntry {
  slug: string;
}

export interface BookIndex {
  [displayName: string]: BookIndexEntry;
}

export interface PodcastEpisode {
  day: number;
  episodeId: string;
  title: string;
}

export interface PodcastCatalog {
  showId: string;
  episodes: PodcastEpisode[];
}

export interface Period {
  name: string;
  periodIndex: number;
  startDay: number;
  endDay: number;
  playlistId: string;
}

export interface DiscussionSpan {
  text: string;
}

export interface BibleRef {
  book: string;
  chapter: number;
  verse: number;
}

export interface Connection {
  id: number;
  color: 'teal' | 'sage' | 'rose' | 'violet' | 'amber';
  discussion: DiscussionSpan;
  bible: BibleRef;
}

export interface DiscussionData {
  day: number;
  transcript: string;
  connections: Connection[];
}
