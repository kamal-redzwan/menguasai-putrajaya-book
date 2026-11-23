// The storefront's view of EmDash: the Categories as the owner names and orders them in the admin, which of them
// have a Book a reader can order, and the Books on a Category's shelf. Every read falls back to what is known
// without the database, so the homepage still renders if EmDash cannot be reached.
import { getEmDashEntry, getEntriesByTerm, getTaxonomyTerms } from "emdash";

export interface Category {
  slug: string;
  label: string;
}

/** Used only when EmDash cannot be read; the live names, slugs and order come from the admin's Categories. */
const FALLBACK_CATEGORIES: Category[] = [
  { slug: "umum-politik", label: "Umum Politik" },
  { slug: "umum-motivasi", label: "Umum Motivasi" },
  { slug: "novel-remaja", label: "Novel Remaja" },
  { slug: "kanak-kanak", label: "Novel Kanak-kanak" },
  { slug: "tokoh-tokoh", label: "Tokoh-tokoh" },
  { slug: "ilmiah", label: "Ilmiah" },
];

/** The Categories as the admin lists them (its sort order, then name). */
export async function getCategories(): Promise<Category[]> {
  try {
    const terms = await getTaxonomyTerms("category", { includeCounts: false });
    if (terms.length > 0) return terms.map((t) => ({ slug: t.slug, label: t.label }));
  } catch (error) {
    console.error("[catalog] could not read the Categories", error);
  }
  return FALLBACK_CATEGORIES;
}

/** Availability values that let a reader place an Order. */
const ORDERABLE = new Set(["Pre-order", "On sale"]);

export const isOrderable = (availability: string): boolean => ORDERABLE.has(availability);

/** Availability as readers see it, in Malay. */
export const AVAILABILITY_LABEL: Record<string, string> = { "Pre-order": "Pra-tempahan", "On sale": "Dijual", "Akan datang": "Akan datang" };

/** Categories known to have an orderable Book when EmDash cannot be read. */
const FALLBACK_ACTIVE = new Set(["umum-politik"]);

export interface ShelfBook {
  slug: string;
  title: string;
  author: string;
  availability: string;
  priceSemenanjung: number;
  priceSabahSarawak: number;
  cover?: { src: string; alt: string; width?: number; height?: number };
  href: string;
}

/** Book Pages built by hand as static pages; other Books will use the standard Book Page. */
const BOOK_PAGES: Record<string, string> = {
  "menguasai-putrajaya": "/umum-politik/menguasai-putrajaya",
};

type CoverValue = { alt?: string; width?: number; height?: number; meta?: { storageKey?: string } };

function toShelfBook(categorySlug: string, entry: { id: string; data: Record<string, unknown> }): ShelfBook {
  const d = entry.data;
  const slug = String(d.slug ?? entry.id);
  const cover = d.cover as CoverValue | undefined;
  return {
    slug,
    title: String(d.title ?? ""),
    author: String(d.author ?? ""),
    availability: String(d.availability ?? ""),
    priceSemenanjung: Number(d.price_semenanjung ?? 0),
    priceSabahSarawak: Number(d.price_sabah_sarawak ?? 0),
    cover: cover?.meta?.storageKey
      ? { src: `/_emdash/api/media/file/${cover.meta.storageKey}`, alt: cover.alt ?? "", width: cover.width, height: cover.height }
      : undefined,
    href: BOOK_PAGES[slug] ?? `/${categorySlug}/${slug}`,
  };
}

/** The Books on one Category's shelf, newest first as EmDash returns them. Empty if EmDash cannot be read. */
export async function getShelf(categorySlug: string): Promise<ShelfBook[]> {
  try {
    const entries = await getEntriesByTerm("books", "category", categorySlug);
    return entries.map((entry) => toShelfBook(categorySlug, entry));
  } catch (error) {
    console.error(`[catalog] could not read the ${categorySlug} shelf`, error);
    return [];
  }
}

/** Everything the standard Book Page shows: the shelf card's facts plus the details only the Book Page has. */
export interface Book extends ShelfBook {
  isbn: string;
  pages?: number;
  synopsis: string;
}

/**
 * One Book as filed under one Category, with the other Books on that shelf. Null when the Book is not published or
 * is not in that Category, so a reader can't reach a Book through a Category it doesn't belong to.
 */
export async function getBookOnShelf(categorySlug: string, bookSlug: string): Promise<{ book: Book; others: ShelfBook[] } | null> {
  let entries: Array<{ id: string; data: Record<string, unknown> }>;
  try {
    entries = await getEntriesByTerm("books", "category", categorySlug);
  } catch (error) {
    console.error(`[catalog] could not read the ${categorySlug} shelf`, error);
    return null;
  }
  const entry = entries.find((e) => String(e.data.slug ?? e.id) === bookSlug);
  if (!entry) return null;
  const pages = Number(entry.data.pages);
  const book: Book = {
    ...toShelfBook(categorySlug, entry),
    isbn: String(entry.data.isbn ?? "").trim(),
    pages: Number.isFinite(pages) && pages > 0 ? pages : undefined,
    synopsis: String(entry.data.synopsis ?? "").trim(),
  };
  const others = entries.filter((e) => e !== entry).map((e) => toShelfBook(categorySlug, e));
  return { book, others };
}

/**
 * The title and prices the checkout charges for a Book, read on the server so a reader cannot change the price in
 * their browser. Null when the Book is not published or cannot be ordered.
 */
export async function getOrderableBook(
  bookSlug: string,
): Promise<{ title: string; priceSemenanjung: number; priceSabahSarawak: number } | null> {
  const { entry, error } = await getEmDashEntry("books", bookSlug);
  if (error) throw error;
  // drafts reach this only in preview or edit mode; an order is only ever for the published Book
  if (!entry || (entry.data.status && entry.data.status !== "published")) return null;
  const d = entry.data;
  const priceSemenanjung = Number(d.price_semenanjung ?? 0);
  const priceSabahSarawak = Number(d.price_sabah_sarawak ?? 0);
  if (!isOrderable(d.availability) || !(priceSemenanjung > 0) || !(priceSabahSarawak > 0)) return null;
  return { title: d.title, priceSemenanjung, priceSabahSarawak };
}

/** The title, author and cover of a published Book, for the order-received page. Null if it can't be read. */
export async function getBookSummary(
  bookSlug: string,
): Promise<{ title: string; author: string; preorder: boolean; cover?: ShelfBook["cover"] } | null> {
  try {
    const { entry } = await getEmDashEntry("books", bookSlug);
    if (!entry || (entry.data.status && entry.data.status !== "published")) return null;
    const { title, author, cover, availability } = toShelfBook("", { id: entry.id, data: entry.data as unknown as Record<string, unknown> });
    return { title, author, cover, preorder: availability === "Pre-order" };
  } catch (error) {
    console.error(`[catalog] could not read the Book ${bookSlug}`, error);
    return null;
  }
}

/** Each Category with whether it is an Upcoming Category (no Book that is Pre-order or On sale). */
export async function getCategoryShelves(): Promise<Array<Category & { upcoming: boolean; count: number }>> {
  const categories = await getCategories();
  return Promise.all(
    categories.map(async (category) => {
      try {
        const entries = await getEntriesByTerm("books", "category", category.slug);
        const orderable = entries.filter((e) => isOrderable(String(e.data.availability ?? "")));
        return { ...category, upcoming: orderable.length === 0, count: orderable.length };
      } catch {
        const active = FALLBACK_ACTIVE.has(category.slug);
        return { ...category, upcoming: !active, count: active ? 1 : 0 };
      }
    }),
  );
}

/** Placeholder Books show on every build except the production branch (Q9: never on the live site). */
declare const __BUILD_BRANCH__: string;
export const SHOW_PLACEHOLDERS = !["master", "main"].includes(__BUILD_BRANCH__);
