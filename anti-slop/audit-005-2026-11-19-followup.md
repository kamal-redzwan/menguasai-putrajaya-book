# Report 005 follow-up: fixes (2026-11-19)

The owner approved all five findings from `audit-005-2026-11-19.md`.

| # | Fix |
|---|-----|
| 1 | The hero book floats until the reader first scrolls down, then stops for the rest of the visit, even after scrolling back to the top. Tested in the browser: `running` at the top, `paused` after scrolling and after returning to the top. Open point: a visitor who never scrolls still sees the float for more than 5 s with no pause button, so R-39 is only partly met. |
| 2 | Recorded as a deliberate exception in `DESIGN.md` because the client asked for it. |
| 3 | Alt text is now "Lukisan garis ruang kerja penerbit buku". `DESIGN.md` notes that the drawing shows a publisher's workspace, not the real office. |
| 4 | Removed the drawing's background rect. The shapes that cover lines behind them now use the page colour `#F4F1EA`, so no lighter patches show. |
| 5 | The About text now reads "Buku kami". |
