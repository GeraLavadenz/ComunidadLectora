// ---------- Types ----------
interface Chapter {
  id: string;
  number?: number;
  chapter_number?: number;
  title: string;
  summary?: string;
  content?: string;
  isPublished?: boolean;
  is_published?: boolean;
  publishedAt?: string;
  published_at?: string;
}

interface Story {
  id: string;
  title: string;
  author: string;
  description?: string;
  genres?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  chapters?: Chapter[];
}

interface ChapterRow {
  id: string;
  chapter_number?: number;
  number?: number;
  title: string;
  summary?: string;
  content?: string;
  is_published?: boolean;
  isPublished?: boolean;
  published_at?: string;
  publishedAt?: string;
}

interface StoryRow {
  id: string;
  title: string;
  author_name?: string;
  author_id?: string;
  description?: string;
  genres?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  chapters?: ChapterRow[];
}

// ---------- Helpers ----------
export function normalizeStr(s: string | undefined | null): string {
  return (s || "").toString().toLowerCase();
}

export function addChip(list: string[] | undefined, value: string): string[] {
  const v = (value || "").trim();
  if (!v) return list ?? [];
  const exists = (list ?? []).some((x) => x.toLowerCase() === v.toLowerCase());
  return exists ? list ?? [] : [...(list ?? []), v];
}

export function removeChip(list: string[] | undefined, value: string): string[] {
  const v = (value || "").toLowerCase();
  return (list || []).filter((x) => x.toLowerCase() !== v);
}

export function filterChapters(
  story: Story,
  query: string,
  onlyPublished: boolean,
  sortBy: string
): Chapter[] {
  const q = (query || "").trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c: Chapter) => {
    const num = c.number ?? 0;
    const isPub = (c.isPublished !== undefined) ? c.isPublished : Boolean(c.is_published);
    const hit =
      normalizeStr(c.title).includes(q) ||
      normalizeStr(c.summary || "").includes(q) ||
      (q !== "" && String(num) === q);
    return onlyPublished ? hit && isPub : hit;
  });

  switch (sortBy) {
    case "num-desc":
      arr = [...arr].sort((a: Chapter, b: Chapter) => (b.number ?? 0) - (a.number ?? 0));
      break;
    case "title":
      arr = [...arr].sort((a: Chapter, b: Chapter) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a: Chapter, b: Chapter) => (a.number ?? 0) - (b.number ?? 0));
  }
  return arr;
}

// ---------- DB mapping ----------
export function mapStoryRowToLocal(row: StoryRow): Story {
  return {
    id: row.id,
    title: row.title,
    author: row.author_name ?? row.author_id ?? '',
    description: row.description ?? '',
    genres: row.genres ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chapters: (row.chapters ?? []).map((c: ChapterRow) => ({
      id: c.id,
      number: c.chapter_number ?? c.number ?? 0,
      chapter_number: c.chapter_number,
      title: c.title,
      summary: c.summary ?? (c.content ? String(c.content).slice(0, 200) : ''),
      content: c.content,
      isPublished: c.is_published !== undefined ? Boolean(c.is_published) : Boolean(c.isPublished),
      is_published: c.is_published,
      publishedAt: c.published_at ?? c.publishedAt,
      published_at: c.published_at
    }))
  };
}
