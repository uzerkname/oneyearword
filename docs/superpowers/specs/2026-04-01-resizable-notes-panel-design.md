# Resizable Notes Panel

## Summary

Add a resizable split between the Discussion and Notes panels on the left side using `react-resizable-panels`. Notes always live on the left; the right side is scripture-only. The fallback two-column layout is replaced with a unified three-column layout where the Discussion panel shows placeholder content when no discussion data exists.

## Layout

### Three-column layout (always used on desktop)

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│  Left (25%)     │  Center (50%)            │  Right (25%)    │
│                 │                          │                 │
│  ┌───────────┐  │                          │                 │
│  │ Discussion│  │                          │                 │
│  │ (60%)     │  │  Spotify Player          │  Bible Text     │
│  │           │  │                          │                 │
│  ├═══════════┤  │                          │                 │
│  │ Notes     │  │                          │                 │
│  │ (40%)     │  │                          │                 │
│  └───────────┘  │                          │                 │
└─────────────────┴──────────────────────────┴─────────────────┘
         ═══ = drag handle
```

- **Left column**: Vertical `PanelGroup` from `react-resizable-panels`
  - `Panel` — Discussion (default 60%, min 15%)
  - `PanelResizeHandle` — horizontal drag bar
  - `Panel` — Notes (default 40%, min 15%)
- **Center**: Spotify Player (unchanged)
- **Right**: BibleTextPanel only (Notes removed from here)

### Fallback (no discussion data)

Same three-column structure. Discussion panel renders empty/placeholder content (e.g., "No discussion available for this day.").

### Mobile

No resize. Panels stack vertically as they do now. `PanelGroup` only renders on desktop (`lg:` breakpoint).

## Library

`react-resizable-panels` — provides smooth drag, keyboard accessibility, touch support, and built-in localStorage persistence via `autoSaveId`.

## Resize handle styling

- Height: 4px
- Background: subtle border color from the leather theme (`border-[#5c4a3a]` or similar)
- Hover/active: slight brightness increase for affordance
- Cursor: `row-resize`

## Persistence

Use the `autoSaveId` prop on `PanelGroup` to automatically save and restore the split ratio in localStorage. No manual localStorage code needed.

## Changes required

### `components/DayView.tsx`
- Remove the two-column fallback layout branch
- Unify to always use three-column layout
- Wrap Discussion + Notes in a `PanelGroup` with vertical direction
- Move Notes from right side (fallback) to always be in the left column
- Pass empty/placeholder state to Discussion when no discussion data

### `components/DiscussionPanel.tsx`
- Handle case where no discussion data exists (show placeholder message)

### `components/NotesPanel.tsx`
- No changes needed (already self-contained)

### `app/globals.css`
- Add resize handle hover/active styles

### New dependency
- `npm install react-resizable-panels`

## Out of scope
- Resizing the main column widths (25/50/25 split stays fixed)
- Collapsible panels (beyond what min 15% provides)
- Mobile resize
