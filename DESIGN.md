# Design system: Waypoints

## Theme

Quiet cartographic cinema. The full-screen map is the environmental surface; tickets are physical evidence floating above it. The page has no conventional cards, navigation bar, or opaque content panel.

## Palette

- Night map: `oklch(15% 0.01 255)`
- Primary text: `oklch(94% 0.006 255)`
- Muted text: `oklch(75% 0.008 255 / .68)`
- Route coral: `oklch(65% 0.16 40)`
- Route blue: `oklch(55% 0.14 240)`
- Paper: `oklch(96% 0.018 85)`
- Ink: `oklch(25% 0.015 70)`

## Typography

The map overlay uses Inter because matching the supplied reference takes precedence over the default font preference. Notebook copy uses Georgia with Songti SC fallback. Headings use weight 750 to 800; body uses 400 with relaxed line height.

## Layout and depth

The map is fixed at inset zero. The story stream is 640px and transparent. Depth comes from map dimming, ticket shadows, small physical rotations, and the notebook backdrop, not rounded containers.

## Motion

Tickets tilt up to 4.5 degrees and return in 300ms ease-out. Map updates use a short opacity veil. Notebook entry uses 450ms `cubic-bezier(.2,.9,.3,1)`. Reduced motion removes spatial transitions.

## Responsive behavior

Below 760px, the story stream is full width, ticket overflow remains intentional, tilt is disabled, and the notebook fills the viewport with safe-area padding.

## Guardrails

- Never add an opaque story column.
- Never replace the real map with a decorative CSS illustration.
- Never make every ticket the same size or style.
- Never animate layout properties.
- Never add generic dashboard or landing-page chrome.
- Never use reference-site personal assets or copy.
