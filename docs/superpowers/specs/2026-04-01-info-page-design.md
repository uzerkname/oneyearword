# Info Page Design

## Overview

Add an info/about page at `/info` that explains both the Bible in a Year program and what this app does. Accessible via a hamburger menu added to the NavBar.

## Hamburger Menu (NavBar Update)

- Add a hamburger icon (three horizontal lines) to the NavBar, positioned on the right side
- On click, toggle a small dropdown menu styled with `bg-leather-nav` and `border-leather-border`
- Dropdown contains an "About" link pointing to `/info`
- Clicking outside closes the dropdown — use a transparent backdrop overlay (consistent with `PeriodDropdown` dismiss pattern)
- Simple `useState` toggle — no external library needed
- Hamburger icon uses `text-leather-accent` on hover
- On mobile: hamburger sits in the top-right of the NavBar; dropdown is positioned `absolute right-0` below the button with a minimum width so it doesn't clip

### NavBar `day` prop handling
- The info page does not have a `day` value. Make the `day` prop optional in `NavBar` (`day?: number`)
- When `day` is undefined, hide the day-specific elements (PrevNextNav, DayJumpInput, PeriodDropdown) and just show the logo + hamburger
- The info page uses this simplified NavBar

### Files Modified
- `components/NavBar.tsx` — make `day` optional, add hamburger button + dropdown

## Info Page (`/info`)

### Route
- New file: `app/info/page.tsx`
- Static page (works with `output: "export"`, no `generateStaticParams` needed since it's not a dynamic route)
- Metadata via `export const metadata = { title: "About | Bible in a Year" }`

### Layout
- Single centered column, `max-w-2xl`, generous vertical padding
- Same dark leather background as the rest of the app (`bg-leather-bg`)
- "Back to reading" link at top styled with `text-leather-accent` — links to `/` which handles redirect to last visited day via existing logic in `app/page.tsx`
- Section headings use `font-cinzel`, body text uses `font-serif` (Libre Baskerville)
- Sections separated with subtle `border-leather-border` dividers

### Component approach
- Server component — no client island needed. The "Back to reading" link uses `next/link` `<Link>` which works in server components. The `PERIODS` data is a static import.
- Hero logo uses `next/image` (consistent with `NavBar.tsx` pattern, works with `unoptimized: true` in next config)

### Content Sections

#### 1. Hero
- App logo (`/logo.png`) centered, rendered with `next/image`
- Title: "Bible in a Year" in `font-cinzel`
- Tagline: "A companion for Fr. Mike Schmitz's Bible in a Year podcast"

#### 2. What is Bible in a Year?
- Brief explainer of Fr. Mike Schmitz's program
- 365 days covering the entire Bible
- Organized into 15 historical periods
- Daily podcast episodes walking through the readings
- Developed with Jeff Cavins' Great Adventure Bible Timeline

#### 3. What Does This App Do?
- Feature list with brief descriptions:
  - Synchronized Bible text for each day's readings
  - Embedded Spotify podcast player for the daily episode
  - Discussion transcripts with interactive verse connections
  - Personal notes panel for daily reflections
  - Words of Jesus highlighted with golden illumination
  - Progress tracking across the 365-day journey

#### 4. How to Use It
- Quick-start tips:
  - Navigate days with the arrow buttons or the period/day picker
  - Click highlighted text in the discussion panel to jump to the referenced Bible verse
  - Use the notes panel to write reflections — saved automatically in your browser
  - Pick up where you left off — the app remembers your last visited day

#### 5. The Reading Plan
- Overview of the 15 periods rendered from `PERIODS` constant in `lib/constants.ts`
- Each period shown as: name + day range (e.g., "Early World — Days 1–5")
- Styled as a vertical list with `text-leather-accent` for period names

### Files Created
- `app/info/page.tsx` — the info page (server component)

## Styling
- All styles use existing Tailwind utility classes (`bg-leather-*`, `text-leather-*`, `border-leather-*`, `font-cinzel`, `font-serif`)
- No new CSS files or custom properties needed
- Responsive: single-column layout works naturally on both mobile and desktop

## Data Dependencies
- `PERIODS` from `lib/constants.ts` — for the reading plan section
- `/logo.png` from `public/` — for the hero section

## Scope Exclusions
- No footer or secondary navigation
- No analytics or tracking
- No CMS or editable content — all hardcoded
