# Bible in a Year Web App — Design Spec

## Overview

A web app companion for Father Mike Schmitz's "Bible in a Year" podcast/YouTube series. The app displays the daily Spotify podcast episode alongside the corresponding Bible text (Douay-Rheims), with synchronized verse highlighting as a future enhancement.

The series follows Jeff Cavins' "Great Adventure Bible Timeline," dividing the Catholic Bible into 15 periods across 365 daily episodes. Each day includes 2-3 readings from narrative books, supplemental books, and Psalms/Proverbs.

**Domain:** oneyearword.com

## Tech Stack

- **Framework**: Next.js + React (static export)
- **Styling**: Tailwind CSS
- **Data**: Static JSON files in `public/data/`, fetched at runtime (not bundled into JS). This keeps the bundle small since the full Bible text is large.
- **Fonts**: `next/font` with Libre Baskerville (serif, Bible text) and Inter (sans-serif, UI)
- **Deployment**: Cloudflare Pages (static export to `out/` directory)
- **Audio**: Spotify podcast embeds (dark theme iframe)
- **Security**: CSP meta tag restricting frame-src to open.spotify.com, input validation on all data-driven URLs

## Routing and State

- **URL structure**: `/day/[n]` (e.g., `/day/42`). Each day is a unique, shareable URL. All 365 pages pre-rendered at build time via `generateStaticParams`.
- **Default route**: `/` redirects to the user's last-visited day (stored in localStorage), or Day 1 on first visit.
- **State persistence**: Current day stored in localStorage so the user picks up where they left off.
- **Browser navigation**: Back/forward buttons work naturally via Next.js routing.

## Layout

### Main View — 70/30 Split

```
┌─────────────────────────────────────────────────────────┐
│  ← Day 41  │  Day 42  │  Day 43 →  │ [Egypt & Exodus ▾] │ [Day # Go] │
├──────────────────────────────────┬──────────────────────┤
│                                  │  [Ex 24] [Lev 17-18] [Ps 78]   │
│    ✦  ·  ✦    ·                  │                      │
│  ·    ✦      ·  ✦                │  1 And he said to    │
│    Spotify Podcast Player        │  Moses, "Come up..." │
│    (embedded, dark theme)        │  2 Moses alone       │
│  ·  ✦    ·    ✦                  │  shall come near...  │
│    heavenly starfield bg         │  3 Moses came and    │
│            70%                   │  told the people...  │
│                                  │        30%           │
└──────────────────────────────────┴──────────────────────┘
```

- **Left panel (70%)**: Spotify podcast embed with animated golden starfield background
- **Right panel (30%)**: Scrollable Bible text with tabs for each reading of the day
- **Top navigation bar**: Prev/next arrows, day number, period dropdown, day jump input

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

- **Tabs**: One tab per reading for the current day (e.g., "Ex 24", "Lev 17-18", "Ps 78")
- **Active tab**: Highlighted with gold accent
- **Verse display**: Each verse on its own line, prefixed with verse number as superscript
- **Highlight style**: Active verse has a gold (#d4a574) left border and subtle warm background (Phase 2)
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

Typography: Libre Baskerville (serif) for Bible text, Inter (sans-serif) for UI elements.

The Spotify player panel has a heavenly animated starfield background — golden stars at three parallax layers drifting upward over a dark warm gradient.

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

### Podcast Catalog (`data/podcast-catalog.json`)

```json
{
  "showId": "4Pppt42NPK2XzKwNIoW7BR",
  "episodes": [
    { "day": 1, "episodeId": "abc123def456ghi789jkl0", "title": "Day 1: In the Beginning (2026)" }
  ]
}
```

Fetched via Spotify Web API (client credentials flow). Requires `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` environment variables to run the fetch script. Credentials must NEVER be hardcoded.

### Video Catalog (`data/video-catalog.json`) — kept for potential future use

YouTube video IDs for all 365 days, organized by period. Currently unused in the UI (embedding blocked by video owner) but retained for potential future use if embedding is re-enabled.

### Bible Text (`data/bible/`)

- Douay-Rheims translation (public domain Catholic Bible from `isaacronan/douay-rheims-json` on GitHub)
- Organized as one JSON file per book: `data/bible/genesis.json`, `data/bible/exodus.json`, etc. (73 files total)
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

- Includes all deuterocanonical books: Tobit, Judith, Wisdom, Sirach, Baruch, 1 & 2 Maccabees, and additions to Daniel and Esther.
- **Book file naming**: Lowercase, hyphenated. E.g., `genesis.json`, `1-samuel.json`, `song-of-solomon.json`, `1-maccabees.json`. A `book-index.json` maps display names to file names.
- **Reading types**: `"narrative"` (14 main storyline books), `"supplemental"` (other OT/NT books), `"psalm"`, `"proverb"`, `"song"` (Song of Solomon).

## Security

- **No hardcoded credentials** — Spotify API credentials use environment variables
- **Input validation** — Spotify episode IDs validated against `/^[a-zA-Z0-9]{22}$/`, YouTube video IDs against `/^[a-zA-Z0-9_-]{11}$/`, book slugs against `/^[a-z0-9-]+$/`
- **URL encoding** — All data-driven URL parameters use `encodeURIComponent()`
- **CSP** — Content Security Policy restricts frame-src to `open.spotify.com` only
- **Iframe sandbox** — Spotify embed uses `sandbox="allow-scripts allow-same-origin allow-popups"`
- **No user-generated content** — All data is static and build-time generated

## Phasing

### Phase 1 — MVP (Complete)

- Next.js project setup with the Dark Warm / Leather theme
- Reading plan data parsed from PDF into JSON (365 days)
- Podcast catalog fetched from Spotify API (365 episodes)
- Video catalog fetched from YouTube playlists (365 videos, kept as fallback)
- Main 70/30 layout with Spotify podcast embed + animated starfield
- Bible text panel with tabs for each day's readings (Douay-Rheims, 73 books)
- Top navigation bar with prev/next, period dropdown, day jump
- Responsive: on mobile/tablet, stack podcast on top and text below
- Static export for Cloudflare Pages deployment
- CSP and input validation for security

### Phase 2 — Sync Highlighting (Future)

- Use Spotify iFrame API `playback_update` event to track current playback position
- Generate timestamp-to-verse mapping data per episode (via AI speech-to-text or manual curation)
- Real-time verse highlighting as audio plays
- Auto-scroll Bible text panel to follow highlighted verse

## Responsive Behavior

- **Desktop (>1024px)**: 70/30 side-by-side layout
- **Tablet (768-1024px)**: Stacked — podcast on top, Bible text below with tabs
- **Mobile (<768px)**: Stacked — podcast on top, Bible text below with tabs
