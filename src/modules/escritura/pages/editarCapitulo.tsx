// src/modules/escritura/pages/capitulos.tsx
'use client';

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';
import "../styles/capitulos.css";
import { stories } from "./storiesData"; // solo para demo/local

// helpers (igual que antes)
function normalizeStr(s: any) {
  return (s || "").toString().toLowerCase();
}

function filterChapters(story: any, query: string, onlyPublished: boolean, sortBy: string) {
  const q = (query || "").trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c: any) => {
    const hit =
      normalizeStr(c.title).includes(q) ||
      normalizeStr(c.summary).includes(q) ||
      (q !== "" && String(c.number) === q);
    return onlyPublished ? hit && c.is_published : hit;
  });

  switch (sortBy) {
    case "num-desc":
      arr = [...arr].sort((a: any, b: any) => b.number - a.number);
      break;
    case "title":
      arr = [...arr].sort((a: any, b: any) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a: any, b: any) => a.number - b.number);
  }
  return arr;
}

function addChip(list: string[] | undefined, value: string) {
  const v = (value || "").trim();
  if (!v) return list || [];
  const exists = (list || []).some((x: string) => x.toLowerCase() === v.toLowerCase());
  return exists ? list : [...(list || []), v];
}
function removeChip(list: string[] | undefined, value: string) {
  const v = (value || "").toLowerCase();
  return (list || []).filter((x: string) => x.toLowerCase() !== v);
}

function mapStoryRowToLocal(row: any) {
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
      number: c.number,
      title: c.title,
      summary: c.summary,
      content: c.content,
      isPublished: Boolean(c.is_published),
      publishedAt: c.published_at,
    })),
  };
}

// -------------------------
// StoryDetail (usa router para crear capítulo)
// -------------------------
function StoryDetail({ story, refreshStory }: { story: any, refreshStory?: () => void }) {
  const router = useRouter();
  const [local, setLocal] = useState(() => ({ ...story }));
  const [query, setQuery] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState("num-asc");
  // dejamos showForm en caso quieras reusar, pero botón irá a la ruta de creación
  const [showForm, setShowForm] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', summary: '', content: '', isPublished: false });
  const [savingGenres, setSavingGenres] = useState(false);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => setLocal({ ...story }), [story]);

  const stats = useMemo(() => {
    const total = local?.chapters?.length || 0;
    const published = (local?.chapters || []).filter((c: any) => c.isPublished).length;
    const pct = total ? Math.round((published / total) * 100) : 0;
    return { total, published, pct };
  }, [local]);

  const filtered = useMemo(() => filterChapters(local, query, onlyPublished, sortBy), [local, query, onlyPublished, sortBy]);

  async function persistStoryFields(updates: any) {
    try {
      const payload = { ...updates, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('stories')
        .update(payload)
        .eq('id', local.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const mapped = mapStoryRowToLocal({ ...data, chapters: local.chapters });
        setLocal(mapped);
        if (typeof refreshStory === 'function') refreshStory();
      }
    } catch (err: any) {
      console.error('Error persisting story fields', err);
      alert('No se pudo actualizar la historia en el servidor. Revisa consola.');
    }
  }

  function handleAddTag(val: string) {
    const updated = addChip(local.tags, val);
    setLocal((s: any) => ({ ...s, tags: updated, updatedAt: new Date().toISOString() }));
    setSavingTags(true);
    persistStoryFields({ tags: updated }).finally(() => setSavingTags(false));
  }
  function handleRemoveTag(val: string) {
    const updated = removeChip(local.tags, val);
    setLocal((s: any) => ({ ...s, tags: updated, updatedAt: new Date().toISOString() }));
    setSavingTags(true);
    persistStoryFields({ tags: updated }).finally(() => setSavingTags(false));
  }
  function handleAddGenre(val: string) {
    const updated = addChip(local.genres, val);
    setLocal((s: any) => ({ ...s, genres: updated, updatedAt: new Date().toISOString() }));
    setSavingGenres(true);
    persistStoryFields({ genres: updated }).finally(() => setSavingGenres(false));
  }
  function handleRemoveGenre(val: string) {
    const updated = removeChip(local.genres, val);
    setLocal((s: any) => ({ ...s, genres: updated, updatedAt: new Date().toISOString() }));
    setSavingGenres(true);
    persistStoryFields({ genres: updated }).finally(() => setSavingGenres(false));
  }

  // Nota: el botón ahora REDIRIJE a la ruta de creación en lugar de abrir el form inline.
  const handleGoCreate = () => {
    router.push(`/escritura/capitulos/${local.id}/new`);
  };

  return (
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{local.title}</h1>
          <p className="subtitle">por <strong>{local.author}</strong></p>
          <div className="badges" aria-label="Géneros y etiquetas">
            {(local.genres || []).map((g: string) => <span key={g} className="badgeGenre">{g}</span>)}
            {(local.tags || []).map((t: string) => <span key={t} className="badgeTag">#{t}</span>)}
          </div>
        </div>
      </header>

      <section className="meta">
        <article className="card">
          <h2>Descripción</h2>
          <p>{local.description}</p>
          <ul className="metaList">
            <li><span>Creado:</span> {new Date(local.createdAt).toLocaleDateString()}</li>
            <li><span>Actualizado:</span> {new Date(local.updatedAt).toLocaleDateString()}</li>
            <li><span>Capítulos:</span> {stats.total}</li>
          </ul>

          <div className="editRow">
            <h3 className="editTitle">Géneros {savingGenres ? '(guardando...)' : ''}</h3>
            <ChipEditor items={local.genres} placeholder="Añadir género y Enter" onAdd={handleAddGenre} onRemove={handleRemoveGenre} badgeClass="genreChip" ariaLabel="Editor de géneros" />
          </div>

          <div className="editRow">
            <h3 className="editTitle">Etiquetas {savingTags ? '(guardando...)' : ''}</h3>
            <ChipEditor items={local.tags} placeholder="Añadir etiqueta y Enter" onAdd={handleAddTag} onRemove={handleRemoveTag} badgeClass="tagChip" ariaLabel="Editor de etiquetas" />
          </div>

          <p className="note">Puedes modificar <strong>géneros</strong> y <strong>etiquetas</strong>. Los cambios se guardan en la base de datos.</p>
        </article>

        <article className="card">
          <h2>Publicación</h2>
          <div className="progressBar" aria-label="Progreso de publicación">
            <div className="progressFill" style={{ width: `${stats.pct}%` }} />
          </div>
          <p className="progressText">{stats.published} publicados de {stats.total} ({stats.pct}%)</p>
        </article>
      </section>

      <section className="toolbar">
        <div className="searchBox">
          <input className="input" placeholder="Buscar por número, título o resumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="searchIcon" aria-hidden>⌕</span>
        </div>
        <label className="switch">
          <input type="checkbox" checked={onlyPublished} onChange={(e) => setOnlyPublished(e.target.checked)} />
          <span>Solo publicados</span>
        </label>
        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Ordenar capítulos">
          <option value="num-asc">Número ↑</option>
          <option value="num-desc">Número ↓</option>
          <option value="title">Título A–Z</option>
        </select>

        {/* <-- CAMBIO: en vez de togglear un formulario inline, redirige a la ruta de edición/creación */}
        <button className="btn create" onClick={handleGoCreate}>
          <Plus /> Nuevo Capítulo
        </button>
      </section>

      {/* Opcional: conservé el formulario inline (se puede eliminar) */}
      {showForm && (
        <motion.div className="formContainer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <h3>Crear Nuevo Capítulo</h3>
          <div className="formGroup">
            <label>Título:</label>
            <input type="text" value={newChapter.title} onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })} placeholder="Ingresa el título del capítulo" />
          </div>
          <div className="formGroup">
            <label>Resumen:</label>
            <textarea value={newChapter.summary} onChange={(e) => setNewChapter({ ...newChapter, summary: e.target.value })} placeholder="Describe brevemente el capítulo" rows={3} />
          </div>
        </motion.div>
      )}

      <section className="chapterGrid">
        {filtered.map((c: any) => (
          <ChapterCard key={c.id} chapter={c} storyId={local.id} />
        ))}
        {filtered.length === 0 && <div className="empty">Sin resultados para "{query}"</div>}
      </section>
    </main>
  );
}

function ChapterCard({ chapter, storyId }: { chapter: any, storyId: string }) {
  return (
    <article className="chapterCard" data-published={chapter.isPublished} tabIndex={0} aria-label={`Capítulo ${chapter.number}: ${chapter.title}`}>
      <div className="chapterHeader">
        <span className="chNumber">#{chapter.number}</span>
        <h3 className="chTitle">{chapter.title}</h3>
        <span className={chapter.isPublished ? "badgeOk" : "badgeDraft"} title={chapter.isPublished ? "Publicado" : "Borrador"}>
          {chapter.isPublished ? "Publicado" : "Borrador"}
        </span>
      </div>
      <p className="chSummary">{chapter.summary}</p>
      <footer className="chFooter">
        {chapter.isPublished ? (
          <time className="date" dateTime={chapter.publishedAt}>
            Publicado el {chapter.publishedAt && new Date(chapter.publishedAt).toLocaleDateString()}
          </time>
        ) : (
          <em className="pending">Pendiente de publicación</em>
        )}
        <Link href={`/escritura/capitulos/${storyId}/${chapter.id}/editar`}>
          <button className="btnGhost">Editar</button>
        </Link>
      </footer>
    </article>
  );
}

// Wrapper que carga la historia desde Supabase (o stories demo)
export default function Capitulos({ storyId: propStoryId }: { storyId?: string } = {}) {
  const [selectedStoryId, setSelectedStoryId] = useState(propStoryId || '');
  const [story, setStory] = useState<any | null>(null);
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const s = await supabase.auth.getSession();
      if (!mounted) return;
      setUserId(s?.data?.session?.user?.id ?? null);
      setAuthReady(true);
    });

    (async () => {
      const s = await supabase.auth.getSession();
      setUserId(s?.data?.session?.user?.id ?? null);
      setAuthReady(true);
    })();

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // cargar historias del usuario
  useEffect(() => {
    let mounted = true;
    if (!authReady) {
      setLoading(false);
      return () => { mounted = false; };
    }
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, title, description, author_id, created_at, updated_at')
          .eq('author_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;
        setStoriesList(data || []);
        if (!selectedStoryId) {
          if (data?.length) setSelectedStoryId(data[0].id);
        }
      } catch (err) {
        console.error('Error cargando historias', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [authReady, userId]);

  // cargar historia + capítulos
  useEffect(() => {
    let mounted = true;
    if (!selectedStoryId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select(`id, title, description, author_id, created_at, updated_at,
                   chapters(id, number, title, summary, content, is_published, published_at)`)
          .eq('id', selectedStoryId)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;
        if (!data) setStory(null);
        else setStory(mapStoryRowToLocal(data));
      } catch (err) {
        console.error('Error cargando historia', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedStoryId]);

  const refreshStory = async () => {
    if (!selectedStoryId) return;
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`id, title, description, author_id, created_at, updated_at,
                 chapters(id, number, title, summary, content, is_published, published_at)`)
        .eq('id', selectedStoryId)
        .maybeSingle();
      if (error) throw error;
      if (data) setStory(mapStoryRowToLocal(data));
    } catch (err) {
      console.error('refresh error', err);
    }
  };

  if (!authReady) return <div className="page">Comprobando autenticación...</div>;
  if (loading) return <div className="page">Cargando...</div>;
  if (!story) return <div className="page">No se encontró la historia seleccionada.</div>;

  return (
    <div>
      <div className="topBar">
        <label className="topLabel">Historia:</label>
        <select className="topSelect" value={selectedStoryId} onChange={(e) => setSelectedStoryId(e.target.value)}>
          {storiesList.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      <StoryDetail story={story} refreshStory={refreshStory} />
    </div>
  );
}

// Chip editor UI (igual)
function ChipEditor({ items = [], placeholder, onAdd, onRemove, badgeClass = "", ariaLabel = "" }: any) {
  const [value, setValue] = useState("");

  function onKeyDown(e: any) {
    if (e.key === "Enter") {
      const v = value.trim();
      if (v) {
        onAdd(v);
        setValue("");
      }
    }
  }

  return (
    <div aria-label={ariaLabel}>
      <div className="chips">
        {items.map((it: string) => (
          <span key={it} className={`chip ${badgeClass}`}>
            {it}
            <button className="chipRemove" title={`Eliminar ${it}`} onClick={() => onRemove(it)} aria-label={`Eliminar ${it}`}>×</button>
          </span>
        ))}
      </div>
      <input className="chipInput" placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKeyDown} />
    </div>
  );
}
