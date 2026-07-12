# Memory Atlas Redesign

## Goal

Replace the existing site completely with an original travel-memory site that matches the observable layout and interaction language of `liuaaron.com`: a fixed full-screen map, a transparent 640px story stream, scattered ticket artifacts, route-aware chapters, and a notebook detail transition.

The implementation may reproduce public interaction patterns, dimensions, pacing, and spatial behavior. It must not copy the reference site's source, Mapbox token, text, route data, photography, ticket artwork, or personal identity.

## Product scope

The first release is a public, data-driven front end with three realistic sample trips. It does not include the previous admin page, authentication, database, or upload API. Photos, copy, ticket fields, ticket colors, coordinates, and GeoJSON routes live in one typed data file plus `public/memories/`, so they can be replaced without changing component logic.

## Visual design

- A real vector map fills the viewport and never scrolls.
- The document scroll is disabled. A separate full-screen content layer scrolls above the map.
- The story stream is 640px wide on desktop and full width on phones, with no opaque column background.
- The opening uses restrained white sans-serif type and a compact Newest/Oldest segmented control.
- Trips use a header, route-colored metadata, and tickets with different sizes, proportions, colors, textures, and rotations.
- Details appear on warm ruled paper. The selected ticket remains the visual anchor, followed by the title, story, and Polaroid photographs.

## Interaction design

- `IntersectionObserver` chooses the active trip from section headers.
- A single MapLibre map updates camera bounds, route GeoJSON, route color, and map treatment when the active trip changes. A short opacity veil hides the map update.
- The transition gap after every trip is `60vh`, preserving the reference site's breathing room.
- Pointer movement tilts eligible tickets up to 4.5 degrees using `requestAnimationFrame`; release returns in 300ms.
- Selecting a ticket measures its viewport rectangle and animates a visual copy into the notebook with a 450ms `cubic-bezier(.2,.9,.3,1)` transform. The detail view closes by button, Escape, or backdrop.
- Newest/Oldest reverses the trip list and scrolls the story layer to the top.
- Reduced-motion mode disables tilt and uses immediate map/detail state changes.

## Responsive and accessible behavior

- At 760px and below, the stream fills the viewport, tickets may intentionally bleed horizontally, and pointer tilt is disabled.
- The notebook becomes a full-screen scroll surface on phones.
- Ticket actions use buttons, the notebook uses dialog semantics and focus management, and all controls have visible focus states and at least 40px hit areas.
- Map interaction is disabled so scrolling always controls the story.

## Technical design

- Standard Vite + React + TypeScript static application.
- MapLibre GL JS with the public OpenFreeMap Liberty style.
- Plain global CSS, no Tailwind, CSS Modules, animation libraries, or UI kits.
- Pure functions own trip sorting, bounds calculation, and route GeoJSON construction; they are covered by Node tests.
- Vercel serves the generated `dist/` directory.

## Acceptance criteria

- The old split-panel layout and Cloudflare/Sites backend are absent.
- Desktop screenshots at 1440x900 and mobile screenshots at 390x844 match the reference composition and motion hierarchy.
- Map and route change when chapters change.
- Ticket tilt, sorting, keyboard activation, notebook opening/closing, and reduced-motion behavior work.
- `npm test` and `npm run build` pass.
- The deployed production URL returns HTTP 200 without sign-in.
