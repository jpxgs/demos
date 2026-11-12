# Compatibility and testing checklist

## Implementation target

The site is a static HTML/CSS/JavaScript page. It has no framework runtime, tracking dependency, third-party font request, or browser-specific application shell.

The implementation targets current evergreen releases of:

- Windows 10 and Windows 11: Chrome, Edge and Firefox.
- macOS: Safari, Chrome and Firefox.
- iPhone and iPad: Safari and current Chromium-based iOS browsers.
- Android phones and tablets: Chrome and Samsung Internet.
- ChromeOS: Chrome.

This is a compatibility target, not a claim that every historical browser or physical device has been individually certified. Older browsers may not support every CSS enhancement. The layout retains normal document flow and system font fallbacks.

## Responsive behavior

- Desktop: centered reading column with a compact horizontal navigation.
- Tablet and narrow laptop: navigation wraps; content remains within the reading measure.
- Mobile: navigation stacks above the content; show rows and store rows collapse to a single column at narrow widths.
- Very narrow screens: the design reduces gutters and removes multi-column rows to avoid horizontal scrolling.
- Landscape phones: the sticky header is disabled to preserve usable vertical space.
- Print: navigation and search controls are omitted; content remains readable.

## Accessibility and OS preferences

- Semantic landmarks, headings, native links, and native search input.
- Visible keyboard focus indicators.
- Reduced-motion preference disables smooth scrolling and nonessential transitions.
- Forced-colors mode uses system highlight and text colors for key boundaries and focus.
- Text uses system font stacks; no external font download is required.
- Ticket links identify their destination and open with `noopener noreferrer`.
- The page keeps its light visual identity rather than automatically switching to a dark palette. Browser text scaling and high-contrast OS settings remain supported.

## Automated checks

Run with Node.js 18 or newer:

```bash
node --test
```

The tests exercise:
1. Archive search initialization, filtering, result counts and missing-control fallback.
2. Empty show list.
3. Valid future show and ticket link rendering.
4. Schema.org Event JSON-LD generation.
5. Rejection of unsafe ticket URL schemes.
6. Graceful fallback for malformed JSON shape and failed requests.
7. Stable display of the venue's calendar date regardless of the visitor's timezone.
8. Rejection of timestamps without an explicit timezone offset.

## Manual release checklist

Before handing over a release, check the live preview in at least:
- One desktop browser on Windows or macOS.
- Safari on an iPhone or iPad.
- Chrome on an Android phone.

At each viewport, verify:
- No horizontal page scrolling at 320px, 375px, 768px, 1024px and 1440px widths.
- Navigation links reach the correct sections and are not obscured by the sticky header.
- Search filters archive entries and the result count updates.
- Upcoming dates show the empty state when no future dates exist.
- Each confirmed show has the correct local date, venue and direct ticket URL.
- External links open successfully.
- Keyboard focus is visible and the page can be navigated without a mouse.
- Text remains legible at 200% zoom.
- Reduced-motion and forced-colors settings do not hide content.
- Print preview is readable.

## Test limitations

Automated tests run the show-rendering script in a simulated browser environment. They do not validate layout rendering, screen-reader announcements, actual network/CDN behavior, or every device/browser version. A final physical-device pass is still required before calling the site fully cross-device verified.
