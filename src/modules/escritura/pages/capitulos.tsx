'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import supabase from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';
import "../styles/capitulos.css";

/**
 * Capitulos - componente completo corregido
 * - Usa `chapter_number` consistentemente (insert/select/mapping)
 * - Más logs y alerts para debug visible
 * - ChipEditor con autocompletado/creación en BD incluido
 * - Two-step load: stories list -> story + chapters
 */

// ---------- Helpers ----------
function normalizeStr(s) { return (s || "").toString().toLowerCase(); }
function addChip(list, value) {
  const v = (value || "").trim();
  if (!v) return list || [];
  const exists = (list || []).some((x) => x.toLowerCase() === v.toLowerCase());
  return exists ? list : [...(list || []), v];
}
function removeChip(list, value) {
  const v = (value || "").toLowerCase();
  return (list || []).filter((x) => x.toLowerCase() !== v);
}

function filterChapters(story, query, onlyPublished, sortBy) {
  const q = (query || "").trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c) => {
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
      arr = [...arr].sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
      break;
    case "title":
      arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }
  return arr;
}

// ---------- DB mapping ----------
function mapStoryRowToLocal(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author_name ?? row.author_id,
    description: row.description ?? '',
    genres: row.genres ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chapters: (row.chapters || []).map((c) => ({
      id: c.id,
      number: c.chapter_number ?? c.number ?? 0, // use chapter_number
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

// ---------- ChipEditor (autocomp + create) ----------
function ChipEditor({
  items = [],
  placeholder,
  onAdd,
  onRemove,
  badgeClass = "",
  ariaLabel = "",
  suggestionType = "tag" // 'tag' or 'genre'
}) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const debRef = useRef(null);
  const containerRef = useRef(null);

  async function fetchSuggestions(q) {
    if (!q || q.trim().length === 0) { setSuggestions([]); return; }
    setLoadingSug(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .ilike('name', `%${q}%`)
        .eq('type', suggestionType)
        .limit(10);
      if (error) throw error;
      setSuggestions((data || []).map(x => x.name));
      setHighlight(-1);
    } catch (err) {
      console.error('fetchSuggestions', err);
      setSuggestions([]);
    } finally { setLoadingSug(false); }
  }

  async function ensureTagExists(name) {
    const n = (name || "").trim();
    if (!n) return null;
    try {
      const { data: found, error: fErr } = await supabase
        .from('tags')
        .select('id,name')
        .ilike('name', n)
        .eq('type', suggestionType)
        .limit(1)
        .maybeSingle();
      if (fErr) throw fErr;
      if (found) return found.name;

      const { data: ins, error: insErr } = await supabase
        .from('tags')
        .insert([{ name: n, type: suggestionType }])
        .select()
        .maybeSingle();
      if (insErr) {
        // race: try read again
        const { data: retry } = await supabase
          .from('tags')
          .select('id,name')
          .ilike('name', n)
          .eq('type', suggestionType)
          .limit(1)
          .maybeSingle();
        return retry?.name ?? n;
      }
      return ins?.name ?? n;
    } catch (err) {
      console.error('ensureTagExists', err);
      return name;
    }
  }

  function commitValue(v) {
    if (!v || !v.trim()) return;
    (async () => {
      const name = await ensureTagExists(v.trim());
      if (name) onAdd(name);
      setValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlight(-1);
    })();
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && suggestions[highlight]) commitValue(suggestions[highlight]);
      else commitValue(value);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlight(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlight(-1);
    }
  }

  function onChange(e) {
    const v = e.target.value;
    setValue(v);
    setShowSuggestions(true);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchSuggestions(v), 180);
  }

  function handlePickSuggestion(name) { commitValue(name); }

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) { setShowSuggestions(false); setHighlight(-1); }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div aria-label={ariaLabel} style={{ position: 'relative' }} ref={containerRef}>
      <div className="chips">
        {items.map((it) => (
          <span key={it} className={`chip ${badgeClass}`}>
            {it}
            <button className="chipRemove" title={`Eliminar ${it}`} onClick={() => onRemove(it)} aria-label={`Eliminar ${it}`}>×</button>
          </span>
        ))}
      </div>

      <input
        className="chipInput"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => { if (value) fetchSuggestions(value); setShowSuggestions(true); }}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
      />

      {showSuggestions && (loadingSug || suggestions.length > 0 || value.trim()) && (
        <div className="chip-suggestions" role="listbox" style={{
          position: 'absolute', zIndex: 50, background: 'var(--card-bg,#0b0b0b)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginTop: 6,
          width: '100%', maxHeight: 220, overflowY: 'auto', padding: '6px'
        }}>
          {loadingSug && <div className="suggestionItem">Buscando...</div>}
          {!loadingSug && suggestions.length === 0 && value.trim() && (<div className="suggestionItem suggestion-empty">Crear «{value.trim()}»</div>)}
          {!loadingSug && suggestions.map((s, idx) => (
            <button key={s} type="button" className={`suggestionItem ${highlight === idx ? 'highlight' : ''}`}
              onMouseDown={(ev) => { ev.preventDefault(); handlePickSuggestion(s); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: highlight === idx ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {s}
            </button>
          ))}
          {!loadingSug && (!suggestions || suggestions.length === 0) && value.trim() && (
            <button type="button" onMouseDown={(ev) => { ev.preventDefault(); handlePickSuggestion(value.trim()); }}
              className="suggestionItem create-new" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              Crear «{value.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- StoryDetail ----------
function StoryDetail({ story, refreshStory }) {
  const [local, setLocal] = useState(() => ({ ...story }));
  const [query, setQuery] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState("num-asc");
  const [showForm, setShowForm] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', summary: '', content: '', isPublished: false });
  const [savingGenres, setSavingGenres] = useState(false);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => setLocal({ ...story }), [story]);

  const stats = useMemo(() => {
    const total = local?.chapters?.length || 0;
    const published = (local?.chapters || []).filter((c) => c.isPublished || c.is_published).length;
    const pct = total ? Math.round((published / total) * 100) : 0;
    return { total, published, pct };
  }, [local]);

  const filtered = useMemo(() => filterChapters(local, query, onlyPublished, sortBy), [local, query, onlyPublished, sortBy]);

  async function persistStoryFields(updates) {
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
    } catch (err) {
      console.error('Error persisting story fields', err);
      alert('No se pudo actualizar la historia (ver consola).');
    }
  }

  function handleAddTag(val) {
    const updated = addChip(local.tags, val);
    setLocal((s) => ({ ...s, tags: updated, updatedAt: new Date().toISOString() }));
    setSavingTags(true);
    persistStoryFields({ tags: updated }).finally(() => setSavingTags(false));
  }
  function handleRemoveTag(val) {
    const updated = removeChip(local.tags, val);
    setLocal((s) => ({ ...s, tags: updated, updatedAt: new Date().toISOString() }));
    setSavingTags(true);
    persistStoryFields({ tags: updated }).finally(() => setSavingTags(false));
  }
  function handleAddGenre(val) {
    const updated = addChip(local.genres, val);
    setLocal((s) => ({ ...s, genres: updated, updatedAt: new Date().toISOString() }));
    setSavingGenres(true);
    persistStoryFields({ genres: updated }).finally(() => setSavingGenres(false));
  }
  function handleRemoveGenre(val) {
    const updated = removeChip(local.genres, val);
    setLocal((s) => ({ ...s, genres: updated, updatedAt: new Date().toISOString() }));
    setSavingGenres(true);
    persistStoryFields({ genres: updated }).finally(() => setSavingGenres(false));
  }

  const handleCreateChapter = async () => {
    const nextNumber = (local.chapters || []).reduce((m, c) => Math.max(m, Number(c.number ?? 0)), 0) + 1;
    if (!newChapter.title.trim()) return alert('El capítulo necesita título.');
    const insert = {
      story_id: local.id,
      chapter_number: nextNumber,              // <-- CORREGIDO: chapter_number
      title: newChapter.title.trim(),
      summary: newChapter.summary || null,
      content: newChapter.content || null,
      is_published: newChapter.isPublished || false,
      published_at: newChapter.isPublished ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      console.log('Insert chapter payload:', insert);
      const { data, error } = await supabase.from('chapters').insert([insert]).select().single();
      if (error) {
        console.error('Insert error:', error);
        alert('Error al crear capítulo: ' + (error.message || JSON.stringify(error)));
        return;
      }
      // map returned row (usar chapter_number que devuelve la BD)
      const newCh = {
        id: data.id,
        number: data.chapter_number ?? data.number,
        chapter_number: data.chapter_number,
        title: data.title,
        summary: data.summary,
        content: data.content,
        isPublished: Boolean(data.is_published),
        is_published: data.is_published,
        publishedAt: data.published_at,
        published_at: data.published_at
      };
      setLocal((s) => ({ ...s, chapters: [...(s.chapters || []), newCh], updatedAt: new Date().toISOString() }));
      setNewChapter({ title: '', summary: '', content: '', isPublished: false });
      setShowForm(false);
      if (typeof refreshStory === 'function') refreshStory();
      // opcional: redirigir al editor del capítulo recién creado si quieres
      // router.push(`/escritura/capitulos/${local.id}/${newCh.id}/editar`);
    } catch (err) {
      console.error('Error creando capítulo', err);
      alert('No se pudo crear el capítulo (ver consola).');
    }
  };

  return (
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{local.title}</h1>
          <p className="subtitle">por <strong>{local.author}</strong></p>
          <div className="badges" aria-label="Géneros y etiquetas">
            {(local.genres || []).map((g) => <span key={g} className="badgeGenre">{g}</span>)}
            {(local.tags || []).map((t) => <span key={t} className="badgeTag">#{t}</span>)}
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
            <ChipEditor items={local.genres} placeholder="Añadir género y Enter" onAdd={handleAddGenre} onRemove={handleRemoveGenre} badgeClass="genreChip" ariaLabel="Editor de géneros" suggestionType="genre" />
          </div>

          <div className="editRow">
            <h3 className="editTitle">Etiquetas {savingTags ? '(guardando...)' : ''}</h3>
            <ChipEditor items={local.tags} placeholder="Añadir etiqueta y Enter" onAdd={handleAddTag} onRemove={handleRemoveTag} badgeClass="tagChip" ariaLabel="Editor de etiquetas" suggestionType="tag" />
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
        <button className="btn create" onClick={() => setShowForm(!showForm)}><Plus /> Nuevo Capítulo</button>
      </section>

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
          <div className="formGroup">
            <label>Contenido:</label>
            <textarea value={newChapter.content} onChange={(e) => setNewChapter({ ...newChapter, content: e.target.value })} placeholder="Escribe el contenido del capítulo aquí..." rows={10} />
          </div>
          <div className="formGroup">
            <label>
              <input type="checkbox" checked={newChapter.isPublished} onChange={(e) => setNewChapter({ ...newChapter, isPublished: e.target.checked })} />
              Publicar inmediatamente
            </label>
          </div>
          <div className="formActions">
            <button className="btn save" onClick={handleCreateChapter}>Crear Capítulo</button>
            <button className="btn cancel" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </motion.div>
      )}

      <section className="chapterGrid">
        {filtered.map((c) => (
          <ChapterCard key={c.id} chapter={c} storyId={local.id} />
        ))}
        {filtered.length === 0 && <div className="empty">Sin resultados para "{query}"</div>}
      </section>
    </main>
  );
}

// ---------- ChapterCard ----------
function ChapterCard({ chapter, storyId }) {
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

// ---------- Wrapper: Capitulos ----------
export default function Capitulos({ storyId: propStoryId } = {}) {
  const [selectedStoryId, setSelectedStoryId] = useState(propStoryId || '');
  const [story, setStory] = useState(null);
  const [storiesList, setStoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

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
      if (mounted) {
        setUserId(s?.data?.session?.user?.id ?? null);
        setAuthReady(true);
      }
    })();

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // load user's stories
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
        alert('Error cargando tus historias (ver consola).');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [authReady, userId]);

  // load story + chapters (two-step)
  useEffect(() => {
    let mounted = true;
    if (!selectedStoryId) return;
    (async () => {
      setLoading(true);
      try {
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('id, title, description, author_id, created_at, updated_at')
          .eq('id', selectedStoryId)
          .maybeSingle();
        if (storyError) throw storyError;
        if (!mounted) return;
        if (!storyData) { setStory(null); setLoading(false); return; }

        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, chapter_number, title, summary, content, is_published, published_at')
          .eq('story_id', selectedStoryId)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;

        const full = { ...storyData, chapters: chaptersData || [] };
        setStory(mapStoryRowToLocal(full));
      } catch (err) {
        console.error('Error cargando historia', err);
        alert('Error cargando la historia (ver consola).');
        setStory(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedStoryId]);

  const refreshStory = async () => {
    if (!selectedStoryId) return;
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('id, title, description, author_id, created_at, updated_at')
        .eq('id', selectedStoryId)
        .maybeSingle();
      if (storyError) throw storyError;
      if (!storyData) { setStory(null); return; }

      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, summary, content, is_published, published_at')
        .eq('story_id', selectedStoryId)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;
      setStory(mapStoryRowToLocal({ ...storyData, chapters: chaptersData || [] }));
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
          {storiesList.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
        </select>
      </div>

      <StoryDetail story={story} refreshStory={refreshStory} />
    </div>
  );
}
