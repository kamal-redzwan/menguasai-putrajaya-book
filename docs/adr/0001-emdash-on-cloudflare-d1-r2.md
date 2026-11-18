# EmDash on Cloudflare D1 and R2, so pages can render on request

The site is growing from one book's page into a storefront whose Books and Categories are edited by the owner
without a developer. We chose EmDash (an Astro-native CMS) on the existing Cloudflare Worker, with D1 for content
and R2 for uploaded covers, over a separate Node.js server with SQLite or staying a static site with content in
code. This keeps one deploy, but the site stops being purely static: the storefront pages that read EmDash render
on request and depend on the D1 and R2 bindings, which preview builds must point at resources that already exist.
