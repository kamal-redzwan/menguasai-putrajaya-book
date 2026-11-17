# Audit 003 follow-up: fixes applied (2026-11-17)

Owner approved: all findings 1 to 13, with the campaign-poster direction. Branch: `staging-claude`.

| # | Finding | Status | What changed |
|---|---|---|---|
| 1 | Fake quota bar and visible `[DATA SEBENAR]` | Fixed | Bar removed. The limit is stated as text in the hero and order section. |
| 2 | Yellow used 113 times | Fixed | Yellow now only on the H1 word, buy buttons, selected zone and focus rings on navy. |
| 3 | Uppercase label above every heading | Fixed | All removed. Sections use chapter numerals (01 to 03) and the heading itself. |
| 4 | Nested bordered boxes | Fixed | Only the order form is boxed. Everything else uses rules and spacing. |
| 5 | Inter does not match the book | Fixed | Barlow Condensed, Newsreader and Barlow, self-hosted. |
| 6 | Title repeated, buy button below the fold on mobile | Fixed | Hero label removed. On mobile the title, prices and button come before the cover. |
| 7 | Prices x5, SSM number x16 | Fixed | Prices in the hero and the order form only. SSM shown in the payment note, footer and policy header. |
| 8 | "Empat Tunjang" heading does not match its content | Fixed | `SpecsGrid` deleted. Book facts moved to a strip under the hero; the two method items moved into the synopsis. |
| 9 | Video sections with large empty areas | Fixed | One "Tonton" section with the two videos side by side (staggered on desktop). |
| 10 | Redundant video labels | Fixed | Label removed; buttons say "Buka suara" / "Tutup suara"; clicking the video no longer silently toggles sound. |
| 11 | Mixed radius, button casing, 10px text | Fixed | Radius 0 everywhere, one button style, smallest text 14px. |
| 12 | Policy pages repeat the footer | Fixed | In-page contact box removed; policy pages now use `BaseLayout` and a shared `.doc` style. |
| 13 | No video poster | Fixed | Posters extracted from each video with ffmpeg. Videos not re-encoded. |

Structural changes: new `src/layouts/BaseLayout.astro` (head, skip link, header, footer, global CSS) replaces six copies of the same `<head>` and inline styles. New `SiteHeader.astro`, `VideoSection.astro`, `src/styles/global.css`. CHIP checkout request logic in `CheckoutCTA.astro` unchanged apart from status and selected-card class names.

## Delivery Gate

### Block 1: Hard Gate
- R-02 PASS: `grep -rn "—\|&mdash;" src` returns nothing.
- R-03 PASS: scrollWidth minus viewport is 0 on `/`, `/polisi-penghantaran/` and `/berjaya/` at 390px and 1440px. Every visible control is at least 44px tall (the only exception found is the skip link while hidden).
- R-17 / R-36 / R-38 PASS: the stock bar is gone. Every remaining number (430 pages, ISBN, 200 copies, prices, delivery days) came from the owner in earlier sessions.
- R-18 / R-28 PASS: no testimonials and no FAQ.
- R-23 PASS: no new logo or images; video posters are frames from the owner's videos.
- R-24 / R-26 PASS: nav links `#sinopsis`, `#tonton`, `#tempahan` all exist; policy, `tel:` and `mailto:` links resolve (checked on the built site).
- R-25 PASS: contrast pairs listed in `DESIGN.md`; yellow never carries text or focus on paper.
- R-27 PASS: the form shows an error state for missing fields, a loading message while contacting CHIP, and an error message if the API cannot be reached.
- R-32 PASS: Tab reaches the skip link, then the logo, with a 3px yellow outline; the focus ring switches to navy on paper sections. Esc closes the mobile menu and returns focus to the button.
- R-33 PASS: no patch scripts.
- R-34 PASS: single fixed theme (no toggle shipped); both surfaces checked.
- R-35 PASS (Playwright, 390px, built site served statically):
  - Menu button: opens the menu; Esc closes it; tapping "Sinopsis" scrolls to `#sinopsis` and closes the menu.
  - Delivery zone and quantity: choosing Sabah & Sarawak with quantity 3 shows a total of RM210.00, the button reads "Bayar RM210.00" and the card turns yellow.
  - Empty form submit: shows the validation message.
  - Filled form submit: shows the connection error. This is expected, because the static server has no `/api/checkout`; the live Cloudflare build is where the payment redirect can be tested.
  - Video: autoplays muted when scrolled into view; the pause button pauses it and its label changes to "Mainkan video"; the sound button unmutes it, shows "Tutup suara" and keeps it playing.
  - Policy tab "Pemulangan": opens `/polisi-pemulangan/`.
  - All four policy pages and `/berjaya/` return 200, each with one h1.
  - Console: no errors apart from the expected 501 for the POST.
- R-39 PASS: `lang="ms"`, unique titles, header/nav/main/footer landmarks, one h1 per page, labelled fields, icon buttons have `aria-label`, `cursor: pointer` set in the base CSS.
- R-40 PASS: the cover is an `<img>` with width/height and `fetchpriority="high"`, not lazy; videos have width/height and posters; fonts are self-hosted, so no third-party render-blocking request. Performance not measured.

### Block 2: Purpose-Gate
- R-01 / R-29 PASS: navy, paper and one yellow accent, all from the jacket.
- R-06 PASS: typefaces chosen to match the jacket and for long-form reading; no tracked uppercase labels.
- R-08 / R-09 / R-13 PASS: no arrows, badges or glow.
- R-12 PASS: one flat offset block behind the cover; no blur shadows.
- R-14 PASS: no card grids.
- R-19 PASS: matches MOTION 1 (hover colour changes and press only); the videos play on scroll and have play/pause buttons.

### Block 3: Liveliness
PASS: dials declared in `DESIGN.md` as ENERGY 3 / RHYTHM 3 / MOTION 1. The H1 is the focal point; the identity motif is the rules plus chapter numerals; yellow is the one accent.

### Block 4: Craftsmanship and Quality Locks
- C-3 PASS: four content sections (cover, synopsis, videos, order), each from real content.
- R-05 PASS: no template layout; each section has its own composition.
- R-11 PASS: radius 0 everywhere.
- R-15 / R-16 PASS: CTAs "Tempah naskhah anda" and "Bayar RM56.00"; no buzzwords.
- R-20 / R-30 PASS: identity comes from the jacket; no cloned product.
- R-31 PASS: decisions written in `DESIGN.md`.
