# DESIGN.md: Siapa Akan Menguasai Putrajaya?

Built on **tasteskill 2.5.1** (MIT, github.com/Leonxlnx/taste-skill). Its kit (system.css, system.js, motion,
layout, the two dealt moments) is copied as plain files into `public/assets` and is never edited. The skill's
scripts were run from a local checkout; they are not committed.

## Design Read
Reading this as: a product page for one printed political book, sold to Malaysian readers before PRU 16, in
taste-skill's quiet company-site language with the book jacket's colours, dial `ENERGY 2 / RHYTHM 3 / MOTION 2`.

## The deal (dealt by the skill's scripts, not chosen by taste)
- **Kind:** product (a physical book sold online), `site-kind other`: flat grounds, no effects.
- **Hero:** the owner's own layout (their reference, 18 Nov): the front cover on the left; the label, title
  ("Menguasai" in yellow), subtitle, author, three price facts and two actions on the right, on the jacket's
  navy. It replaces the dealt `photo` hero.
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
| inverse | `#09111e` ground | The hero and the dark footer |

Radius `soft`. Type: Urbanist (the first pairing `start.mjs` dealt), self-hosted with `@fontsource-variable/urbanist`.

## Pictures
| File | What it is |
|---|---|
| `COVER 16 copy 2.jpg`, `COVER 16 BACK copy.png` | The client's cover files (hero, book section) |
| `img/bab-dinding-data.jpg`, `img/bab-peta-meja.jpg`, `img/bab-membaca.jpg` | The owner's images for the three method steps |
| `img/tempah-putrajaya.jpg` | The owner's image of Putrajaya at night, beside the order form |
| `img/soalan-buku.jpg` | The owner's image of the book among readers' questions (questions section) |
| `img/buku-kulit-depan-belakang.jpg` | Generated: back and front cover side by side (nav panel card) |
| `poster-video-0*.jpg` | First frames of the client's videos (posters) |
| `img/buku-terapung.webp` | The client's 3D book mockup, cropped to the book (homepage hero) |
| `img/pejabat-brainwave.svg` | The client's line drawing of a publisher's workspace (homepage About). Not the real office: it stands for the kind of work, books and parcels on a desk |

## Decisions that break a taste-skill rule, on purpose (waived in `.taste-skill/waivers.json`)
- **Phone number, full address with postcode, SSM number:** taste-skill rule 9 forbids them. CHIP Collect
  card-payment activation needs them, and the owner supplied them.
- **Hero:** the owner's layout replaces the dealt hero; taste-skill's hero checks no longer apply to it.
- **Floating book (homepage hero):** `site-kind other` means nothing moves by itself, and the dial is MOTION 2.
  The client asked for the book to float, to draw the eye to the one book on sale. It bobs on a 6 s loop, stops
  for good once the reader scrolls down, and does not move under `prefers-reduced-motion`.

## Standard Book Page (`src/pages/[category]/[book].astro`)
Every Book added in the EmDash admin gets this page, built from its fields. It keeps the deal above: the owner's
cover-left hero on navy, `word-highlight` on the short synopsis, the order form, the rest of the Category's shelf
and the questions answered with the Book's prices. A Book has one picture (its cover), so the cover leads the hero
only, and the Book's details sit beside the order form instead of a second picture. Sections below the hero grow
with their content (`section--grow`), because how much the admin writes varies from Book to Book.

## Policy pages
Legal text reads top to bottom, so the policy pages' one section grows with its text (page CSS
`section.doc-page`) instead of the kit's one-screen sections.
