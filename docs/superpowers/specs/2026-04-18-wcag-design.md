# WCAG 2.2 Accessibility — Design Spec

**Date:** 2026-04-18
**Scope:** Pulse transit app (Next.js 16 App Router)
**Target:** WCAG 2.2 AA throughout, AAA where cost-free (reduced motion, extended contrast on body copy)

---

## Principles Summary (POUR)

| Principle | Key gaps found | Fix strategy |
|-----------|---------------|-------------|
| Perceivable | `--ink-3` fails contrast; status info colour-only; no text alternatives for crowding/diagrams/sparkline | Token adjustment + sr-only summaries + aria-hidden on decorative icons |
| Operable | No focus ring; TabBar not a tablist; TweaksPanel not a dialog; no keyboard trap | `:focus-visible` rule + ARIA roles + focus trap |
| Understandable | No heading hierarchy; search input has no label | Semantic headings + visually-hidden label |
| Robust | No live regions; no landmarks; icon buttons lack accessible names | aria-live + `<main>` + aria-label on all icon-only controls |

---

## Section 1 — Token & Contrast Fixes

**File:** `app/globals.css`

### Changes to colour tokens

`--ink-3` darkened for AA compliance (small text requires 4.5:1):

```css
/* light theme */
--ink-3: oklch(0.42 0.01 60);   /* was 0.60 — now ~5.2:1 on --bg */

/* dark theme */
--ink-3: oklch(0.62 0.01 85);   /* was 0.56 — adjusted for dark bg */
```

New text-specific semantic tokens (used wherever `--ok`/`--warn`/`--bad` appear as text colour at small sizes). The existing `--ok`/`--warn`/`--bad` values are kept for decorative use (dots, bars, heatmap cells).

```css
/* light theme */
--ok-text:   oklch(0.42 0.10 150);
--warn-text: oklch(0.48 0.14 75);
--bad-text:  oklch(0.42 0.16 25);

/* dark theme */
--ok-text:   oklch(0.78 0.11 150);
--warn-text: oklch(0.82 0.13 75);
--bad-text:  oklch(0.78 0.15 25);
```

### Usages to update

All occurrences of `color: 'var(--ok)'`, `color: 'var(--warn)'`, `color: 'var(--bad)'` in inline styles in:
- `FullDepartureRow.tsx` — "on time", "+N min", "cancelled" text
- `DepartureRow.tsx` — delay text
- `JourneyView.tsx` — delay status text
- `RhythmView.tsx` — delay/on-time indicators

Replace with `var(--ok-text)`, `var(--warn-text)`, `var(--bad-text)` respectively.

Decorative uses (dot colours, CrowdingStrip bars) are **not changed**.

### sr-only utility

```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```

---

## Section 2 — Focus & Keyboard

**File:** `app/globals.css`, `app/_components/views/PulseView.tsx`

### Focus ring (globals.css)

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}
```

Remove any existing `outline: none` overrides on buttons/inputs (the global reset `button { ... }` must not suppress focus).

### prefers-reduced-motion (globals.css)

```css
@media (prefers-reduced-motion: reduce) {
  .fade-up { animation: none; }
  .skeleton { animation: none; opacity: 0.55; }
  @keyframes pulseDot { 0%, 100% { box-shadow: none; } }
}
```

### Train animation guard (PulseView.tsx)

At the top of the rAF `useEffect`:

```typescript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Skip animation — trains stay at their initial t positions
  return;
}
```

### TabBar (`app/_components/TabBar.tsx`)

- `<nav>` → `<nav aria-label="Main navigation">`
- Wrapping element inside nav → `<div role="tablist">`
- Each `<button>` → add `role="tab"`, `aria-selected={tab === id}`, `aria-controls="main-content"`, `id={`tab-${id}`}`

---

## Section 3 — ARIA Roles & Semantic Structure

### Heading hierarchy

Replace styled `<div>` headings with semantic elements. Styling applied via existing classes (no visual change).

| Location | Element | Level |
|----------|---------|-------|
| RhythmView "Good morning." | `<h1>` | h1 |
| RhythmView "Your commute", "Later today", "Your baseline" | `<h2>` | h2 |
| StationView station name | `<h1>` | h1 |
| JourneyView route headline | `<h1>` | h1 |
| JourneyView "Platform choreography", "Why you're late", "Journey timeline" | `<h2>` | h2 |
| PulseView "Pulse." masthead | `<h1>` | h1 |
| PulseView "Today's weather" | `<h2>` | h2 |

### Landmarks

`app/page.tsx`: wrap the content output in `<main id="main-content" tabIndex={-1}>`.

### TweaksPanel (`app/_components/TweaksPanel.tsx`)

- Panel div → `role="dialog"`, `aria-modal="true"`, `aria-labelledby="tweaks-title"`
- Title div → `id="tweaks-title"`
- Add focus trap: on mount, move focus to first interactive element; Tab/Shift+Tab cycle within panel; Escape calls `onClose`
- On close, return focus to the FAB trigger button (pass `triggerRef` from `page.tsx` or use `document.activeElement` saved on open)

### Segmented controls (`app/_components/TweaksPanel.tsx`)

`Segmented` component:
- Container div → `role="radiogroup"`, `aria-label={label}` (pass label down from TweakRow)
- Each option button → `role="radio"`, `aria-checked={value === v}`

### Accent swatches (`app/_components/TweaksPanel.tsx`)

Each colour button:
- `aria-label={`Accent colour: ${k}`}`
- `aria-pressed={tweaks.accent === k}`

### Icon-only buttons

| Component | Button | aria-label |
|-----------|--------|-----------|
| TweaksPanel | Close | `"Close tweaks"` |
| StationView | Back | `"Back"` (already has "Back" text, add aria-label for clarity; icon gets `aria-hidden`) |
| JourneyView | Back | same |
| StationSearch | Clear input | `"Clear search"` |

### Search input (`app/_components/views/StationView.tsx`)

```tsx
<label htmlFor="station-search" className="sr-only">Search stations</label>
<input id="station-search" ... />
```

### Decorative icon hiding

Add `aria-hidden="true"` to icon instances that appear alongside visible text labels:
- TabBar icons (label text is in the `<span>`)
- Arrow icons in DepartureRow, FullDepartureRow, AnomalyBlock
- Back icon in StationView/JourneyView (alongside "Back" text)

---

## Section 4 — Live Regions & Text Alternatives

### Departure live region

In `RhythmView` and `StationView`, add a visually-hidden live region:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {departures ? `${departures.length} departures loaded` : ''}
</div>
```

### Delay live region

In `YourTrainCard` (RhythmView), wrap the delay status in a live region:

```tsx
<div aria-live="polite" aria-atomic="true" aria-label="Train status">
  {late > 0 ? `${late} minutes late` : 'on time'}
</div>
```

### CrowdingStrip text alternative

Add a visually-hidden summary to the CrowdingStrip component:

```tsx
<span className="sr-only">
  {`Carriage occupancy: ${crowding.map((c, i) =>
    `car ${i + 1} ${c < 0.4 ? 'quiet' : c < 0.75 ? 'moderate' : 'busy'}`
  ).join(', ')}`}
</span>
```

### PlatformDiagram text summary

The card above the diagram already renders the text ("Car 3 is quietest..."). Add `aria-hidden="true"` to the visual diagram so SR reads the prose description instead.

### Sparkline SVG

```tsx
<svg
  aria-label={`Delay trend: ${trendDescription}`}  {/* derive from data, e.g. "improving", "worsening", "stable" */}
  role="img"
  ...
>
```

---

## Files Changed

| File | Changes |
|------|---------|
| `app/globals.css` | Token updates, sr-only, focus-visible, reduced-motion |
| `app/_components/TabBar.tsx` | tablist/tab roles, aria-selected, aria-controls |
| `app/_components/TweaksPanel.tsx` | dialog role, focus trap, radiogroup/radio, aria-labels on swatches, close button label |
| `app/_components/shared/CrowdingStrip.tsx` | sr-only text summary |
| `app/_components/shared/DepartureRow.tsx` | aria-hidden icons, ok/warn/bad-text tokens, aria-label on button |
| `app/_components/shared/FullDepartureRow.tsx` | aria-hidden icons, ok/warn/bad-text tokens, aria-label on button |
| `app/_components/views/RhythmView.tsx` | h1/h2 headings, live region, ok/warn-text tokens, aria-hidden icons |
| `app/_components/views/StationView.tsx` | h1 heading, live region, search label, back button aria-hidden icon |
| `app/_components/views/JourneyView.tsx` | h1/h2 headings, sparkline role, platform diagram aria-hidden, delay live region, ok/warn-text tokens |
| `app/_components/views/PulseView.tsx` | h1/h2 headings, reduced-motion guard on rAF |
| `app/page.tsx` | `<main id="main-content">` wrapper |

---

## Out of Scope

- Skip-navigation link (single-page app with tab bar — not standard for native-app-style PWAs)
- WCAG 2.4.11 / 2.4.12 (focus appearance AAA — requires 2px+ ring with 3:1 contrast perimeter; our accent ring already achieves this)
- Captions/transcripts (no audio/video content)
- Reflow at 320px (app already responsive and tested at mobile widths)
