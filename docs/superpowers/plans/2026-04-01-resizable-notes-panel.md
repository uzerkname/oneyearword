# Resizable Notes Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a resizable split between Discussion and Notes panels on the left side, keep Notes always on the left, and make the right side scripture-only.

**Architecture:** Install `react-resizable-panels` and replace the fixed flex split in DayView's left column with a vertical `PanelGroup`. Unify the two-column fallback into the three-column layout with a placeholder Discussion panel when no data exists. Style the resize handle to match the leather theme.

**Tech Stack:** react-resizable-panels, React 19, Next.js 16, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-01-resizable-notes-panel-design.md`

---

### Task 1: Install react-resizable-panels

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

Run: `npm install react-resizable-panels`

- [ ] **Step 2: Verify installation**

Run: `npm ls react-resizable-panels`
Expected: Shows installed version

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-resizable-panels dependency"
```

---

### Task 2: Add resize handle styles to globals.css

**Files:**
- Modify: `app/globals.css` (append after notes editor section, ~line 391)

- [ ] **Step 1: Add resize handle CSS**

Append after the notes editor section at the end of `app/globals.css`:

```css
/* ═══════════════════════════════════════════════════════
   RESIZABLE PANEL HANDLE
   ═══════════════════════════════════════════════════════ */

.resize-handle {
  height: 4px;
  background: var(--color-leather-border);
  transition: background 0.2s ease;
  cursor: row-resize;
}

.resize-handle:hover,
.resize-handle[data-resize-handle-active] {
  background: var(--color-leather-accent);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add resize handle styles for panel splitter"
```

---

### Task 3: Update DayView to use resizable panels and unified layout

**Files:**
- Modify: `components/DayView.tsx`

This is the main change. Replace the two layout branches (three-column at line 147 and two-column fallback at line 208) with a single unified three-column layout. On desktop, the left column uses `PanelGroup` for resizable Discussion/Notes. On mobile, panels stack without the resize library.

- [ ] **Step 1: Add imports**

At the top of `components/DayView.tsx`, add the import for react-resizable-panels:

```tsx
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
```

- [ ] **Step 2: Add `useIsDesktop` hook inside DayView**

Add this hook inside the component body, after the existing state declarations (after line 30). It mirrors the `isMobile` pattern already used in `DiscussionPanel.tsx`:

```tsx
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
```

- [ ] **Step 3: Replace the two layout branches with a unified layout**

Remove the `if (discussion && dayPlan)` conditional and the fallback return (lines 146-246). Replace with a single return that always renders three columns. On desktop, the left column uses `PanelGroup`; on mobile, it renders plain stacked divs:

```tsx
  const discussionContent = discussion && dayPlan ? (
    <DiscussionPanel
      transcript={discussion.transcript}
      connections={showConnections ? discussion.connections : []}
      activeConnectionId={showConnections ? activeConnectionId : null}
      onConnectionHover={setActiveConnectionId}
      onConnectionClick={handleConnectionClick}
      scrollRef={discScrollRef}
      showConnections={showConnections}
      onToggleConnections={() => setShowConnections(p => !p)}
    />
  ) : (
    <div className="flex flex-col h-full bg-leather-text">
      <div className="flex items-center border-b border-leather-border bg-leather-text px-4 py-2">
        <span className="text-leather-accent font-bold text-xs font-sans uppercase tracking-widest">
          Discussion
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-leather-muted font-sans text-sm">
          No discussion available for Day {day}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-leather-bg">
      <NavBar day={day} />
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Discussion + Notes - 25% */}
        <div className="order-2 lg:order-1 lg:w-[25%] w-full lg:h-full border-r border-leather-border flex flex-col">
          {isDesktop ? (
            <PanelGroup direction="vertical" autoSaveId="discussion-notes-split">
              <Panel defaultSize={60} minSize={15}>
                {discussionContent}
              </Panel>
              <PanelResizeHandle className="resize-handle" />
              <Panel defaultSize={40} minSize={15}>
                <NotesPanel day={day} />
              </Panel>
            </PanelGroup>
          ) : (
            <>
              <div className="flex-[3] min-h-0">
                {discussionContent}
              </div>
              <div className="flex-[2] min-h-0 border-t border-leather-border">
                <NotesPanel day={day} />
              </div>
            </>
          )}
        </div>

        {/* Podcast Panel - 50% */}
        <div className="order-1 lg:order-2 lg:w-[50%] w-full lg:h-full">
          {podcast ? (
            <SpotifyPlayer
              episodeId={podcast.episodeId}
              title={podcast.title}
            />
          ) : (
            <div className="w-full h-full bg-leather-video flex items-center justify-center">
              <p className="text-leather-muted font-sans">
                No podcast episode available for Day {day}
              </p>
            </div>
          )}
        </div>

        {/* Bible Text Panel - 25% */}
        <div className="order-3 lg:order-3 lg:w-[25%] w-full lg:h-full border-l border-leather-border flex-1 lg:flex-initial">
          {dayPlan ? (
            <BibleTextPanel
              readings={dayPlan.readings}
              day={day}
              connectionVerses={showConnections ? connectionVerses : undefined}
              activeConnectionId={showConnections ? activeConnectionId : null}
              onConnectionHover={setActiveConnectionId}
              onConnectionClick={handleConnectionClick}
              scrollRef={bibleScrollRef}
              activeTab={currentBibleTab}
              setActiveTab={(i) => setCurrentBibleTab(i)}
              onActiveTabChange={setCurrentBibleTab}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-leather-text">
              <p className="text-leather-muted font-sans">
                No reading plan for Day {day}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
```

Key changes from the original:
- No more `if (discussion && dayPlan)` conditional — single unified layout
- Desktop: left column uses `PanelGroup` with `autoSaveId` for persistence and `PanelResizeHandle`
- Mobile: left column uses plain flex stacking (no resize library), matching current behavior
- Discussion shows placeholder when no data, Notes always renders on the left
- Bible panel on right renders with or without `dayPlan` (shows placeholder if missing)
- Connection props only passed when `discussion && dayPlan` both exist

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add components/DayView.tsx
git commit -m "feat: resizable discussion/notes split with unified three-column layout"
```

---

### Task 4: Update loading skeleton to match new layout

**Files:**
- Modify: `components/DayView.tsx` (lines 110-128)

- [ ] **Step 1: Update the loading skeleton**

The current loading skeleton shows a 70/30 layout. Update it to show 25/50/25 to match the new unified three-column layout:

```tsx
  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-leather-bg">
        <div className="bg-leather-nav border-b border-leather-border h-12 animate-pulse" />
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="lg:w-[25%] bg-leather-text animate-pulse" />
          <div className="lg:w-[50%] bg-leather-video animate-pulse aspect-video lg:aspect-auto" />
          <div className="lg:w-[25%] bg-leather-text p-4 space-y-2">
            {[75, 60, 85, 70, 90, 65, 80, 55, 72, 88].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-leather-border/30 rounded animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add components/DayView.tsx
git commit -m "fix: update loading skeleton to match three-column layout"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start dev server and verify**

Run: `npm run dev`

Check these scenarios:
1. Day with discussion data — three columns render, drag handle works between Discussion and Notes
2. Day without discussion data — same three columns, Discussion shows placeholder, drag handle still works
3. Resize persists after page reload (localStorage via `autoSaveId`)
4. Mobile view — panels stack vertically, no resize handle issues

- [ ] **Step 2: Final commit if any tweaks needed**
