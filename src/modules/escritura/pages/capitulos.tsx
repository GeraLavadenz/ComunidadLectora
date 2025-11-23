"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from '../../../lib/supabaseClient'; // AJUSTA si tu path difiere
import "../styles/capitulos.css";

/**
 * Notas:
 * - Asegúrate de tener un bucket de Storage llamado 'covers' o cambia STORAGE_BUCKET.
 * - Si RLS te bloquea insertar/actualizar, revisa las policies en Supabase. Aquí mostramos el error
 *   para que lo veas y puedas corregir la policy o ejecutar desde server.
 */

const STORAGE_BUCKET = "covers"; // cambia si tu bucket se llama distinto

type ChapterDB = {
  id: string;
  story_id: string;
  title: string;
  content: string | null;
  chapter_number: number;
  is_published: boolean;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

type TagRow = {
  id: string;
  name: string;
  type: "tag" | "genre";
};

export default function CapitulosPage({ params }: { params: { id: string } }) {
  const storyId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<any | null>(null);
  const [chapters, setChapters] = useState<ChapterDB[]>([]);
  const [query, setQuery] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState<"number" | "title">("number");

  // Chip editor state
  const [genres, setGenres] = useState<TagRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [genreSuggestions, setGenreSuggestions] = useState<TagRow[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagRow[]>([]);
  const suggestionAbortRef = useRef<number | null>(null);

  // Modal: crear capítulo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterSummary, setNewChapterSummary] = useState("");
  const [newChapterContent, setNewChapterContent] = useState("");
  const [newIsPublished, setNewIsPublished] = useState(false);

  // Cover upload
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  // Fetch story + chapters + genres/tags
  async function loadStory() {
    setLoading(true);
    try {
      // 1) obtener story + chapters
      const { data, error } = await supabase
        .from("stories")
        .select(
          `id,title,description,author_id,created_at,updated_at,cover_url,
           (select full_name, username from profiles where profiles.id = stories.author_id) as author_profile,
           chapters(id, story_id, chapter_number, title, content, is_published, published_at, created_at, updated_at)`
        )
        .eq("id", storyId)
        .single();

      if (error) throw error;
      const storyData = data;

      // author profile handling
      let authorName = "—";
      try {
        if (storyData?.author_profile) {
          // depending on your select alias shape, author_profile may be object or array
          const ap = Array.isArray(storyData.author_profile) ? storyData.author_profile[0] : storyData.author_profile;
          authorName = (ap?.full_name || ap?.username) ?? "—";
        } else if (storyData?.author_id) {
          // fallback: request profiles table separately
          const { data: prof, error: pErr } = await supabase.from("profiles").select("full_name,username").eq("id", storyData.author_id).single();
          if (!pErr && prof) authorName = prof.full_name || prof.username || "—";
        }
      } catch (e) {
        console.warn("no author profile", e);
      }

      setStory({ ...storyData, authorName });

      // map chapters
      const chs: ChapterDB[] = (storyData?.chapters || []).map((c: any) => ({
        id: c.id,
        story_id: c.story_id,
        title: c.title,
        content: c.content ?? "",
        chapter_number: c.chapter_number ?? 0,
        is_published: !!c.is_published,
        published_at: c.published_at ?? null,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
      chs.sort((a, b) => a.chapter_number - b.chapter_number);
      setChapters(chs);

      // fetch linked genres & tags for this story (story_tags join)
      const { data: linked, error: linkedErr } = await supabase
        .from("story_tags")
        .select("tag_id, tags(name,type)")
        .eq("story_id", storyId);

      if (!linkedErr && linked) {
        const g: TagRow[] = [];
        const t: TagRow[] = [];
        for (const row of linked) {
          const tag = row.tags ?? row;
          if (!tag) continue;
          if (tag.type === "genre") g.push(tag);
          else t.push(tag);
        }
        setGenres(g);
        setTags(t);
      } else {
        // si falla esta join, intenta cargar por separado (más robusto)
        const { data: allTags, error: allTagsErr } = await supabase.from("tags").select("*");
        if (!allTagsErr && allTags) {
          // map by story_tags afterwards
          // simple fallback: filter tags by those associated using a manual query
          // but for simplicidad dejamos vacío si falla
        }
      }
    } catch (err: any) {
      console.error("Error cargando historia", err);
      alert("Error cargando historia: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  // SUGERENCIAS (debounced)
  useEffect(() => {
    if (genreInput.trim() === "") {
      setGenreSuggestions([]);
      return;
    }
    const q = genreInput.trim();
    fetchTagSuggestions(q, "genre");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreInput]);

  useEffect(() => {
    if (tagInput.trim() === "") {
      setTagSuggestions([]);
      return;
    }
    const q = tagInput.trim();
    fetchTagSuggestions(q, "tag");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagInput]);

  async function fetchTagSuggestions(q: string, type: "genre" | "tag") {
    // Cancel previous if needed (simple approach)
    if (suggestionAbortRef.current) {
      window.clearTimeout(suggestionAbortRef.current);
    }
    suggestionAbortRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .ilike("name", `%${q}%`)
          .eq("type", type)
          .limit(8);

        if (!error && data) setGenreSuggestions(type === "genre" ? data : genreSuggestions);
        if (!error && data && type === "tag") setTagSuggestions(data);
      } catch (e) {
        console.warn("suggestions err", e);
      }
    }, 220);
  }

  // Añadir género (si no existe, lo crea; luego enlaza via story_tags)
  async function handleAddGenreByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    // ¿ya está en la lista?
    if (genres.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      setGenreInput("");
      return;
    }

    setGenreInput("");
    // buscar en tabla tags
    const { data: existing, error: selErr } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "genre").limit(1);
    let tagRow: TagRow | null = existing && existing[0] ? existing[0] : null;

    try {
      if (!tagRow) {
        // crear
        const { data: insData, error: insErr } = await supabase.from("tags").insert([{ name: trimmed, type: "genre" }]).select().single();
        if (insErr) {
          // si hubo conflicto por unique, intentar reconsultar
          console.warn("create genre err", insErr);
          const { data: re, error: reErr } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "genre").limit(1);
          if (re && re[0]) tagRow = re[0];
        } else {
          tagRow = insData;
        }
      }

      if (tagRow) {
        // enlazar en story_tags (intentar insertar; si ya existe ignora)
        await supabase.from("story_tags").insert([{ story_id: storyId, tag_id: tagRow.id }]);
        setGenres((prev) => [...prev, tagRow!]);
      }
    } catch (e: any) {
      console.error("handleAddGenreByName error", e);
      alert("Error añadiendo género: " + (e?.message ?? JSON.stringify(e)));
    }
  }

  // Añadir tag
  async function handleAddTagByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (tags.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTagInput("");
    const { data: existing, error: selErr } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "tag").limit(1);
    let tagRow: TagRow | null = existing && existing[0] ? existing[0] : null;

    try {
      if (!tagRow) {
        const { data: insData, error: insErr } = await supabase.from("tags").insert([{ name: trimmed, type: "tag" }]).select().single();
        if (insErr) {
          console.warn("create tag err", insErr);
          const { data: re } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "tag").limit(1);
          if (re && re[0]) tagRow = re[0];
        } else {
          tagRow = insData;
        }
      }

      if (tagRow) {
        await supabase.from("story_tags").insert([{ story_id: storyId, tag_id: tagRow.id }]);
        setTags((prev) => [...prev, tagRow!]);
      }
    } catch (e: any) {
      console.error("handleAddTagByName error", e);
      alert("Error añadiendo etiqueta: " + (e?.message ?? JSON.stringify(e)));
    }
  }

  async function handleRemoveGenre(id: string) {
    try {
      await supabase.from("story_tags").delete().match({ story_id: storyId, tag_id: id });
      setGenres((g) => g.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  }
  async function handleRemoveTag(id: string) {
    try {
      await supabase.from("story_tags").delete().match({ story_id: storyId, tag_id: id });
      setTags((g) => g.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  // Crear capítulo (desde modal)
  async function createChapter(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!storyId) return;
    setCreating(true);
    try {
      // calcular chapter_number: siguiente (max + 1)
      const nextNumber = (chapters.reduce((acc, c) => Math.max(acc, c.chapter_number), 0) || 0) + 1;
      const payload = {
        story_id: storyId,
        title: newChapterTitle || `Capítulo ${nextNumber}`,
        content: newChapterContent || "",
        chapter_number: nextNumber,
        is_published: newIsPublished,
      };
      const { data, error } = await supabase.from("chapters").insert([payload]).select().single();

      if (error) {
        console.error("Error creando capítulo ", error);
        alert("Error creando capítulo: " + (error?.message ?? JSON.stringify(error)));
        return;
      }

      // actualizar UI
      const created: ChapterDB = {
        id: data.id,
        story_id: data.story_id,
        title: data.title,
        content: data.content,
        chapter_number: data.chapter_number,
        is_published: !!data.is_published,
        published_at: data.published_at ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setChapters((prev) => [...prev, created].sort((a, b) => a.chapter_number - b.chapter_number));
      setShowCreateModal(false);
      // reset form
      setNewChapterTitle("");
      setNewChapterContent("");
      setNewIsPublished(false);
      alert("Capítulo creado");
    } catch (err: any) {
      console.error("createChapter err", err);
      alert("Error creando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setCreating(false);
    }
  }

  // Subir/cambiar portada
  async function handleCoverFile(file: File | null) {
    if (!file || !storyId) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `story-${storyId}-cover.${ext}`;
      // subir al bucket
      const { data: up, error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type,
      });

      if (upErr) throw upErr;

      const { publicURL } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

      // actualizar stories.cover_url
      const { data: upd, error: updErr } = await supabase.from("stories").update({ cover_url: publicURL }).eq("id", storyId).select().single();
      if (updErr) throw updErr;

      // actualizar UI
      setStory((s: any) => ({ ...s, cover_url: publicURL }));
      alert("Portada actualizada");
    } catch (err: any) {
      console.error("Error subiendo portada", err);
      alert("Error subiendo portada: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setUploadingCover(false);
    }
  }

  // Helpers UI
  const filteredChapters = chapters
    .filter((c) => {
      if (onlyPublished && !c.is_published) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return c.title.toLowerCase().includes(q) || (c.content || "").toLowerCase().includes(q) || (c.chapter_number + "").includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "number") return a.chapter_number - b.chapter_number;
      return a.title.localeCompare(b.title);
    });

  return (
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{story?.title ?? "Historia"}</h1>
          <p className="subtitle">por {story?.authorName ?? "—"}</p>
          <div className="badges" style={{ marginTop: 12 }}>
            {genres.map((g) => (
              <span key={g.id} className="badgeGenre">{g.name}</span>
            ))}
            {tags.map((t) => (
              <span key={t.id} className="badgeTag">#{t.name}</span>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", right: 24, top: 24 }}>
          {/* Cover preview + botón upload */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {story?.cover_url ? (
              <img src={story.cover_url} alt="cover" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid var(--stroke)" }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: 8, background: "linear-gradient(180deg,var(--surface),var(--surface-2))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", border: "1px dashed var(--stroke)" }}>
                Portada
              </div>
            )}
            <div>
              <label className="btnGhost" style={{ display: "inline-block", cursor: "pointer" }}>
                {uploadingCover ? "Subiendo..." : "Cambiar portada"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(ev) => {
                    const f = ev.target.files && ev.target.files[0];
                    handleCoverFile(f || null);
                    ev.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      <section className="meta metaSection">
        <article className="card cardArticle">
          <h3>Descripción</h3>
          <p style={{ color: "var(--muted)" }}>{story?.description}</p>
          <ul className="metaList">
            <li>
              <span>Creado:</span> {story?.created_at ? new Date(story.created_at).toLocaleDateString() : "—"}
            </li>
            <li>
              <span>Actualizado:</span> {story?.updated_at ? new Date(story.updated_at).toLocaleDateString() : "—"}
            </li>
            <li>
              <span>Capítulos:</span> {chapters.length}
            </li>
          </ul>

          <div className="editRow">
            <h4 className="editTitle">Géneros</h4>
            <div className="chips">
              {genres.map((g) => (
                <div className="chip genreChip" key={g.id}>
                  {g.name}
                  <button className="chipRemove" onClick={() => handleRemoveGenre(g.id)}>×</button>
                </div>
              ))}
              <input
                placeholder="Añadir género y Enter"
                className="chipInput"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGenreByName(genreInput);
                  }
                }}
                list="genre-suggestions"
              />
            </div>
            {genreSuggestions.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {genreSuggestions.map((s) => (
                  <button key={s.id} className="btnGhost" onClick={() => handleAddGenreByName(s.name)} style={{ marginRight: 8 }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <h4 className="editTitle">Etiquetas</h4>
            <div className="chips">
              {tags.map((t) => (
                <div className="chip tagChip" key={t.id}>
                  #{t.name}
                  <button className="chipRemove" onClick={() => handleRemoveTag(t.id)}>×</button>
                </div>
              ))}
              <input
                placeholder="Añadir etiqueta y Enter"
                className="chipInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTagByName(tagInput);
                  }
                }}
                list="tag-suggestions"
              />
            </div>
            {tagSuggestions.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {tagSuggestions.map((s) => (
                  <button key={s.id} className="btnGhost" onClick={() => handleAddTagByName(s.name)} style={{ marginRight: 8 }}>
                    #{s.name}
                  </button>
                ))}
              </div>
            )}

            <p className="note">
              Puedes modificar <strong>géneros</strong> y <strong>etiquetas</strong> incluso si hay capítulos publicados. Estos cambios no afectan el estado de publicación de los capítulos.
            </p>
          </div>
        </article>

        <aside className="card">
          <h4>Publicación</h4>
          <div className="progressBar" style={{ marginTop: 8 }}>
            <div
              className="progressFill"
              style={{
                width: `${chapters.length ? Math.round((chapters.filter((c) => c.is_published).length / chapters.length) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="progressText">
            {chapters.filter((c) => c.is_published).length} publicados de {chapters.length} ({chapters.length ? Math.round((chapters.filter((c) => c.is_published).length / chapters.length) * 100) : 0}%)
          </div>
        </aside>
      </section>

      <div className="toolbar">
        <div className="searchBox" style={{ minWidth: 260 }}>
          <input className="input" placeholder="Buscar por número, título o resumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label className="switch">
          <input type="checkbox" checked={onlyPublished} onChange={(e) => setOnlyPublished(e.target.checked)} />
          <span>Solo publicados</span>
        </label>

        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="number">Número ↑</option>
          <option value="title">Título</option>
        </select>

        <div style={{ marginLeft: "auto" }}>
          {/* botón único Nuevo Capítulo en toolbar */}
          <button className="btn create" onClick={() => setShowCreateModal(true)}>+ Nuevo Capítulo</button>
        </div>
      </div>

      <section className="chapterGrid">
        {filteredChapters.length === 0 && <div className="empty">No hay capítulos</div>}
        {filteredChapters.map((c) => (
          <article key={c.id} className="chapterCard" data-published={c.is_published}>
            <div className="chapterHeader">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="chNumber">#{c.chapter_number}</div>
                <div>
                  <h3 className="chTitle">{c.title}</h3>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {c.is_published ? <span className="badgeOk">Publicado</span> : <span className="badgeDraft">Borrador</span>}
              </div>
            </div>

            <p className="chSummary">{c.content ? (c.content.length > 240 ? c.content.slice(0, 240) + "..." : c.content) : "Sin resumen"}</p>

            <div className="chFooter">
              <div>
                {c.is_published && c.published_at ? <div className="date">Publicado el {new Date(c.published_at).toLocaleDateString()}</div> : <div className="pending">Pendiente de publicación</div>}
              </div>
              <div>
                <button className="btnGhost" onClick={() => router.push(`/escritura/capitulos/${storyId}/editar/${c.id}`)}>Editar</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Modal crear capítulo */}
      {showCreateModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1200
        }}>
          <div style={{ width: "min(900px,95%)" }} className="formContainer">
            <h3>Crear Nuevo Capítulo</h3>
            <form onSubmit={createChapter}>
              <div className="formGroup">
                <label>Título</label>
                <input type="text" value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} />
              </div>
              <div className="formGroup">
                <label>Resumen / contenido</label>
                <textarea rows={8} value={newChapterContent} onChange={(e) => setNewChapterContent(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label className="switch">
                  <input type="checkbox" checked={newIsPublished} onChange={(e) => setNewIsPublished(e.target.checked)} />
                  <span>Publicar ahora</span>
                </label>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button type="button" className="btn cancel" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button type="submit" className={`btn create`} disabled={creating}>{creating ? "Creando..." : "Crear capítulo"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
