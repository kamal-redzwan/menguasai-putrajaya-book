# Cloudflare preview builds

Every pushed branch other than `master` deploys as a Preview of the `menguasai-putrajaya-book` Worker.

## Where preview bindings come from
- `wrangler.json`, under `previews`: the preview D1 database and R2 bucket. `kv_namespaces` is empty because the
  site uses no KV.
- **Previews Base** in the dashboard (Worker → Settings → Bindings and Runtime variables, the Previews Base tab):
  bindings every new Preview starts from. An empty list in `wrangler.json` does not remove what is set there.
- Each Preview keeps the bindings it was created with, even after the Previews Base changes.

## "KV namespace ... not found" (code 10041)
On 2026-11-19 every preview build failed this way. The old `ORDERS_DB` KV namespace
(`d4429bc03d3440e1b76fe205d45d3c66`) had been deleted, but its binding was still in the Previews Base and in the
branch's Preview. Fix:
1. Delete the stale binding from the Previews Base.
2. Delete the branch's Preview (switch the branch picker to it → Settings → General → Delete).
3. Push to the branch. The new build creates a fresh Preview from the clean base.

`staging` and `staging-claude` were created before step 1. If their builds fail the same way, repeat step 2 for them.
