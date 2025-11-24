// ---------- Helpers ----------
export function normalizeStr(s: string | undefined | null): string {
  return (s || "").toString().toLowerCase();
}

export function addChip(list: string[] | undefined, value: string): string[] {
  const v = (value || "").trim();
  if (!v) return list || [];
  const exists = (list || []).some((x) => x.toLowerCase() === v.toLowerCase());
  return exists ? list : [...(list || []), v];
}

export function removeChip(list: string[] | undefined, value: string): string[] {
  const v = (value || "").toLowerCase();
  return (list || []).filter((x) => x.toLowerCase() !== v);
}

export function filterChapters(
  story: any,
  query: string,
  onlyPublished: boolean,
  sortBy: string
): any[] {
  const q = (query || "").trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c: any) => {
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
      arr = [...arr].sort((a: any, b: any) => (b.number ?? 0) - (a.number ?? 0));
      break;
    case "title":
      arr = [...arr].sort((a: any, b: any) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a: any, b: any) => (a.number ?? 0) - (b.number ?? 0));
  }
  return arr;
}

// ---------- DB mapping ----------
export function mapStoryRowToLocal(row: any): any {
  return {
    id: row.id,
    title: row.title,
    author: row.author_name ?? row.author_id,
    description: row.description ?? '',
    genres: row.genres ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chapters: (row.chapters || []).map((c: any) => ({
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
