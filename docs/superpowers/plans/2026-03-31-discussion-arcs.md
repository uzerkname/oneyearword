# Discussion Arcs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-column layout with a discussion transcript panel and SVG connection arcs linking Fr. Mike's commentary to Bible verses.

**Architecture:** Build-time pipeline (RSS download → Whisper transcription → Claude API connection mapping) outputs static JSON per episode. Client renders a new DiscussionPanel component alongside the existing BibleTextPanel, with a ConnectionArcs SVG overlay drawing bezier curves between highlighted text spans. Graceful fallback to current 2-column layout when no discussion data exists.

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS v4 / SVG / OpenAI Whisper API / Claude API

**Spec:** `docs/superpowers/specs/2026-03-31-discussion-arcs-design.md`

---

## File Structure

### New Files
- `lib/discussion-data.ts` — Fetch + cache discussion JSON per day
- `components/DiscussionPanel.tsx` — Renders transcript with highlighted connection spans
- `components/ConnectionArcs.tsx` — SVG overlay drawing bezier arcs between panels
- `public/data/discussions/day-1.json` — Sample discussion data for development/testing
- `scripts/generate-discussions.ts` — Build-time pipeline orchestrator

### Modified Files
- `lib/types.ts` — Add DiscussionData, Connection interfaces
- `components/DayView.tsx` — 2-col → 3-col layout, load discussion data, connection state
- `components/BibleTextPanel.tsx` — Accept connection highlights, expose scroll ref, support tab switching from parent
- `components/VerseList.tsx` — Wrap connected verses with highlight spans + `data-connection-id`
- `app/globals.css` — Add connection highlight styles + arc animations

---

### Task 1: TypeScript Interfaces + Discussion Data Loader

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/discussion-data.ts`
- Create: `public/data/discussions/day-1.json`

- [ ] **Step 1: Add interfaces to `lib/types.ts`**

Append to the end of the file:

```typescript
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
  color: 'gold' | 'sage' | 'rose' | 'violet' | 'copper';
  discussion: DiscussionSpan;
  bible: BibleRef;
}

export interface DiscussionData {
  day: number;
  transcript: string;
  connections: Connection[];
}
```

- [ ] **Step 2: Create sample discussion data**

Create `public/data/discussions/day-1.json` with realistic test data for Day 1 (Genesis 1-2, Psalm 19). Include 3 connections with colors gold, sage, rose. The `discussion.text` values must be exact substrings of the `transcript` field. The `bible` refs must match actual verses in `public/data/bible/genesis.json` and `public/data/bible/psalms.json`.

Read those Bible files first to get exact verse text for validation.

- [ ] **Step 3: Create `lib/discussion-data.ts`**

Follow the exact pattern of `lib/podcast-catalog.ts` and `lib/bible-text.ts`:

```typescript
import { DiscussionData } from "./types";

const cache = new Map<number, DiscussionData | null>();

export async function getDiscussionForDay(
  day: number
): Promise<DiscussionData | null> {
  if (cache.has(day)) return cache.get(day)!;

  try {
    const res = await fetch(`/data/discussions/day-${day}.json`);
    if (!res.ok) {
      cache.set(day, null);
      return null;
    }
    const data: DiscussionData = await res.json();
    cache.set(day, data);
    return data;
  } catch {
    cache.set(day, null);
    return null;
  }
}
```

- [ ] **Step 4: Verify data loads correctly**

Start the dev server (`npm run dev`), open browser console, navigate to Day 1, and verify `fetch('/data/discussions/day-1.json')` returns valid JSON.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/discussion-data.ts public/data/discussions/day-1.json
git commit -m "feat: add discussion data types and loader"
```

---

### Task 2: Connection Highlight CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add connection highlight styles to `app/globals.css`**

Add after the existing divine effects section, before any `@media` blocks:

```css
/* ═══════════════════════════════════════════════════════
   CONNECTION ARCS — Discussion ↔ Bible links
   ═══════════════════════════════════════════════════════ */

/* --- Connection highlight colors --- */
.conn-highlight {
  padding: 2px 5px;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  transition: filter 0.3s ease, background-color 0.3s ease;
}

.conn-highlight[data-color="gold"] {
  background: rgba(212, 165, 116, 0.15);
  border-bottom: 2px solid rgba(212, 165, 116, 0.4);
}
.conn-highlight[data-color="sage"] {
  background: rgba(126, 184, 158, 0.15);
  border-bottom: 2px solid rgba(126, 184, 158, 0.4);
}
.conn-highlight[data-color="rose"] {
  background: rgba(196, 122, 138, 0.15);
  border-bottom: 2px solid rgba(196, 122, 138, 0.4);
}
.conn-highlight[data-color="violet"] {
  background: rgba(155, 142, 196, 0.15);
  border-bottom: 2px solid rgba(155, 142, 196, 0.4);
}
.conn-highlight[data-color="copper"] {
  background: rgba(196, 154, 108, 0.15);
  border-bottom: 2px solid rgba(196, 154, 108, 0.4);
}

/* Hover / active glow */
.conn-highlight.conn-active {
  filter: brightness(1.3);
}
.conn-highlight[data-color="gold"].conn-active { background: rgba(212, 165, 116, 0.3); }
.conn-highlight[data-color="sage"].conn-active { background: rgba(126, 184, 158, 0.3); }
.conn-highlight[data-color="rose"].conn-active { background: rgba(196, 122, 138, 0.3); }
.conn-highlight[data-color="violet"].conn-active { background: rgba(155, 142, 196, 0.3); }
.conn-highlight[data-color="copper"].conn-active { background: rgba(196, 154, 108, 0.3); }

/* Pulse animation on click-to-scroll target */
@keyframes conn-pulse {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
  100% { filter: brightness(1); }
}
.conn-pulse {
  animation: conn-pulse 0.6s ease-out 2;
}

/* Anchor dot at top-center of highlight */
.conn-anchor-dot {
  position: absolute;
  top: 0;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.8;
  pointer-events: none;
}
.conn-highlight[data-color="gold"] .conn-anchor-dot { background: #d4a574; }
.conn-highlight[data-color="sage"] .conn-anchor-dot { background: #7eb89e; }
.conn-highlight[data-color="rose"] .conn-anchor-dot { background: #c47a8a; }
.conn-highlight[data-color="violet"] .conn-anchor-dot { background: #9b8ec4; }
.conn-highlight[data-color="copper"] .conn-anchor-dot { background: #c49a6c; }

/* Arc breathing animation */
@keyframes arc-breathe {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.55; }
}

/* Arc SVG layer promotion */
.connection-arcs-svg {
  will-change: transform;
}

/* Arc fade-out when endpoint scrolls away */
.arc-path {
  transition: opacity 0.2s ease;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .conn-pulse { animation: none; }
  .conn-highlight { transition: none; }
  .arc-path { animation: none !important; transition: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add connection highlight and arc CSS"
```

---

### Task 3: DiscussionPanel Component

**Files:**
- Create: `components/DiscussionPanel.tsx`

- [ ] **Step 1: Create `components/DiscussionPanel.tsx`**

This component renders the transcript with highlighted connection spans found via substring matching. Key details:

- Accept props: `transcript: string`, `connections: Connection[]`, `activeConnectionId: number | null`, `onConnectionHover: (id: number | null) => void`, `onConnectionClick: (id: number) => void`, `scrollRef: React.RefObject<HTMLDivElement>`
- Split transcript into segments: for each connection, find its `discussion.text` as a substring in the transcript. Wrap matches in `<span className="conn-highlight" data-color={color} data-connection-id={id} data-side="disc">` with a child `<span className="conn-anchor-dot" />`
- Non-matching text rendered as plain text
- When `activeConnectionId` matches a connection, add `conn-active` class to that span
- Attach `onMouseEnter` → `onConnectionHover(id)`, `onMouseLeave` → `onConnectionHover(null)`, `onClick` → `onConnectionClick(id)` to each highlight span
- The scroll container div uses the passed `scrollRef`
- Header shows "Discussion" label styled like the BibleTextPanel header

Implementation note: use a single-pass approach to split the transcript. Sort connections by their first occurrence index in the transcript, then iterate through building an array of `{text, connectionId?}` segments.

- [ ] **Step 2: Verify it renders with sample data**

Temporarily import DiscussionPanel in DayView to confirm it renders the Day 1 sample transcript with colored highlights. Remove the temporary import after confirming.

- [ ] **Step 3: Commit**

```bash
git add components/DiscussionPanel.tsx
git commit -m "feat: add DiscussionPanel component with connection highlights"
```

---

### Task 4: VerseList Connection Highlights

**Files:**
- Modify: `components/VerseList.tsx`
- Modify: `components/BibleTextPanel.tsx`

- [ ] **Step 1: Add connection props to VerseList**

Add to VerseListProps:

```typescript
connectionVerses?: Map<string, { id: number; color: Connection['color'] }>;
activeConnectionId?: number | null;
onConnectionHover?: (id: number | null) => void;
onConnectionClick?: (id: number) => void;
```

The `connectionVerses` map uses keys like `"Genesis:1:1"` → `{id: 1, color: 'gold'}`.

- [ ] **Step 2: Modify `renderVerse` to support connection highlights**

In the `renderVerse` function, check if the verse matches a connection via the `connectionVerses` map (key: `"BookName:chapter:verse"`). If it matches, wrap the entire `<p>` element's content in a `<span className="conn-highlight" data-color={color} data-connection-id={id} data-side="bible">` with a child `<span className="conn-anchor-dot" />`, hover/click handlers, and `conn-active` class when active.

**Important — interaction with DivineGroup (Jesus words):** If a verse is both a red-letter verse AND a connection target, the connection highlight wraps the `<p>` inside the `DivineGroup`. The divine effects remain on the outer group wrapper. This means `renderVerse` handles the connection highlight internally — the `groupVerses` function and `DivineGroup` component are not modified.

- [ ] **Step 3: Pass connection props through BibleTextPanel**

Add to BibleTextPanelProps:

```typescript
connectionVerses?: Map<string, { id: number; color: Connection['color'] }>;
activeConnectionId?: number | null;
onConnectionHover?: (id: number | null) => void;
onConnectionClick?: (id: number) => void;
scrollRef?: React.RefObject<HTMLDivElement>;
setActiveTab?: (index: number) => void;
```

Pass connection props through to VerseList.

**scrollRef strategy:** BibleTextPanel currently owns an internal `scrollRef` (`useRef<HTMLDivElement>(null)` at line 24). Replace it: if the parent passes a `scrollRef` prop, use that; otherwise create a local one. Use a simple pattern:

```typescript
const internalRef = useRef<HTMLDivElement>(null);
const scrollRef = props.scrollRef ?? internalRef;
```

**Tab switching:** Add a `setActiveTab` prop. When the parent calls it, update `activeIndex` state. Also add an `activeTabIndex` callback prop so DayView can read the current tab. Expose `activeIndex` to parent via a `useEffect` that calls `onActiveTabChange?.(activeIndex)` when it changes.

- [ ] **Step 4: Verify verse highlights render**

With the sample Day 1 data, confirm that Genesis 1:1, Genesis 1:27, and Psalms 19:1 show colored highlight spans. Verify they don't conflict with existing red-letter Jesus words highlighting.

- [ ] **Step 5: Commit**

```bash
git add components/VerseList.tsx components/BibleTextPanel.tsx
git commit -m "feat: add connection highlight support to VerseList and BibleTextPanel"
```

---

### Task 5: ConnectionArcs SVG Component

**Files:**
- Create: `components/ConnectionArcs.tsx`

- [ ] **Step 1: Create basic SVG shell with static arc paths**

Create `components/ConnectionArcs.tsx` with:

- Props: `connections: Connection[]`, `activeConnectionId: number | null`, `containerRef: React.RefObject<HTMLDivElement>`, `discScrollRef: React.RefObject<HTMLDivElement>`, `bibleScrollRef: React.RefObject<HTMLDivElement>`
- Render an `<svg className="connection-arcs-svg">` positioned absolutely over the container: `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden`
- Color map: `{ gold: '#d4a574', sage: '#7eb89e', rose: '#c47a8a', violet: '#9b8ec4', copper: '#c49a6c' }`
- For each connection, find both endpoint elements via `document.querySelector('[data-connection-id="${id}"][data-side="disc"]')` and `[data-side="bible"]`
- Calculate anchor positions relative to the container: `x = elRect.left + elRect.width/2 - containerRect.left`, `y = elRect.top - containerRect.top`
- Draw cubic bezier: `M x1 y1 C x1 cpY, x2 cpY, x2 y2` where `cpY = Math.max(Math.min(y1, y2) - 40 - Math.abs(y2-y1) * 0.3, -20)`
- Store arc data in state, render as `<path>` elements with class `arc-path`

- [ ] **Step 2: Add dynamic positioning — scroll and resize listeners**

Add `useEffect` that:
- Attaches `scroll` event listeners to both `discScrollRef.current` and `bibleScrollRef.current`
- Attaches `resize` event listener to `window`
- Each listener triggers a `requestAnimationFrame` that recalculates all arc positions
- **Visibility check**: for each connection, check if both endpoints are within their scroll container's visible bounds (`elRect.top >= scrollRect.top && elRect.bottom <= scrollRect.bottom`). If either is clipped, set that arc's opacity to 0 (CSS transition handles the 200ms fade-out via `.arc-path { transition: opacity 0.2s ease }`). When both are visible, render normally.
- Clean up all listeners on unmount

- [ ] **Step 3: Add interaction states + reduced motion**

- Active arcs (matching `activeConnectionId`): `stroke-width: 2.5`, `opacity: 0.8`, `drop-shadow(0 0 4px color)`
- Inactive arcs: `stroke-width: 1.5`, CSS animation `arc-breathe 4s ease-in-out infinite` (stagger delay per arc)
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')` — if true, skip breathing animation, use static opacity 0.45

- [ ] **Step 4: Verify arcs render correctly**

Temporarily mount ConnectionArcs in DayView with sample data. Confirm:
- SVG paths appear connecting the highlighted spans
- Arcs fade out when endpoints scroll out of view
- Hover interaction brightens the correct arc
- Resize repositions arcs

- [ ] **Step 5: Commit**

```bash
git add components/ConnectionArcs.tsx
git commit -m "feat: add ConnectionArcs SVG overlay component"
```

---

### Task 6: DayView Three-Column Layout + Integration

**Files:**
- Modify: `components/DayView.tsx`

- [ ] **Step 1: Add discussion data loading**

In the `useEffect` load function, add `getDiscussionForDay(day)` to the `Promise.all`. Store in new state `const [discussion, setDiscussion] = useState<DiscussionData | null>(null)`. Import from `lib/discussion-data.ts`.

- [ ] **Step 2: Add connection interaction state**

Add state for hover tracking:

```typescript
const [activeConnectionId, setActiveConnectionId] = useState<number | null>(null);
const mainRef = useRef<HTMLDivElement>(null);
const discScrollRef = useRef<HTMLDivElement>(null);
const bibleScrollRef = useRef<HTMLDivElement>(null);
```

Build the `connectionVerses` map from discussion data:

```typescript
const connectionVerses = useMemo(() => {
  if (!discussion) return undefined;
  const map = new Map<string, { id: number; color: Connection['color'] }>();
  for (const conn of discussion.connections) {
    const key = `${conn.bible.book}:${conn.bible.chapter}:${conn.bible.verse}`;
    map.set(key, { id: conn.id, color: conn.color });
  }
  return map;
}, [discussion]);
```

- [ ] **Step 3: Add click-to-scroll handler with tab auto-switching**

The click handlers in DiscussionPanel and VerseList pass both `id` and `side` (which panel was clicked). DayView's handler scrolls the OTHER panel:

```typescript
const bibleTabRef = useRef<{ setActiveTab: (i: number) => void }>();

const handleConnectionClick = useCallback((id: number, side: 'disc' | 'bible') => {
  if (!discussion || !dayPlan) return;
  const conn = discussion.connections.find(c => c.id === id);
  if (!conn) return;

  if (side === 'disc') {
    // Clicked discussion → scroll Bible panel to the verse
    // First, check if we need to switch tabs
    const targetBook = conn.bible.book;
    const tabIndex = dayPlan.readings.findIndex(r => r.book === targetBook);
    if (tabIndex !== -1 && tabIndex !== currentBibleTab) {
      // Switch tab, then scroll after render
      bibleTabRef.current?.setActiveTab(tabIndex);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToElement(`[data-connection-id="${id}"][data-side="bible"]`, bibleScrollRef);
        });
      });
    } else {
      scrollToElement(`[data-connection-id="${id}"][data-side="bible"]`, bibleScrollRef);
    }
  } else {
    // Clicked Bible → scroll Discussion panel
    scrollToElement(`[data-connection-id="${id}"][data-side="disc"]`, discScrollRef);
  }
}, [discussion, dayPlan, currentBibleTab]);

function scrollToElement(selector: string, scrollContainer: React.RefObject<HTMLDivElement>) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('conn-pulse');
  setTimeout(() => el.classList.remove('conn-pulse'), 1200);
}
```

Track `currentBibleTab` via a callback from BibleTextPanel: `onActiveTabChange={(i) => setCurrentBibleTab(i)}`.

- [ ] **Step 4: Update layout — conditional 3-column or 2-column**

When `discussion` is not null, render:

```tsx
<div ref={mainRef} className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
  {/* Discussion Panel - 25% */}
  <div className="lg:w-[25%] w-full lg:h-full border-r border-leather-border">
    <DiscussionPanel
      transcript={discussion.transcript}
      connections={discussion.connections}
      activeConnectionId={activeConnectionId}
      onConnectionHover={setActiveConnectionId}
      onConnectionClick={handleConnectionClick}
      scrollRef={discScrollRef}
    />
  </div>

  {/* Podcast Panel - 50% */}
  <div className="lg:w-[50%] w-full lg:h-full">
    {/* existing SpotifyPlayer */}
  </div>

  {/* Bible Text Panel - 25% */}
  <div className="lg:w-[25%] w-full lg:h-full border-l border-leather-border flex-1 lg:flex-initial">
    <BibleTextPanel
      readings={dayPlan.readings}
      day={day}
      connectionVerses={connectionVerses}
      activeConnectionId={activeConnectionId}
      onConnectionHover={setActiveConnectionId}
      onConnectionClick={handleConnectionClick}
      scrollRef={bibleScrollRef}
    />
  </div>

  {/* Arc overlay */}
  <ConnectionArcs
    connections={discussion.connections}
    activeConnectionId={activeConnectionId}
    containerRef={mainRef}
    discScrollRef={discScrollRef}
    bibleScrollRef={bibleScrollRef}
  />
</div>
```

When `discussion` is null, render the existing 2-column layout unchanged (70/30).

- [ ] **Step 5: Update loading skeleton for 3-column**

Update the loading state to show a 3-column skeleton when discussion data might exist (or keep the 2-column skeleton — either is fine since we don't know until data loads).

- [ ] **Step 6: Verify full integration**

Start dev server. Navigate to Day 1. Confirm:
- Three-column layout renders with Discussion | Podcast | Bible Text
- Highlighted phrases visible in both panels with matching colors
- Arcs visible bridging from discussion highlights to Bible verse highlights
- Hover on a highlight glows both sides + brightens arc
- Click on a highlight scrolls the other panel to the connected text
- Navigate to a day without discussion data (e.g., Day 2) → falls back to 2-column layout
- Resize window → arcs reposition correctly
- Scroll either panel → arcs track or disappear appropriately

- [ ] **Step 7: Commit**

```bash
git add components/DayView.tsx
git commit -m "feat: integrate three-column layout with discussion panel and connection arcs"
```

---

### Task 7: Mobile Layout + Responsive

**Files:**
- Modify: `components/DiscussionPanel.tsx`
- Modify: `components/DayView.tsx`

- [ ] **Step 1: Fix mobile stacking order**

Desktop order is Discussion → Podcast → Bible (left to right). Mobile order per spec is Podcast → Discussion → Bible (top to bottom). Use Tailwind's `order` utility classes on the column wrappers:
- Discussion column: `order-2 lg:order-1`
- Podcast column: `order-1 lg:order-2`
- Bible column: `order-3 lg:order-3`

- [ ] **Step 2: Hide arcs on mobile**

In ConnectionArcs component, add a `useEffect` that checks `window.matchMedia('(min-width: 1024px)')` and listens for changes. Return null (render nothing) when on mobile.

- [ ] **Step 3: Make discussion panel collapsible on mobile**

On mobile, wrap the DiscussionPanel in a collapsible container:
- Default state: collapsed, showing only the "Discussion" header bar with a chevron toggle
- Tapping the header expands to show the full transcript
- Use a simple `useState<boolean>(false)` for open/closed, with `max-height` transition for smooth animation
- Only apply collapsible behavior on mobile (< lg)

- [ ] **Step 4: Add mobile connection badges**

On mobile (< lg), add inline colored badges/chips after each highlighted connection phrase in DiscussionPanel. Each badge shows the verse reference (e.g., "Gen 1:1") and taps scroll to that verse in the stacked Bible text below. Use a small pill-shaped span with the connection color.

- [ ] **Step 5: Verify mobile layout**

Use browser dev tools responsive mode at 375px width. Confirm:
- Stacks vertically: Podcast → Discussion (collapsed) → Bible Text
- Discussion expands on tap
- No SVG arcs visible
- Connection badges show verse references
- Tapping a badge scrolls to the verse

- [ ] **Step 4: Commit**

```bash
git add components/DiscussionPanel.tsx components/DayView.tsx
git commit -m "feat: add mobile-responsive layout with inline connection badges"
```

---

### Task 8: Build-Time Pipeline Script

**Files:**
- Create: `scripts/generate-discussions.ts`

**Note:** Task 8 is independent of Tasks 2-7 and can be developed in parallel.

- [ ] **Step 1: Script scaffolding — CLI args, env vars, incremental check**

Create `scripts/generate-discussions.ts` with:
- Env vars: `OPENAI_API_KEY` (for Whisper), `ANTHROPIC_API_KEY` (for Claude)
- CLI args: `--day N` for single day, no args for batch all
- Reuse `parseDayNumber` regex from `scripts/fetch-podcast-catalog.ts` (line 69-72)
- Incremental: check if `public/data/discussions/day-{n}.json` exists, skip if so (unless `--force` flag)
- Create `public/data/discussions/` directory if it doesn't exist (`mkdirSync` with `recursive: true`)
- Log summary at end: processed N, skipped N, failed N (with day numbers)

- [ ] **Step 2: RSS feed download function**

Add function to:
- Fetch the podcast RSS feed URL (find via podcast directory lookup or hardcode after manual discovery)
- Parse XML to extract episode entries with audio URLs
- Match episodes to day numbers using `parseDayNumber`
- Download MP3 to a temp directory for a given day
- Return the temp file path

- [ ] **Step 3: Whisper transcription function**

Add function to:
- Read the MP3 file
- Send to OpenAI Whisper API (`POST https://api.openai.com/v1/audio/transcriptions`)
- Return full transcript text
- Handle errors (file too large, API errors)

- [ ] **Step 4: Claude API discussion extraction + connection mapping**

Add function to:
- Load the day's readings from `public/data/reading-plan.json`
- Load the relevant Bible text from `public/data/bible/*.json`
- Send transcript + readings to Claude API with a two-phase prompt: (1) extract just the discussion/reflection segment, (2) map discussion phrases to Bible verse references
- Parse and validate the response: ensure `discussion.text` values are substrings of the extracted discussion, ensure `bible` refs are valid
- Assign colors cycling through `['gold', 'sage', 'rose', 'violet', 'copper']`
- Return structured `DiscussionData` object

- [ ] **Step 5: Orchestration + rate limiting**

Wire steps 2-4 together in the main function:
- For each day to process: download → transcribe → map → write JSON
- Rate limiting: 1 second delay between API calls, exponential backoff on 429s (max 3 retries)
- Clean up temp MP3 files after processing
- Print progress: `Processing day N... done (M connections)`

- [ ] **Step 6: Add npm script**

Add to `package.json` scripts:
```json
"generate-discussions": "tsx scripts/generate-discussions.ts"
```

- [ ] **Step 7: Test with Day 1**

Run the pipeline for a single day:
```bash
OPENAI_API_KEY=xxx ANTHROPIC_API_KEY=xxx npm run generate-discussions -- --day 1
```

Verify the output JSON at `public/data/discussions/day-1.json` is valid, connections reference real verses, and `discussion.text` values are substrings of the transcript.

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-discussions.ts package.json
git commit -m "feat: add build-time discussion generation pipeline"
```

---

## Verification

After all tasks are complete:

1. **Dev server test**: `npm run dev`, navigate to Day 1, confirm full three-column layout with arcs
2. **Interaction test**: Hover highlights → both sides glow + arc brightens. Click → scrolls other panel with pulse animation.
3. **Tab auto-switch**: Click a discussion highlight that references a verse on a different reading tab → BibleTextPanel switches tabs, then scrolls to the verse
4. **Arc visibility**: Scroll either panel so a highlighted span goes off-screen → its arc fades out over 200ms. Scroll back → arc reappears.
5. **Fallback test**: Navigate to a day without discussion data (e.g., Day 2) → 2-column layout, no discussion panel
6. **Mobile test**: Resize to 375px width → stacked vertically: Podcast → Discussion (collapsed) → Bible Text. Expand discussion, verify colored badges, tap badge → scrolls to verse.
7. **Build test**: `npm run build` succeeds with no errors
8. **Reduced motion**: In browser devtools, enable `prefers-reduced-motion: reduce` → verify no breathing animation on arcs, no pulse animation, instant transitions on highlights
