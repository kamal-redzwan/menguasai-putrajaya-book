#!/usr/bin/env node
// Applies seed/seed.json to a running EmDash site through its REST API: the Book collection and its fields,
// the Category taxonomy and its terms, and the seed's Book entries (with cover uploads). Safe to re-run:
// anything that already exists is left as it is.
//
//   EMDASH_URL=https://<site> EMDASH_TOKEN=<api token> npm run emdash:sync
//   add DRY_RUN=1 to print what would change without writing.
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const base = (process.env.EMDASH_URL ?? "").replace(/\/+$/, "");
const token = process.env.EMDASH_TOKEN ?? "";
const dryRun = process.env.DRY_RUN === "1";
if (!base || !token) {
  console.error("Set EMDASH_URL and EMDASH_TOKEN.");
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL("../seed/seed.json", import.meta.url), "utf8"));

async function api(method, path, body) {
  const headers = { authorization: `Bearer ${token}`, "x-emdash-request": "1", accept: "application/json" };
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}/_emdash/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  if (!res.ok || json?.success === false) {
    throw new Error(`${method} ${path} -> ${res.status} ${json?.error?.code ?? ""} ${json?.error?.message ?? text.slice(0, 300)}`);
  }
  return json?.data ?? json;
}

// List responses come as an array or as { items | collections | taxonomies | terms: [...] }.
const list = (data) => (Array.isArray(data) ? data : Object.values(data ?? {}).find(Array.isArray) ?? []);
const write = async (label, fn) => {
  if (dryRun) {
    console.log(`would ${label}`);
    return undefined;
  }
  const out = await fn();
  console.log(label);
  return out;
};

// 1. Collections and fields
const collections = list(await api("GET", "/schema/collections"));
for (const col of seed.collections ?? []) {
  const { fields = [], ...def } = col;
  if (!collections.some((c) => c.slug === col.slug)) {
    await write(`create collection ${col.slug}`, () => api("POST", "/schema/collections", def));
  }
  const existing = dryRun && !collections.some((c) => c.slug === col.slug)
    ? []
    : list(await api("GET", `/schema/collections/${col.slug}/fields`));
  for (const [i, field] of fields.entries()) {
    if (existing.some((f) => f.slug === field.slug)) continue;
    await write(`add field ${col.slug}.${field.slug}`, () =>
      api("POST", `/schema/collections/${col.slug}/fields`, { validation: null, sortOrder: i, ...field }),
    );
  }
}

// 2. Taxonomies: attach to their collections, then add missing terms
const taxonomies = list(await api("GET", "/taxonomies"));
for (const tax of seed.taxonomies ?? []) {
  const { terms = [], ...def } = tax;
  const found = taxonomies.find((t) => t.name === tax.name);
  if (!found) {
    await write(`create taxonomy ${tax.name}`, () => api("POST", "/taxonomies", def));
  } else {
    const current = found.collections ?? [];
    const wanted = [...new Set([...current, ...(def.collections ?? [])])];
    if (wanted.length !== current.length) {
      await write(`attach taxonomy ${tax.name} to ${wanted.join(", ")}`, () =>
        api("PUT", `/taxonomies/${tax.name}`, { collections: wanted }),
      );
    }
  }
  const existingTerms = found || !dryRun ? list(await api("GET", `/taxonomies/${tax.name}/terms?includeCounts=false`)) : [];
  for (const term of terms) {
    if (existingTerms.some((t) => t.slug === term.slug)) continue;
    await write(`add term ${tax.name}/${term.slug}`, () => api("POST", `/taxonomies/${tax.name}/terms`, term));
  }
}

// 3. Content entries (matched by slug), uploading $media files first
async function resolveMedia(value) {
  if (value && typeof value === "object" && value.$media) {
    const { file, alt } = value.$media;
    if (dryRun) return { id: "(upload)", alt };
    const path = resolve(new URL("..", import.meta.url).pathname, file);
    const form = new FormData();
    form.set("file", new Blob([await readFile(path)], { type: "image/jpeg" }), basename(path));
    form.set("deduplicate", "true");
    if (alt) form.set("alt", alt);
    const media = await api("POST", "/media", form);
    const item = media.item ?? media;
    console.log(`uploaded ${basename(path)}`);
    return { id: item.id, alt };
  }
  return value;
}

for (const [collection, entries] of Object.entries(seed.content ?? {})) {
  const existing = dryRun && !collections.some((c) => c.slug === collection)
    ? []
    : list(await api("GET", `/content/${collection}?limit=100`));
  for (const entry of entries) {
    if (existing.some((e) => e.slug === entry.slug)) {
      console.log(`keep ${collection}/${entry.slug} (exists)`);
      continue;
    }
    const data = {};
    for (const [key, value] of Object.entries(entry.data)) data[key] = await resolveMedia(value);
    const created = await write(`create ${collection}/${entry.slug}`, () =>
      api("POST", `/content/${collection}`, { slug: entry.slug, data, taxonomies: entry.taxonomies }),
    );
    const id = created?.item?.id ?? created?.id;
    if (id && (entry.status ?? "published") === "published") {
      await write(`publish ${collection}/${entry.slug}`, () => api("POST", `/content/${collection}/${id}/publish`, {}));
    }
  }
}

console.log(dryRun ? "dry run done" : "sync done");
