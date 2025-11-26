// src/modules/escritura/pages/capitulos.tsx
'use client';

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
// uso el cliente local que subiste para pruebas; en producción usa tu lib habitual
import supabase from "@/lib/supabaseClient";
import { uploadImageUnsigned } from "../../../lib/cloudinaryClient";
import "../styles/capitulos.css";

console.log("cloud:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME, "preset:", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

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

export default function CapitulosPage({ params }: { params?: { id?: string } }) {
  const hookParams = useParams();
  const router = useRouter();

const resolvedStoryId = (() => {
    if (params && params.id) return params.id;
    if (hookParams && typeof hookParams === 'object' && 'id' in hookParams && typeof (hookParams as Record<string, unknown>).id === 'string') return (hookParams as { id: string }).id;
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const idx = parts.lastIndexOf("capitulos");
      if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
      return parts[parts.length - 1];
    }
    return undefined;
  })();

  const storyId = resolvedStoryId;

  interface Story {
    id?: string;
    title?: string;
    description?: string | null;
    author_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    cover_url?: string | null;
    status?: string;
    authorUsername?: string;
    chapters?: ChapterDB[];
  }

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<ChapterDB[]>([]);
  const [query, setQuery] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState<"number" | "title">("number");

  const [genres, setGenres] = useState<TagRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [genreSuggestions, setGenreSuggestions] = useState<TagRow[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagRow[]>([]);
  const suggestionAbortRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploadingCover, setUploadingCover] = useState(false);

  // description editing
  const [editingDescription, setEditingDescription] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  // progress bar ref
  const progressFillRef = useRef<HTMLDivElement | null>(null);

  // ---- control de toggles ----
  const [togglingChapterIds, setTogglingChapterIds] = useState<Set<string>>(new Set());
  const [togglingStory, setTogglingStory] = useState(false);

  const publishedCount = chapters.filter((c) => c.is_published).length;
  const progressPercent = chapters.length ? Math.round((publishedCount / chapters.length) * 100) : 0;

  // actualizar ancho de la barra de progreso sin estilos inline en JSX
  useEffect(() => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${progressPercent}%`;
    }
  }, [progressPercent]);

  useEffect(() => {
    if (!storyId) return;
    loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  // suggestions...
  // move early returns out of useEffect to avoid conditional hook calls
  // use separate useEffect with guard for genreInput
  useEffect(() => {
    if (genreInput.trim() !== "") {
      fetchTagSuggestions(genreInput.trim(), "genre");
    } else {
      setGenreSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreInput]);

  // fetchTagSuggestions function remains unchanged

  // use separate useEffect with guard for tagInput
  useEffect(() => {
    if (tagInput.trim() !== "") {
      fetchTagSuggestions(tagInput.trim(), "tag");
    } else {
      setTagSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagInput]);

  if (!storyId) {
    return (
      <main className="page">
        <header className="hero">
          <div className="heroContent">
            <h1 className="title">Historia</h1>
            <p className="subtitle">ID de historia no encontrado en la ruta.</p>
          </div>
        </header>
      </main>
    );
  }

  async function loadStory() {
    try {
      // Traemos story + chapters **y** el campo status
      const { data, error } = await supabase
        .from("stories")
        .select(
          `
          id,
          title,
          description,
          author_id,
          created_at,
          updated_at,
          cover_url,
          status,
          chapters(
            id,
            story_id,
            chapter_number,
            title,
            content,
            is_published,
            published_at,
            created_at,
            updated_at
          )
        `
        )
        .eq("id", storyId)
        .maybeSingle();

      if (error) throw error;
      const storyData = data;

      // Obtener username/display_name
      let authorUsername = "—";
      try {
        if (storyData?.author_id) {
          const { data: prof, error: pErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", storyData.author_id)
            .maybeSingle();

          if (!pErr && prof) {
            authorUsername =
              prof.username ??
              prof.full_name ??
              prof.name ??
              prof.display_name ??
              prof.email ??
              "—";
          }
        }
      } catch (e) {
        console.warn("Error fetching profile", e);
      }

      setStory({ ...storyData, authorUsername } as Story);

      const chs: ChapterDB[] = (storyData?.chapters || []).map((c: ChapterDB) => ({
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

      // linked tags
      const { data: linked } = await supabase
        .from("story_tags")
        .select("tag_id, tags(id,name,type)")
        .eq("story_id", storyId);

  if (linked) {
    const g: TagRow[] = [];
    const t: TagRow[] = [];
    for (const row of linked) {
      const tag = row.tags ?? row;
      if (!tag) continue;
      // Explicitly cast tag as unknown first then TagRow to suppress TS errors
      const typedTag = tag as unknown as TagRow;
      if (typedTag.type === "genre") g.push(typedTag);
      else t.push(typedTag);
    }
    setGenres(g);
    setTags(t);
  }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error cargando historia", err);
      alert("Error cargando historia: " + errorMsg);
    }
  }

  async function fetchTagSuggestions(q: string, type: "genre" | "tag") {
    if (suggestionAbortRef.current) {
      clearTimeout(suggestionAbortRef.current);
    }
    suggestionAbortRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("tags")
          .select("*")
          .ilike("name", `%${q}%`)
          .eq("type", type)
          .limit(8);

        if (type === "genre") setGenreSuggestions(data || []);
        else setTagSuggestions(data || []);
      } catch (e) {
        console.warn("suggestions err", e);
      }
    }, 220);
  }

  async function handleAddGenreByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (genres.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      setGenreInput("");
      return;
    }

    setGenreInput("");
    const { data: existing } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "genre").limit(1);
    let tagRow: TagRow | null = existing && existing.length > 0 && existing[0] ? existing[0] : null;

    try {
      if (!tagRow) {
        const { data: insData, error: insErr } = await supabase.from("tags").insert([{ name: trimmed, type: "genre" }]).select().single();
        if (insErr) {
          console.warn("create genre err", insErr);
          const { data: re } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "genre").limit(1);
          if (re && re[0]) tagRow = re[0];
        } else {
          tagRow = insData;
        }
      }

      if (tagRow) {
        await supabase.from("story_tags").insert([{ story_id: storyId, tag_id: tagRow.id }]);
        setGenres((prev) => [...prev, tagRow!]);
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
      console.error("handleAddGenreByName error", e);
      alert("Error añadiendo género: " + errorMsg);
    }
  }

  async function handleAddTagByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (tags.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTagInput("");
    const { data: existing } = await supabase.from("tags").select("*").ilike("name", trimmed).eq("type", "tag").limit(1);
    let tagRow: TagRow | null = existing && existing.length > 0 && existing[0] ? existing[0] : null;

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
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
      console.error("handleAddTagByName error", e);
      alert("Error añadiendo etiqueta: " + errorMsg);
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

  // Cloudinary upload handler
  async function handleCoverFileUpload(file: File | null) {
    if (!file || !storyId) return;
    setUploadingCover(true);
    try {
      const res = await uploadImageUnsigned(file);
      // Use type-safe access with Res type if available; otherwise assert cautiously
      const url = (res as { url?: string; secure_url?: string; raw?: { secure_url?: string } }).url 
              || (res as { url?: string; secure_url?: string; raw?: { secure_url?: string } }).secure_url 
              || (res as { url?: string; secure_url?: string; raw?: { secure_url?: string } }).raw?.secure_url;
      if (!url) throw new Error("No se obtuvo URL de Cloudinary");

      const { error } = await supabase.from("stories").update({ cover_url: url }).eq("id", storyId);
      if (error) throw error;

      setStory((s: Story | null) => (s ? { ...s, cover_url: url } : s));
      alert("Portada actualizada");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error subiendo a Cloudinary", err);
      alert("Error subiendo portada: " + errorMsg);
    } finally {
      setUploadingCover(false);
    }
  }


  // manual cover URL
  async function handleCoverUrlChange(newUrl: string) {
    if (!storyId) return;
    setStory((s: Story | null) => (s ? { ...s, cover_url: newUrl } : s));
    try {
      const { error } = await supabase.from("stories").update({ cover_url: newUrl }).eq("id", storyId);
      if (error) console.warn("Error updating cover_url", error);
    } catch (e) {
      console.warn(e);
    }
  }

  // description editing handlers
  function startEditDescription() {
    setDescDraft(story?.description ?? "");
    setEditingDescription(true);
  }
  async function saveDescription() {
    if (!storyId) {
      alert("ID de historia no encontrado.");
      return;
    }
    try {
      const { error } = await supabase.from("stories").update({ description: descDraft, updated_at: new Date().toISOString() }).eq("id", storyId);
      if (error) throw error;
      setStory((s: Story | null) => (s ? { ...s, description: descDraft } : s));
      setEditingDescription(false);
      alert("Descripción actualizada");
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
      console.error("Error guardando descripción", e);
      alert("Error guardando descripción: " + errorMsg);
    }
  }
  function cancelEditDescription() {
    setDescDraft("");
    setEditingDescription(false);
  }

  const filteredChapters = chapters
    .filter((c) => {
      if (onlyPublished && !c.is_published) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return c.title.toLowerCase().includes(q) || (c.content || "").toLowerCase().includes(q) || (c.chapter_number + "").includes(q);
    })
    .sort((a, b) => (sortBy === "number" ? a.chapter_number - b.chapter_number : a.title.localeCompare(b.title)));

  // -------------------------
  // Toggle story published (status)
  // -------------------------
  async function toggleStoryStatus() {
    if (!storyId || !story) return;
    // bloquear UI
    setTogglingStory(true);
    const currentStatus: string = story.status ?? "draft";
    const newStatus = currentStatus === "published" ? "draft" : "published";

    try {
      // preferimos endpoint server para validar autoría
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      let token: string | null = null;
      if (!sessionErr && session?.access_token) token = session.access_token;

      if (token) {
        const res = await fetch(`/api/stories/${storyId}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}), // endpoint puede ignorar body
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          console.warn('toggle story endpoint error, falling back', errJson);
          throw new Error('toggle endpoint error');
        }

        const json: unknown = await res.json().catch(() => ({}));

        function isStoryUpdate(obj: unknown): obj is { story?: Story; data?: Story; updated?: Story; status?: string; updated_at?: string } {
          return typeof obj === 'object' && obj !== null;
        }

        const updated = isStoryUpdate(json) ? json.story ?? json.data ?? json.updated ?? json : null;

        // actualizar story local con lo que venga del server, asegurando tipos
        setStory((s: Story | null) => {
          if (!s) return s;
          if (updated && typeof updated === 'object' && 'status' in updated && 'updated_at' in updated) {
            return { ...s, status: updated.status ?? newStatus, updated_at: updated.updated_at ?? new Date().toISOString() };
          }
          return { ...s, status: newStatus, updated_at: new Date().toISOString() };
        });
        // opcional: si cambias a draft, puedes decidir redirigir fuera de la vista pública; aquí solo actualizamos.
      } else {
        // fallback directo: actualizar tabla stories desde cliente
        throw new Error('No session token');
      }
    } catch (e: unknown) {
      try {
        const { data: updatedRow, error } = await supabase
          .from('stories')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', storyId)
          .select()
          .single();

        if (error) throw error;
        setStory((s: Story | null) => {
          if (!s) return s;
          return { ...s, status: updatedRow?.status ?? newStatus, updated_at: updatedRow?.updated_at ?? new Date().toISOString() };
        });
      } catch (err: unknown) {
        console.error('Error toggling story status', err);
        alert('No se pudo cambiar el estado de la historia. Revisa la consola.');
      }
    } finally {
      setTogglingStory(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="heroContent">
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <h1 className="title" style={{margin:0}}>{story?.title ?? "Historia"}</h1>

            {/* checkbox para togglear estado de la historia */}
            <label
              className={`storyStatusToggle ${togglingStory ? "loading" : ""}`}
            >
              <input
                type="checkbox"
                checked={story?.status === "published"}
                onChange={toggleStoryStatus}
                disabled={togglingStory}
              />
              <span className="storyStatusToggleText">
                {togglingStory ? "Actualizando..." : story?.status === "published" ? "Publicado" : "Borrador"}
              </span>
            </label>

          </div>

          <p className="subtitle">
            por {story?.authorUsername ?? "—"}
          </p>

          <div className="badges">
            {genres.map((g) => (
              <span key={g.id} className="badgeGenre">{g.name}</span>
            ))}
            {tags.map((t) => (
              <span key={t.id} className="badgeTag">#{t.name}</span>
            ))}
          </div>
        </div>
      </header>

      <section className="meta metaSection">
        <article className="card cardArticle">
          <div className="row">
            <h3>Descripción</h3>
            <button className="btnGhost editBtn" title="Editar descripción" onClick={startEditDescription} aria-label="Editar descripción">✎</button>
          </div>
          {!editingDescription ? (
            <>
              <p className="description">{story?.description || "—"}</p>
            </>
          ) : (
            <div className="descEditorWrap">
              <textarea className="textarea" rows={4} value={descDraft} onChange={(e) => setDescDraft(e.target.value)} />
              <div className="descEditorActions">
                <button className="btn create" onClick={saveDescription}>Guardar</button>
                <button className="btn cancel" onClick={cancelEditDescription}>Cancelar</button>
              </div>
            </div>
          )}

          <ul className="metaList">
            <li><span>Creado:</span> {story?.created_at ? new Date(story.created_at).toLocaleDateString() : "—"}</li>
            <li><span>Actualizado:</span> {story?.updated_at ? new Date(story.updated_at).toLocaleDateString() : "—"}</li>
            <li><span>Capítulos:</span> {chapters.length}</li>
          </ul>

          <h4 className="editTitle">Géneros</h4>
          <div className="tagsSection">
            <div className="chipsList">
              {genres.map((g) => (
                <div key={g.id} className="chip genreChip">
                  {g.name}
                  <button className="chipRemove" onClick={() => handleRemoveGenre(g.id)}>×</button>
                </div>
              ))}
            </div>

            <input
              placeholder="Añadir género y Enter"
              className="chipInput"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddGenreByName(genreInput)}
            />

            {genreSuggestions.length > 0 && (
              <div className="suggestionsList">
                {genreSuggestions.map((s) => (
                  <button key={s.id} className="suggestionBtn" onClick={() => handleAddGenreByName(s.name)}>{s.name}</button>
                ))}
              </div>
            )}
          </div>

          <h4 className="editTitle">Etiquetas</h4>
          <div className="tagsSection">
            <div className="chipsList">
              {tags.map((t) => (
                <div key={t.id} className="chip tagChip">
                  #{t.name}
                  <button className="chipRemove" onClick={() => handleRemoveTag(t.id)}>×</button>
                </div>
              ))}
            </div>

            <input
              placeholder="Añadir etiqueta y Enter"
              className="chipInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTagByName(tagInput)}
            />

            {tagSuggestions.length > 0 && (
              <div className="suggestionsList">
                {tagSuggestions.map((s) => (
                  <button key={s.id} className="suggestionBtn" onClick={() => handleAddTagByName(s.name)}>#{s.name}</button>
                ))}
              </div>
            )}
          </div>

          <p className="note">Puedes modificar géneros y etiquetas incluso si hay capítulos publicados.</p>
        </article>

        <aside className="card publicationCard">
          <h4>Publicación</h4>
          <div className="progressBar">
            <div className="progressFill" ref={progressFillRef} />
          </div>
          <div className="progressText">{publishedCount} publicados de {chapters.length} ({progressPercent}%)</div>

          <div className="coverSection">
            <h4 className="coverTitle">Portada</h4>

            {story?.cover_url ? (
              <img src={story.cover_url} alt="cover" className="coverImage" />
            ) : (
              <div className="coverPlaceholder">Sin portada</div>
            )}

            <div className="coverControls">
              <label className="btnGhost">
                {uploadingCover ? "Subiendo..." : "Subir desde dispositivo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverFileUpload(e.target.files?.[0] || null)}
                  hidden
                />
              </label>
            </div>
          </div>
        </aside>
      </section>

      <div className="toolbar">
        <input className="input searchInput" placeholder="Buscar por número, título o resumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="switch">
          <input type="checkbox" checked={onlyPublished} onChange={(e) => setOnlyPublished(e.target.checked)} />
          <span>Solo publicados</span>
        </label>

        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as "number" | "title")}>
          <option value="number">Número ↑</option>
          <option value="title">Título</option>
        </select>

        <button className="btn create" onClick={() => router.push(`/escritura/capitulos/${storyId}/new`)}>+ Nuevo Capítulo</button>
      </div>

      <section className="chapterGrid">
        {filteredChapters.length === 0 && <div className="empty">No hay capítulos</div>}

        {filteredChapters.map((c) => (
          <article key={c.id} className={`chapterCard ${c.is_published ? "published" : "draft"}`}>
            <div className="chapterHeader">
              <div className="chapterInfo">
                <div className="chNumber">#{c.chapter_number}</div>
                <h3 className="chTitle">{c.title}</h3>
              </div>

              <div className="chapterStatus">
                {c.is_published ? <span className="badgeOk">Publicado</span> : <span className="badgeDraft">Borrador</span>}
              </div>
            </div>

            <p className="chSummary">{c.content ? (c.content.length > 240 ? c.content.slice(0, 240) + "..." : c.content) : "Sin resumen"}</p>

            <div className="chFooter">
              <div className="dateOrPending">
                {c.is_published && c.published_at ? <span className="date">Publicado el {new Date(c.published_at).toLocaleDateString()}</span> : <span className="pending">Pendiente de publicación</span>}
              </div>

              <button className="btnGhost" onClick={() => router.push(`/escritura/capitulos/${storyId}/${c.id}/editar`)}>Editar</button>

            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
