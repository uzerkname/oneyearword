# Bible in a Year Web App — Design Spec

## Overview

A web app companion for Father Mike Schmitz's "Bible in a Year" podcast/YouTube series. The app displays the daily YouTube video alongside the corresponding Bible text (RSV-CE), with synchronized verse highlighting as a future enhancement.

The series follows Jeff Cavins' "Great Adventure Bible Timeline," dividing the Catholic Bible into 15 periods across 365 daily episodes. Each day includes 2-3 readings from narrative books, supplemental books, and Psalms/Proverbs.

## Tech Stack

- **Framework**: Next.js + React
- **Styling**: Tailwind CSS
- **Data**: Static JSON files in `public/data/`, fetched at runtime (not bundled into JS). This keeps the bundle small since the full Bible text is large.
- **Fonts**: `next/font` with Libre Baskerville (serif, Bible text) and Inter (sans-serif, UI)
- **Deployment**: Vercel (or any static-capable host)

## Routing and State

- **URL structure**: `/day/[n]` (e.g., `/day/42`). Each day is a unique, shareable URL.
- **Default route**: `/` redirects to the user's last-visited day (stored in localStorage), or Day 1 on first visit.
- **State persistence**: Current day stored in localStorage so the user picks up where they left off.
- **Browser navigation**: Back/forward buttons work naturally via Next.js routing.

## Layout

### Main View — 70/30 Split

```
┌─────────────────────────────────────────────────────────┐
│  ← Day 41  │  Day 42  │  Day 43 →  │ [Egypt & Exodus ▾] │ [Jump to Day ▾] │
├──────────────────────────────────┬──────────────────────┤
│                                  │  [Exodus 24] [Lev 17] [Ps 78]  │
│                                  │                      │
│        YouTube Video             │  1 And he said to    │
│        (embedded player)         │  Moses, "Come up..." │
│                                  │  ▎2 Moses alone      │  ← highlighted
│            70%                   │  ▎shall come near...  │
│                                  │  3 Moses came and    │
│                                  │  told the people...  │
│                                  │                      │
│                                  │        30%           │
└──────────────────────────────────┴──────────────────────┘
```

- **Left panel (70%)**: Embedded YouTube player using the YouTube IFrame Player API
- **Right panel (30%)**: Scrollable Bible text with tabs for each reading of the day
- **Top navigation bar**: Prev/next arrows, day number, period badge, dropdown menus

### Navigation Bar

- **Prev/Next arrows**: Step one day forward or back. Disabled (grayed out) on Day 1 (prev) and Day 365 (next).
- **Day display**: Shows "Day N" prominently
- **Period badge**: Shows current period name (e.g., "Egypt and Exodus")
- **Period dropdown**: Jump to the first day of any period, showing day ranges:
  1. Early World (Days 1-5)
  2. Patriarchs (Days 6-26)
  3. Egypt and Exodus (Days 27-51)
  4. Desert Wanderings (Days 52-80)
  5. Conquest and Judges (Days 81-98)
  6. Messianic Checkpoint — John (Days 99-105)
  7. Royal Kingdom (Days 106-153)
  8. Messianic Checkpoint — Mark (Days 154-161)
  9. Divided Kingdom (Days 162-183)
  10. Exile (Days 184-257)
  11. Messianic Checkpoint — Matthew (Days 258-266)
  12. Return (Days 267-281)
  13. Maccabean Revolt (Days 282-312)
  14. Messianic Fulfillment — Luke (Days 313-321)
  15. The Church (Days 322-365)
- **Day input**: Number input field (1-365) with a "Go" button to jump directly to any day

### Bible Text Panel

- **Tabs**: One tab per reading for the current day (e.g., "Exodus 24", "Lev 17-18", "Psalm 78")
- **Active tab**: Highlighted with gold accent
- **Verse display**: Each verse on its own line, prefixed with verse number
- **Highlight style**: Active verse has a gold (#d4a574) left border and subtle warm background
- **Auto-scroll**: When sync is active (Phase 2), the panel auto-scrolls to keep the highlighted verse in view

## Theme — Dark Warm / Leather

| Element          | Color     |
|------------------|-----------|
| Background       | `#1c1a17` |
| Nav bar          | `#2a2520` |
| Video area       | `#151310` |
| Text panel       | `#211f1a` |
| Accent/highlight | `#d4a574` |
| Body text        | `#e8e0d4` |
| Muted text       | `#8a8070` |
| Borders          | `#3a3530` |

Typography: Serif font for Bible text (e.g., Libre Baskerville or similar), sans-serif for UI elements.

## Data Model

### Reading Plan (`data/reading-plan.json`)

```json
{
  "days": [
    {
      "day": 42,
      "period": "Egypt and Exodus",
      "periodIndex": 2,
      "readings": [
        { "book": "Exodus", "chapters": [24], "type": "narrative" },
        { "book": "Leviticus", "chapters": [17, 18], "type": "supplemental" },
        { "book": "Psalms", "chapters": [78], "type": "psalm" }
      ]
    }
  ]
}
```

### Video Catalog (`data/video-catalog.json`)

```json
{
  "periods": [
    {
      "name": "Early World",
      "periodIndex": 0,
      "playlistId": "PL0QzUlsjD3k3RQG9IqnQm2lL9BC4J859k",
      "days": [
        { "day": 1, "videoId": "qvROgfajuMY", "title": "Day 1: ..." }
      ]
    }
  ]
}
```

Source playlists:
1. Early World — `PL0QzUlsjD3k3RQG9IqnQm2lL9BC4J859k`
2. Patriarchs — `PL0QzUlsjD3k0FGQKAKHkgvKhQYw-vDKtr`
3. Egypt and Exodus — `PL0QzUlsjD3k2bI9HhmVEz8k4G2KSCq3d9`
4. Desert Wanderings — `PL0QzUlsjD3k1lJqkMKOBmYD3TAwJ28FT-`
5. Conquest and Judges — `PL0QzUlsjD3k1Pb7S8s6H4DkATBek-Em2g`
6. Messianic Checkpoint (John) — `PL0QzUlsjD3k3Ia2NLkKHjUPXhx8PixJ2T`
7. Royal Kingdom — `PL0QzUlsjD3k34WN4Jypigb9rhP78Z0yKG`
8. Messianic Checkpoint (Mark) — `PL0QzUlsjD3k1ah_aTj2AgWBGUWrHSYMNk`
9. Divided Kingdom — `PL0QzUlsjD3k2VUhmfdISIKDmdvDfEKs-1`
10. Exile — `PL0QzUlsjD3k2n6-dEeafHLfRxzdUh4LG-`
11. Messianic Checkpoint (Matthew) — `PL0QzUlsjD3k31tFaKokDhTWlrcJd1fGXu`
12. Return — `PL0QzUlsjD3k0ZcAJTyelxDrdiq_aYs0TV`
13. Maccabean Revolt — `PL0QzUlsjD3k3GoB3WSZbo6EC2fPimveCD`
14. Messianic Fulfillment (Luke) — `PL0QzUlsjD3k23YSnSJFpkOuV20_616mVc`
15. The Church — `PL0QzUlsjD3k0apt5Zy0HfPUWfWdrCaD-u`

### Bible Text (`data/bible/`)

- RSV-CE translation (Revised Standard Version — Catholic Edition)
- Organized as one JSON file per book: `data/bible/genesis.json`, `data/bible/exodus.json`, etc.
- Each file contains chapters and verses:

```json
{
  "book": "Exodus",
  "chapters": [
    {
      "chapter": 24,
      "verses": [
        { "verse": 1, "text": "And he said to Moses, \"Come up to the LORD...\"" },
        { "verse": 2, "text": "Moses alone shall come near to the LORD..." }
      ]
    }
  ]
}
```

- **Source strategy**: The RSV-CE is copyrighted and may not be freely available in machine-readable form. Implementation order:
  1. Search for any free/open RSV-CE API or dataset
  2. If unavailable, use the Douay-Rheims translation (public domain Catholic Bible with all deuterocanonical books)
  3. The data format is translation-agnostic, so swapping translations later is straightforward
- Must include deuterocanonical books: Tobit, Judith, Wisdom, Sirach, Baruch, 1 & 2 Maccabees, and additions to Daniel and Esther.
- **Book file naming**: Lowercase, hyphenated. E.g., `genesis.json`, `1-samuel.json`, `song-of-solomon.json`, `1-maccabees.json`. A `book-index.json` maps display names to file names.
- **Reading types**: `"narrative"` (14 main storyline books, displayed bold), `"supplemental"` (other OT/NT books), `"psalm"`, `"proverb"`, `"song"` (Song of Solomon).

### Sync Data (`data/sync/` — Phase 2)

```json
{
  "day": 42,
  "videoId": "abc123",
  "segments": [
    { "startTime": 45.2, "endTime": 78.5, "book": "Exodus", "chapter": 24, "verseStart": 1, "verseEnd": 3 },
    { "startTime": 78.5, "endTime": 112.0, "book": "Exodus", "chapter": 24, "verseStart": 4, "verseEnd": 8 }
  ]
}
```

Generated via **OCR-based frame analysis** (offline pipeline):
1. Download or stream each video and sample frames at 1-2 second intervals
2. The videos display the Bible text on screen as it is being read — run OCR on the text region of each frame
3. Match extracted text against the day's known Bible verses using fuzzy string matching
4. Produce a timestamp-to-verse map per video
5. Store as static JSON — no heavy processing at runtime

## Phasing

### Phase 1 — MVP

- Next.js project setup with the Dark Warm / Leather theme
- Reading plan data parsed from PDF into JSON
- Video catalog built from the 15 YouTube playlists
- Main 70/30 layout with embedded YouTube player
- Bible text panel with tabs for each day's readings
- Top navigation bar with prev/next, period dropdown, day jump
- Bible text displayed (RSV-CE or fallback) with verse numbers
- Responsive: on mobile, stack video on top and text below

### Phase 2 — Sync Highlighting

- **Offline OCR pipeline**: Extract frames from each video at 1-2 second intervals, run OCR on the on-screen Bible text, fuzzy-match against known verses for each day, and produce timestamp-to-verse JSON maps
- YouTube IFrame Player API integration for playback time tracking
- Real-time verse highlighting as video plays using pre-built sync data
- Auto-scroll Bible text panel to follow highlighted verse
- Visual indicator showing sync status (synced vs. unsynced episodes)

## Responsive Behavior

- **Desktop (>1024px)**: 70/30 side-by-side layout
- **Tablet (768-1024px)**: Stacked — video on top (16:9 aspect ratio), Bible text below with tabs
- **Mobile (<768px)**: Stacked — video on top (16:9 aspect ratio), Bible text below with tabs
