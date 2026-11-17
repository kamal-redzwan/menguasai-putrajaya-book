# DESIGN.md: Siapa Akan Menguasai Putrajaya?

Built on **tasteskill 2.5.1** (MIT, github.com/Leonxlnx/taste-skill). Its kit (system.css, system.js, motion,
layout, the two dealt moments) is copied as plain files into `public/assets` and is never edited. The skill's
scripts were run from a local checkout; they are not committed.

## Design Read
Reading this as: a product page for one printed political book, sold to Malaysian readers before PRU 16, in
taste-skill's quiet company-site language with the book jacket's colours, dial `ENERGY 2 / RHYTHM 3 / MOTION 2`.

## The deal (dealt by the skill's scripts, not chosen by taste)
- **Kind:** product (a physical book sold online), `site-kind other`: flat grounds, no effects.
- **Hero:** `photo` (`deal.mjs --type product`). With no photographs allowed (the owner's request), the picture
  is a generated chart: the 222 seats of the Dewan Rakyat with the 112 a simple majority needs in yellow. That
  number is the book's question.
- **Nav** `nav-split` · **close** `close-photo`, turned into close-word's head row because the page has no
  photographs (sections.md section 2) · **footer** `footer-dark` · **rhythm** `brand-band` (the yellow video
  section) · **buttons** `pill` · **mark** `stack`.
- **Moments:** `word-highlight` (the synopsis as one statement) and `pinned-chapters` (how the book reads PRU 16,
  three steps). `photo-chapters` was dealt first and dealt again because it needs large photographs.

## Tokens (`start.mjs brand`, the jacket's own colours)
| Token | Value | Use |
|---|---|---|
| `--p-bg` | `#f4f1ea` | Page ground (paper) |
| `--p-ink` / `--p-action` | `#09111e` | Text, primary button (jacket navy) |
| `--p-accent` | `#facc15` | Jacket yellow: the brand band, the primary on the dark footer, the word "formula lama" |
| inverse | `#09111e` ground | The hero chart and the dark footer |

Radius `soft`. Type: Urbanist (the first pairing `start.mjs` dealt), self-hosted with `@fontsource-variable/urbanist`.

## Pictures (no fetched photographs, by request)
| File | What it is |
|---|---|
| `img/hero-dewan-rakyat.jpg` | Generated in Python: the 222-seat hemicycle, 112 seats in yellow |
| `img/buku-kulit-depan-belakang.jpg` | Generated: the client's back and front cover side by side on navy (nav panel card) |
| `COVER 16 copy 2.jpg`, `COVER 16 BACK copy.png` | The client's cover files (the book section) |
| `img/bab-*.jpg`, `img/tempah-buku.jpg`, `img/soalan-penyampai.jpg` | Frames cut from the client's two videos, above the burned-in subtitles |
| `poster-video-0*.jpg` | First frames of the client's videos (posters) |

The videos are 478px wide, so the frames are upscaled 2x and look soft at full size. A real photo shoot of
the book would replace them (see the follow-up report).

## Decisions that break a taste-skill rule, on purpose (waived in `.taste-skill/waivers.json`)
- **Phone number, full address with postcode, SSM number:** taste-skill rule 9 forbids them. CHIP Collect
  card-payment activation needs them, and the owner supplied them.
- **Hero product size:** the checker wants the book across 80% of the hero. The owner asked for no
  photographs; the book is shown whole in the book section instead.

## Policy pages
Legal text reads top to bottom, so the policy pages' one section grows with its text (page CSS
`section.doc-page`) instead of the kit's one-screen sections.
