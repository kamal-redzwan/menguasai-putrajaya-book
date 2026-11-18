// The storefront's view of EmDash: the Categories in their shelf order, which of them have a Book a reader can
// order, and the Books on a Category's shelf. Every read falls back to what is known without the database, so the
// homepage still renders if EmDash cannot be reached.
import { getEntriesByTerm } from "emdash";

export interface Category {
  slug: string;
  label: string;
}

/** The six Categories, in the order the owner listed them (GLOSSARY.md, Category). */
export const CATEGORIES: Category[] = [
  { slug: "umum-politik", label: "Umum Politik" },
  { slug: "umum-motivasi", label: "Umum Motivasi" },
  { slug: "buku-novel-remaja", label: "Buku Novel Remaja" },
  { slug: "buku-novel-kanak-kanak", label: "Buku Novel Kanak-kanak" },
  { slug: "buku-tokoh-tokoh", label: "Buku Tokoh-tokoh" },
  { slug: "buku-ilmiah", label: "Buku Ilmiah" },
];

/** Availability values that let a reader place an Order. */
const ORDERABLE = new Set(["Pre-order", "On sale"]);

/** Categories known to have an orderable Book when EmDash cannot be read. */
const FALLBACK_ACTIVE = new Set(["umum-politik"]);

export interface ShelfBook {
  slug: string;
  title: string;
  author: string;
  availability: string;
  priceSemenanjung: number;
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

/** Each Category with whether it is an Upcoming Category (no Book that is Pre-order or On sale). */
export async function getCategoryShelves(): Promise<Array<Category & { upcoming: boolean; count: number }>> {
  return Promise.all(
    CATEGORIES.map(async (category) => {
      try {
        const entries = await getEntriesByTerm("books", "category", category.slug);
        const orderable = entries.filter((e) => ORDERABLE.has(String(e.data.availability ?? "")));
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
