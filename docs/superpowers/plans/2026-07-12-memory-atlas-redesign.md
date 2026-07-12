# Memory Atlas Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Replace the old site with a Vercel-ready travel memory scrollytelling experience.

**Architecture:** A standard Vite React SPA renders one fixed MapLibre map and one independently scrolling story layer. Typed static data drives trips, routes, tickets, and details; pure data helpers are tested separately from browser rendering.

**Tech Stack:** React 19, TypeScript, Vite, MapLibre GL JS, Node test runner, plain CSS.

## Global Constraints

- Do not copy reference source, assets, identity, text, routes, tokens, or brand marks.
- Use one MapLibre instance and one global stylesheet.
- Do not add a backend, authentication, storage, or animation framework.
- Honor keyboard, touch, and reduced-motion requirements.
- Deploy publicly to Vercel.

### Task 1: Static architecture and data contract

**Files:** Replace `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`; create `src/data.ts`, `src/lib/trips.ts`, `tests/trips.test.mjs`; remove Vinext, Sites, worker, database, API, and admin files.

**Interfaces:** `Trip`, `Ticket`, `sortTrips()`, `routeFeature()`, and `routeBounds()`.

- [ ] Write tests proving chronological reversal, GeoJSON construction, and route bounds.
- [ ] Run the tests and confirm they fail because the helpers do not exist.
- [ ] Implement the smallest typed data helpers and three sample trips.
- [ ] Run the tests and confirm they pass.

### Task 2: Fixed map and scrolling chapters

**Files:** Create `src/main.tsx`, `src/App.tsx`, `src/components/MemoryMap.tsx`, `src/styles.css`.

**Interfaces:** `MemoryMap({ trip })` receives the active typed trip; `App` owns order and active trip.

- [ ] Add the fixed map, disabled map gestures, route layer, camera fitting, and update veil.
- [ ] Add the transparent 640px story stream, opening section, segmented sorting, trips, and 60vh transition gaps.
- [ ] Keep all displayed content in `src/data.ts`.

### Task 3: Tickets and notebook detail

**Files:** Create `src/components/Ticket.tsx`, `src/components/Notebook.tsx`; modify `src/App.tsx`, `src/styles.css`.

**Interfaces:** `Ticket({ ticket, onOpen })` reports the selected ticket and source rectangle; `Notebook({ selection, onClose })` owns modal behavior.

- [ ] Build three original ticket visual variants from HTML and CSS.
- [ ] Add rAF pointer tilt with a 4.5 degree ceiling and 300ms return.
- [ ] Add the measured ticket-to-notebook transform, ruled paper, photo grid, Escape/backdrop close, focus movement, and body scroll lock.

### Task 4: Verification and deployment

**Files:** Modify `tests/site.test.mjs`, `README.md` and metadata as needed.

- [ ] Test the built output for title, story copy, map container, dialog labels, and removed starter markers.
- [ ] Run the complete test and production build.
- [ ] Verify the running site at 1440x900 and 390x844, including sorting, chapter changes, ticket opening, Escape close, and reduced motion.
- [ ] Deploy the verified build to Vercel and confirm the public URL returns HTTP 200.
