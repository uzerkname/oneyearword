# Discussion Transcription & Connection Arcs

## Problem

Fr. Mike Schmitz's Bible in a Year podcast episodes end with a discussion/reflection segment where he connects themes across the day's readings. This commentary is valuable but ephemeral — listeners can't reference it alongside the text. We want to surface these connections visually, inspired by Bible cross-reference arc diagrams.

## Solution

A build-time pipeline that transcribes podcast discussion segments, identifies connections to Bible verses via AI, and renders them as an interactive three-column layout with SVG arcs bridging discussion text to scripture.

## Layout

Three-column layout replacing the current two-column (70/30) split:

```
┌──────────────────────────────────────────────────────────┐
│                        NavBar                            │
├──────────────┬────────────────────┬──────────────────────┤
│ Discussion   │   Podcast Player   │   Bible Text         │
│ (25%)        │   (50%)            │   (25%)              │
│              │                    │                      │
│ Transcript   │  ┌──────────────┐  │   Genesis 1-2        │
│ with         │  │              │  │   ─────────          │
│ highlighted  │  │   Spotify    │  │   1 In the           │
│ phrases ●────│──│── arcs ──────│──│──● beginning...      │
│              │  │              │  │                      │
│ ●────────────│──│──────────────│──│──● So God created    │
│              │  │              │  │     man in his...    │
│              │  └──────────────┘  │                      │
│ ●────────────│──│──────────────│──│──● The heavens are   │
│              │                    │     telling...       │
└──────────────┴────────────────────┴──────────────────────┘
```

- **Discussion column (left, 25%)**: Scrollable transcript of the reflection/discussion portion
- **Podcast column (center, 50%)**: Existing Spotify player (unchanged)
- **Bible text column (right, 25%)**: Existing Bible text panel (reduced from 30%)
- **SVG arcs**: Curve over the podcast area connecting highlighted phrases

## Arc Rendering

- SVG overlay positioned absolutely over the entire main content area
- Each arc is a cubic bezier curve from the top-center of a discussion highlight to the top-center of a Bible verse highlight
- Anchor positions calculated dynamically via `getBoundingClientRect()` relative to the main container
- Arcs redraw on scroll (either panel) and window resize via `requestAnimationFrame`
- Each connection gets a unique color from a warm palette: gold (#d4a574), sage (#7eb89e), rose (#c47a8a), violet (#9b8ec4), copper (#c49a6c)
- Subtle breathing animation on arc opacity at rest (respects `prefers-reduced-motion` — static arcs when reduced motion preferred)
- Small anchor dots visible at the top-center of each highlighted span

### Visibility & Clipping

- Arcs **only render when both endpoints are visible** in their respective scroll containers
- When an endpoint scrolls out of view, its arc fades out (opacity → 0 over 200ms) then is removed from the DOM
- SVG is clipped to the main content area (below NavBar) via `overflow: hidden` on the container
- All highlighted spans use `data-connection-id="{n}"` attributes for arc endpoint discovery

## Interaction

- **Hover**: Mousing over a highlighted phrase brightens both the phrase and its paired counterpart, and the connecting arc glows brighter/thicker
- **Click**: Clicking a highlighted phrase smooth-scrolls the opposite panel to the connected text, with a brief pulse animation on the target. If the target verse is on a different reading tab, auto-switch to that tab first, then scroll.
- **Both panels are independently scrollable**; arcs stay anchored to visible highlights
- All animations respect `prefers-reduced-motion` — reduced to instant transitions when preferred

## Data Pipeline (Build-Time)

All processing happens at build time, outputting static JSON — consistent with existing architecture.

### Step 1: Audio Download

- Download podcast audio via the podcast's **RSS feed** (primary approach — Spotify does not provide audio download APIs)
- Match RSS entries to day numbers by parsing episode titles, following the same pattern as `scripts/fetch-podcast-catalog.ts`
- Outputs: `.mp3` files per episode in a temp directory (not committed to git)
- Incremental: skip episodes where output JSON already exists

### Step 2: Transcription

- OpenAI Whisper API transcribes the **full episode audio**
- No audio segmentation needed — the discussion extraction happens in the next step via AI
- Outputs: full episode transcript text

### Step 3: Discussion Extraction + Connection Mapping

- Claude API receives the full transcript + the day's readings (from `reading-plan.json` + Bible text files)
- Two-phase prompt:
  1. **Extract discussion**: Identify and extract only the reflection/discussion segment from the full transcript (ignoring intro, prayers, reading, closing)
  2. **Map connections**: Identify phrases in the discussion that reference or paraphrase specific Bible verses. Return the exact discussion phrase text (for substring matching at render time) and the Bible book/chapter/verse reference (text resolved from existing Bible JSON at render time — no duplication)
- Rate limiting with exponential backoff for batch processing; failure summary at end
- Outputs: structured connection data per episode

### Step 4: Data Output

Per-episode JSON file stored at `public/data/discussions/day-{n}.json`:

```json
{
  "day": 1,
  "transcript": "Fr. Mike begins by reflecting on...",
  "connections": [
    {
      "id": 1,
      "color": "gold",
      "discussion": {
        "text": "God creates everything out of nothing — the heavens, the earth"
      },
      "bible": {
        "book": "Genesis",
        "chapter": 1,
        "verse": 1
      }
    },
    {
      "id": 2,
      "color": "sage",
      "discussion": {
        "text": "creates us in His own image and likeness"
      },
      "bible": {
        "book": "Genesis",
        "chapter": 1,
        "verse": 27
      }
    }
  ]
}
```

Discussion highlights are located at render time via **substring matching** against the transcript (no brittle character offsets). Bible verse text is resolved from existing `public/data/bible/*.json` files using book/chapter/verse references (no text duplication).

**No runtime external API calls** — the client only fetches static JSON from `public/data/`. Whisper and Claude APIs are build-time only.

## TypeScript Interfaces

Added to `lib/types.ts`:

```typescript
interface DiscussionData {
  day: number;
  transcript: string;
  connections: Connection[];
}

interface Connection {
  id: number;
  color: 'gold' | 'sage' | 'rose' | 'violet' | 'copper';
  discussion: { text: string };
  bible: { book: string; chapter: number; verse: number };
}
```

## Components

### New Components

1. **`DiscussionPanel`** — Renders the transcript with highlighted connection spans. Manages scroll state. Reports highlight element positions to the arc renderer.

2. **`ConnectionArcs`** — SVG overlay component. Takes connection data + DOM refs for all highlights. Calculates bezier paths between anchor points. Handles hover/click interaction state. Redraws on scroll/resize via `requestAnimationFrame`.

### Modified Components

3. **`DayView`** — Changes from 2-column (70/30) to 3-column (25/50/25) layout. Loads discussion data for current day. Passes connection state between DiscussionPanel and BibleTextPanel.

4. **`BibleTextPanel`** — Reduced from 30% to 25% width. Adds highlight rendering for connected verses (driven by discussion data). Exposes verse element refs for arc positioning.

5. **`VerseList`** — Adds optional connection highlight spans wrapping **entire verses** identified by connection data. Each highlighted verse gets a `data-connection-id` attribute for arc endpoint discovery. Whole-verse highlighting (not substring) since Bible JSON stores verse text as a single string.

### New Data Files

6. **`lib/discussion-data.ts`** — Fetches and caches `public/data/discussions/day-{n}.json`. Follows same pattern as `bible-text.ts`.

### New Scripts

7. **`scripts/generate-discussions.ts`** — Orchestrates the pipeline: download audio → transcribe → map connections → output JSON. Can process a single day or batch all.

## Mobile Layout

On mobile (< 1024px), the three columns stack vertically:
1. Podcast player (full width)
2. Discussion panel (full width, collapsible)
3. Bible text (full width)

Arcs are hidden on mobile — connections shown as inline colored badges/chips that scroll-to the linked verse when tapped.

## Graceful Degradation

- If no discussion data exists for a day (pipeline hasn't run yet), fall back to the current two-column layout — no discussion panel, no arcs
- Discussion panel shows a loading skeleton while fetching
- If fewer than 2 connections exist, arcs still render — even one connection is useful

## Color Palette

Connections cycle through these colors (matching the warm leather theme):

| Name    | Hex       | Use                |
|---------|-----------|--------------------|
| Gold    | `#d4a574` | Primary accent     |
| Sage    | `#7eb89e` | Secondary          |
| Rose    | `#c47a8a` | Tertiary           |
| Violet  | `#9b8ec4` | Quaternary         |
| Copper  | `#c49a6c` | Fifth+             |

Each connection's highlight uses `rgba(color, 0.15)` background with `rgba(color, 0.4)` bottom border.

## Performance Considerations

- Discussion JSON files are small (~2-5KB each) — fetched on demand, cached in memory
- SVG arcs use `requestAnimationFrame` for scroll-linked updates (no layout thrashing)
- Arc paths are simple bezier curves — negligible render cost
- Highlights use CSS transitions, not JS animation
- `will-change: transform` on arc SVG for compositor-layer promotion
