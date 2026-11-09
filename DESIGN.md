# DESIGN.md: Siapa Akan Menguasai Putrajaya?

## Design Read
Reading this as: editorial political-analysis book landing page for Malaysian voters, researchers, and policy observers, in an authoritative dark-press typographic language, dial `ENERGY 2 / RHYTHM 3 / MOTION 2`.

## Dials
- **ENERGY: 2 (Balanced)** — Authoritative front-cover presence paired with high-contrast headline typography and disciplined yellow accents that echo the physical book jacket.
- **RHYTHM: 3 (Varied)** — Sections alternate deliberately in structure: asymmetric 2-column book showcase (`Hero`), narrow vertical media spotlight (`ScrollVideo` 01), single-column long-form editorial prose (`Synopsis`), asymmetric 2-tier specification hierarchy (`SpecsGrid`), split editorial + vertical media layout (`ScrollVideo` 02), and focused single-column conversion ledger (`CheckoutCTA`).
- **MOTION: 2 (Viewport-driven)** — Native HTML5 videos play automatically when entering the viewport (`IntersectionObserver`) and pause on exit, with explicit user controls for audio and playback, and full `prefers-reduced-motion: reduce` support.

## Color Palette & Verified Contrast (WCAG AA via `contrast-check.py`)
- **Primary Background (`putrajaya-navy` `#09111e`)**: Sampled directly from the midnight navy jacket of *Siapa Akan Menguasai Putrajaya?*.
- **Elevated Surface (`slate-900` `#0f172a`)**: Separates editorial and checkout containers from the base canvas without heavy drop shadows.
- **Primary Text (`#ffffff`)**: `18.91:1` on `#09111e` (PASS normal & large text).
- **Secondary Editorial Text (`slate-300` `#cbd5e1`)**: `12.74:1` on `#09111e` (PASS normal & large text).
- **Supporting Metadata & Placeholders (`slate-400` `#94a3b8`)**: `7.37:1` on `#09111e` and `6.96:1` on `#0f172a` (PASS normal & large text).
- **Interactive Control Boundaries (`slate-500` `#64748b`)**: `3.97:1` on `#09111e` and `3.75:1` on `#0f172a` (PASS 3:1 non-text contrast).
- **Primary Accent (`yellow-400` `#FACC15` with `slate-950` `#020617` ink)**: `12.35:1` against `#09111e` and `13.17:1` with `#020617` button text (PASS normal & large text).

## One-Line Decisions (R-31)
- **Why this color palette?** It matches the physical front and back cover of *Siapa Akan Menguasai Putrajaya?* (`#09111e` navy ground, `#ffffff` headline type, `#FACC15` editorial yellow accent).
- **Why dark mode by default (R-21)?** The physical book jacket is printed in deep midnight navy (`#09111e`) over the illuminated Putrajaya dome at night, so the dark canvas is the book's literal print identity.
- **Why Inter typography (R-06)?** Inter provides high x-height legibility for dense Bahasa Melayu political prose and tabular numerals (`tabular-nums`) for pricing and page-count metrics.
- **Why asymmetric layout in `SpecsGrid` (R-14)?** The two quantitative book metrics (`430 Muka Surat` and `Terhad 200 Naskhah Terawal`) carry primary typographic scale, while the two qualitative methodology pillars (`Lensa Politik Pasca-Normal` and `Analisis Data & Kajian Lapangan`) sit below as structured editorial rows.
- **Why single-column `max-w-prose` in `Synopsis`?** Long-form back-cover prose reads fastest at 60–70 characters per line with generous line-height.
- **Why shadow on the book cover only (R-12)?** Only the physical 3D book artifact and video frame use elevation shadow to lift off the navy page; data rows and prose sit flat on the surface.
