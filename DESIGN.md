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

## Tokens

All colors, type sizes, spacing, radii and easings live in `src/tokens.css` and are
consumed as custom properties. Neither stylesheet may contain a raw hex color; the
test suite enforces this for the admin.

## Guardrails

- Never add an opaque story column.
- Never replace the real map with a decorative CSS illustration.
- Never make every ticket the same size or style.
- Never animate layout properties.
- Never add generic dashboard or landing-page chrome.
- Never use reference-site personal assets or copy.
- Never size ticket type in `vw`. A ticket's print scales with the ticket, so
  ticket typography is `cqw` against the `.ticket-art` container. Viewport units
  made a 300px ticket render the same 27px title as a 1040px one, which
  overflowed narrow tickets and broke the admin preview.
- Never ship an idle animation whose largest step is below about 1px. Seven such
  keyframe sets once ran forever on every template ticket for no visible effect.
  Motion is either perceptible or absent.

## Private admin

The admin is a warm travel-notebook workspace, not a generic SaaS dashboard. One
palette covers the rail, the editor and the preview frame; depth comes from
lightness steps, never from switching hue.

Layout is a single responsive tree: a topbar carrying the current trip, a trip
rail, a stepped editor, and a live preview. Below 1180px the preview drops away.
Below 860px the rail restacks into a horizontal trip strip and the editor goes
full width — it is the same editor, not a reduced one. Every field, every ticket
and the publish action stay reachable from a phone.

- Canvas: `oklch(95% .018 86)`
- Paper: `oklch(98% .012 86)`
- Sidebar: `oklch(89% .024 82)`
- Ink: `oklch(24% .018 65)`
- Accent: `oklch(57% .13 42)`
- Rail: `oklch(92.5% .021 84)`
- Radius scale: `4px`, `8px`, `14px`, pill only for status dots

Forms use the system CJK sans stack for clarity. Titles use Iowan Old Style with Songti SC fallback to connect the utility surface to the public notebook. Depth comes from background lightness steps and restrained paper shadows. Buttons press to `scale(.96)` and all motion respects reduced-motion settings.

The admin must keep draft and publish separate, show inline validation, preserve a
visible logout path, and never expose secrets to the client bundle. The current
trip is named once, in the topbar — editor sections do not repeat it.
