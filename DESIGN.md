# DESIGN.md: Siapa Akan Menguasai Putrajaya?

## Design Read
Reading this as: a single-title political book sales page for Malaysian readers, in a campaign-poster / newspaper front-page language taken from the book jacket, dial `ENERGY 3 / RHYTHM 3 / MOTION 1`.

## Dials
- **ENERGY 3 (Bold):** the H1 is set like an election poster: condensed, uppercase, up to 116px, with one yellow word echoing the cover.
- **RHYTHM 3 (Varied):** surfaces alternate between night navy (cover, videos, footer) and printed paper (synopsis, order, policies), and each section has its own composition: stacked poster hero with a fact strip, sticky heading beside long serif prose, staggered pair of portrait videos, split copy and order form.
- **MOTION 1 (Hover only):** colour changes on hover and a 1px press on buttons. The two videos play when scrolled into view and pause when they leave; both have play/pause and sound buttons, and nothing plays under `prefers-reduced-motion`.

## Tokens (`tailwind.config.mjs`)
| Token | Value | Use |
|---|---|---|
| `navy` | `#09111e` | Night surface, and ink on paper. Sampled from the jacket. |
| `paper` | `#F4F1EA` | Printed-page surface for reading and ordering. |
| `accent` | `#FACC15` | Jacket yellow. Only for: the word "Menguasai" in the H1, buy buttons, the selected delivery zone, focus rings on navy. |
| `on-navy-muted` / `on-navy-faint` | `#cbd5e1` / `#9aa3b2` | Secondary text on navy. |
| `on-paper-muted` / `on-paper-rule` | `#4b5563` / `#7c8392` | Secondary text and inactive tab rules on paper. |

Radius is 0 everywhere (`borderRadius` is overridden in the Tailwind config).

## Verified contrast (WCAG AA)
- White on navy 18.91:1; `#cbd5e1` on navy 12.74:1; `#9aa3b2` on navy 7.43:1
- Yellow on navy 12.35:1; navy on yellow 12.35:1
- Navy on paper 16.76:1; `#4b5563` on paper 6.70:1; `#4b5563` on white 7.56:1
- Error text `#991b1b` on `#fef2f2` passes 4.5:1 (about 8:1)
- Yellow on paper is 1.36:1, so yellow never carries text or focus on paper; `.surface-paper` switches the focus ring to navy.

## Typography (self-hosted via `@fontsource`, no third-party font request)
- **Barlow Condensed 600/800**: headings, prices, buttons. Closest open match to the jacket's condensed title type.
- **Newsreader 400/600**: synopsis and policy text. A reading serif for long Bahasa Melayu prose; it makes those sections feel like printed pages.
- **Barlow 400/500/700**: form, labels, captions. Same family as the display face, so UI text sits quietly beside the headlines.

## Identity motif
Heavy rules (2px/4px) and chapter numerals (01, 02, 03) in the margin, like a newspaper or ballot sheet. These replace the small yellow labels and bordered cards the previous version used. The numerals are `aria-hidden` because the headings carry the meaning.

## One-line decisions (R-31)
- **Why paper sections?** Reading and ordering are calm tasks; dark surfaces stay for the poster and video moments.
- **Why one boxed element?** The order form is the only bordered box, so the eye finds the place to act.
- **Why no stock bar?** There is no live order count; the 200-copy limit is stated as text instead.
- **Why a fact strip under the hero?** Page count, ISBN, publisher and print run are reference facts, so they sit in one row instead of four cards.
- **Why posters on the videos?** Frames extracted from the videos themselves (`public/poster-video-0*.jpg`) so the slot is not black while the 8MB files load.
- **Why a white offset block behind the cover?** It lifts the dark jacket off the dark page without a blur shadow.
