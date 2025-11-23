'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabaseClient';
import { Plus, X } from 'lucide-react';
import '../styles/capitulos.css';

// ----------------
// Helpers
// ----------------
function normalizeStr(s?: string) {
  return (s || '').toString().toLowerCase();
}

function filterChapters(story, query, onlyPublished, sortBy) {
  const q = (query || '').trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c) => {
    const hit =
      normalizeStr(c.title).includes(q) ||
      normalizeStr(c.summary).includes(q) ||
      (q !== '' && String(c.number) === q);
    return onlyPublished ? hit && c.isPublished : hit;
  });

  switch (sortBy) {
    case 'num-desc':
      arr = [...arr].sort((a, b) => b.number - a.number);
      break;
    case 'title':
      arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a, b) => a.number - b.number);
  }
  return arr;
}

// ----------------
// DB helpers (tags/genres + relationships)
// ----------------
async function getOrCreateTag(name: string, type: 'genre' | 'tag') {
  const clean = name.trim();
  if (!clean) throw new Error('Empty tag name');

  // try find
  const { data: existing, error: selErr } = await supabase
    .from('tags')
    .select('id')
    .eq('name', clean)
    .eq('type', type)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing.id;

  // create
  const { data: created, error: insErr } = await supabase
    .from('tags')
    .insert({ name: clean, type })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return created.id;
}

async function linkStoryTag(storyId: string, tagId: string) {
  // verify exists
  const { data: existing, error: selErr } = await supabase
    .from('story_tags')
    .select('story_id,tag_id')
    .eq('story_id', storyId)
    .eq('tag_id', tagId)
    .limit(1);

  if (selErr) throw selErr;
  if (existing && existing.length > 0) return;

  const { error: insErr } = await supabase.from('story_tags').insert({ story_id: storyId, tag_id: tagId });
  if (insErr) throw insErr;
}

// fetch suggestions for a given typed prefix and type
async function fetchTagSuggestions(prefix: string, type: 'genre' | 'tag') {
  if (!prefix || prefix.trim().length < 1) return [];
  const q = prefix.trim();
  const { data, error } = await supabase
    .from('tags')
    .select('id,name')
    .ilike('name', `${q}%`)
    .eq('type', type)
    .limit(10)
    .order('name', { ascending: true });

  if (error) {
    console.error('fetchTagSuggestions error', error);
    return [];
  }
  return data || [];
}

// ----------------
// Mapping DB -> local model
// ----------------
function mapStoryRowToLocal(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author_name ?? row.author_id,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // chapters could have chapter_number column in your schema
    chapters: (row.chapters || []).map((c) => ({
      id: c.id,
      number: c.number ?? c.chapter_number ?? 0,
      title: c.title,
      summary: c.summary,
      content: c.content,
      isPublished: Boolean(c.is_published),
      publishedAt: c.published_at,
    })),
  };
}

// ----------------
// UI components: ChipEditor with suggestions + create-if-not-exist behaviour
// ----------------
function ChipEditorWithSuggestions({
  items = [],
  placeholder,
  onAdd /* async (val) => {} */,
  onRemove,
  badgeClass = '',
  ariaLabel = '',
  type = 'tag', // 'tag' or 'genre'
  storyId,
}) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!value.trim()) {
      setSuggestions([]);
      return undefined;
    }
    (async () => {
      setLoadingSuggestions(true);
      const s = await fetchTagSuggestions(value, type);
      if (!mounted) return;
      setSuggestions(s || []);
      setLoadingSuggestions(false);
    })();

    return () => {
      mounted = false;
    };
  }, [value, type]);

  async function commit(val) {
    const v = (val || value || '').trim();
    if (!v) return;
    setValue('');
    setSuggestions([]);
    try {
      // If parent wants to handle persistence, call it (it should create tag if needed and link)
      await onAdd(v);
    } catch (err) {
      console.error('Chip add error', err);
      alert('No se pudo agregar la etiqueta/género (revisa consola).');
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setValue('');
      setSuggestions([]);
    }
  }

  return (
    <div aria-label={ariaLabel} style={{ position: 'relative' }}>
      <div className="chips">
        {items.map((it) => (
          <span key={it} className={`chip ${badgeClass}`}>
            {it}
            <button className="chipRemove" title={`Eliminar ${it}`} onClick={() => onRemove(it)} aria-label={`Eliminar ${it}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        className="chipInput"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
      />

      {loadingSuggestions && <div className="suggestions">Buscando...</div>}

      {suggestions.length > 0 && (
        <div className="suggestions" role="listbox">
          {suggestions.map((s) => (
            <button
              key={s.id}
              className="suggestionItem"
              onMouseDown={(e) => {
                // mouseDown to avoid losing focus before click in some browsers
                e.preventDefault();
                commit(s.name);
              }}
            >
              {s.name}
            </button>
          ))}
          <div className="suggestionFooter">Presiona Enter para crear: “{value}”</div>
        </div>
      )}
    </div>
  );
}

// ----------------
// CreateChapterModal
// ----------------
function CreateChapterModal({ open, onClose, story, onCreated }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSummary('');
      setContent('');
      setIsPublished(false);
      setSaving(false);
    }
  }, [open]);

  async function handleCreate() {
    if (!story) return alert('No story selected');
    const nextNumber = (story.chapters || []).reduce((m, c) => Math.max(m, c.number), 0) + 1;
    if (!title.trim()) return alert('El capítulo necesita título.');

    const payload = {
      story_id: story.id,
      chapter_number: nextNumber,
      title: title.trim(),
      summary: summary || null,
      content: content || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const { data, error } = await supabase.from('chapters').insert([payload]).select().single();
      if (error) throw error;

      const newCh = {
        id: data.id,
        number: data.chapter_number ?? data.number ?? nextNumber,
        title: data.title,
        summary: data.summary,
        content: data.content,
        isPublished: Boolean(data.is_published),
        publishedAt: data.published_at,
      };

      onCreated && onCreated(newCh);
      onClose();
      // navigate to edit page (if you want)
      // router.push(`/escritura/capitulos/${story.id}/${data.id}/editar`);
    } catch (err) {
      console.error('Create chapter error', err);
      alert('No se pudo crear el capítulo. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <motion.div className="modalCard" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="modalHeader">
          <h3>Crear nuevo capítulo</h3>
          <button className="btnIcon" onClick={onClose} title="Cerrar"><X /></button>
        </div>

        <div className="modalBody">
          <div className="formGroup">
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="formGroup">
            <label>Resumen</label>
            <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="formGroup">
            <label>Contenido (opcional)</label>
            <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="formGroup">
            <label className="switch">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <span>Publicar inmediatamente</span>
            </label>
          </div>
        </div>

        <div className="modalFooter">
          <button className="btn" onClick={handleCreate} disabled={saving}>{saving ? 'Creando...' : 'Crear capítulo'}</button>
          <button className="btnGhost" onClick={onClose}>Cancelar</button>
        </div>
      </motion.div>
    </div>
  );
}

// ----------------
// ChapterCard
// ----------------
function ChapterCard({ chapter, storyId }) {
  return (
    <article className="chapterCard" data-published={chapter.isPublished}>
      <div className="chapterHeader">
        <span className="chNumber">#{chapter.number}</span>
        <h3 className="chTitle">{chapter.title}</h3>
        <span className={chapter.isPublished ? 'badgeOk' : 'badgeDraft'}>
          {chapter.isPublished ? 'Publicado' : 'Borrador'}
        </span>
      </div>
      <p className="chSummary">{chapter.summary}</p>
      <footer className="chFooter">
        {chapter.isPublished ? (
          <time className="date" dateTime={chapter.publishedAt}>
            Publicado el {chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString() : '—'}
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

// ----------------
// Main Capitulos component
// ----------------
export default function Capitulos({ storyId: propStoryId } = {}) {
  const router = useRouter();
  const [selectedStoryId, setSelectedStoryId] = useState(propStoryId || '');
  const [story, setStory] = useState(null);
  const [storiesList, setStoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  // local UI states
  const [query, setQuery] = useState('');
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState('num-asc');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // auth init
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

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
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
          .select('id,title,description,author_id,created_at,updated_at')
          .eq('author_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;
        setStoriesList(data || []);
        if (!selectedStoryId && data?.length) setSelectedStoryId(data[0].id);
      } catch (err) {
        console.error('Error cargando historias', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [authReady, userId]);

  // load story + chapters when selectedStoryId changes
  useEffect(() => {
    let mounted = true;
    if (!selectedStoryId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select(`
            id, title, description, author_id, created_at, updated_at,
            chapters(id, chapter_number, title, summary, content, is_published, published_at)
          `)
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
        .select(`
          id, title, description, author_id, created_at, updated_at,
          chapters(id, chapter_number, title, summary, content, is_published, published_at)
        `)
        .eq('id', selectedStoryId)
        .maybeSingle();

      if (error) throw error;
      if (data) setStory(mapStoryRowToLocal(data));
    } catch (err) {
      console.error('refresh error', err);
    }
  };

  const stats = useMemo(() => {
    const total = story?.chapters?.length || 0;
    const published = (story?.chapters || []).filter((c) => c.isPublished).length;
    const pct = total ? Math.round((published / total) * 100) : 0;
    return { total, published, pct };
  }, [story]);

  const filtered = useMemo(() => filterChapters(story, query, onlyPublished, sortBy), [story, query, onlyPublished, sortBy]);

  // handlers for tags/genres: call DB helpers and refresh display
  async function handleAddGenre(val) {
    if (!story) return;
    try {
      const tagId = await getOrCreateTag(val, 'genre');
      await linkStoryTag(story.id, tagId);
      // reload local display of tags/genres by re-fetching tags for this story
      await refreshStory();
    } catch (err) {
      console.error('Error handleAddGenre', err);
      alert('No se pudo agregar el género (ver consola).');
    }
  }
  async function handleRemoveGenre(val) {
    if (!story) return;
    try {
      // find tag id by name
      const { data: t, error: selErr } = await supabase.from('tags').select('id').eq('name', val).eq('type', 'genre').maybeSingle();
      if (selErr) throw selErr;
      if (!t) return;
      // delete relationship
      const { error: delErr } = await supabase.from('story_tags').delete().eq('story_id', story.id).eq('tag_id', t.id);
      if (delErr) throw delErr;
      await refreshStory();
    } catch (err) {
      console.error('Error remove genre', err);
      alert('No se pudo quitar el género (ver consola).');
    }
  }

  async function handleAddTag(val) {
    if (!story) return;
    try {
      const tagId = await getOrCreateTag(val, 'tag');
      await linkStoryTag(story.id, tagId);
      await refreshStory();
    } catch (err) {
      console.error('Error handleAddTag', err);
      alert('No se pudo agregar la etiqueta (ver consola).');
    }
  }
  async function handleRemoveTag(val) {
    if (!story) return;
    try {
      const { data: t, error: selErr } = await supabase.from('tags').select('id').eq('name', val).eq('type', 'tag').maybeSingle();
      if (selErr) throw selErr;
      if (!t) return;
      const { error: delErr } = await supabase.from('story_tags').delete().eq('story_id', story.id).eq('tag_id', t.id);
      if (delErr) throw delErr;
      await refreshStory();
    } catch (err) {
      console.error('Error remove tag', err);
      alert('No se pudo quitar la etiqueta (ver consola).');
    }
  }

  // when modal creates a new chapter, update local state
  function onChapterCreated(newCh) {
    setStory((s) => {
      if (!s) return s;
      return { ...s, chapters: [...(s.chapters || []), newCh] };
    });
    // optional: redirect to edit page for this new chapter
    router.push(`/escritura/capitulos/${selectedStoryId}/${newCh.id}/editar`);
  }

  if (!authReady) return <div className="page">Comprobando autenticación...</div>;
  if (loading) return <div className="page">Cargando...</div>;
  if (!story) return <div className="page">No se encontró la historia seleccionada.</div>;

  return (
    <div className="page">
      <div className="topBar">
        <label className="topLabel">Historia:</label>
        <select className="topSelect" value={selectedStoryId} onChange={(e) => setSelectedStoryId(e.target.value)}>
          {storiesList.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn create" onClick={() => setShowCreateModal(true)}><Plus /> Nuevo Capítulo</button>
        </div>
      </div>

      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{story.title}</h1>
          <p className="subtitle">por <strong>{story.author}</strong></p>
          <div className="badges" aria-label="Géneros y etiquetas">
            {/* For display we fetch tags linked to the story on-demand: simple approach = read story_tags -> tags on refresh */}
            {/* Here we will fetch tags quickly when needed (but for simplicity we show badges stored in story object if you previously fetched them). */}
          </div>
        </div>
      </header>

      <section className="meta">
        <article className="card">
          <h2>Descripción</h2>
          <p>{story.description}</p>
          <ul className="metaList">
            <li><span>Creado:</span> {new Date(story.createdAt).toLocaleDateString()}</li>
            <li><span>Actualizado:</span> {new Date(story.updatedAt).toLocaleDateString()}</li>
            <li><span>Capítulos:</span> {stats.total}</li>
          </ul>

          <div className="editRow">
            <h3 className="editTitle">Géneros</h3>
            {/* This ChipEditorWithSuggestions expects that onAdd will create tag + link */}
            <ChipEditorWithSuggestions
              items={[]} // we aren't storing genre names in story object; could fetch them separately if needed
              placeholder="Añadir género y Enter"
              onAdd={handleAddGenre}
              onRemove={handleRemoveGenre}
              badgeClass="genreChip"
              ariaLabel="Editor de géneros"
              type="genre"
              storyId={story.id}
            />
            <p className="note">Si escribes uno nuevo se creará en la tabla de tags y se asociará a la historia.</p>
          </div>

          <div className="editRow" style={{ marginTop: '1rem' }}>
            <h3 className="editTitle">Etiquetas</h3>
            <ChipEditorWithSuggestions
              items={[]}
              placeholder="Añadir etiqueta y Enter"
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              badgeClass="tagChip"
              ariaLabel="Editor de etiquetas"
              type="tag"
              storyId={story.id}
            />
            <p className="note">Escribe y presiona Enter o elige una sugerencia.</p>
          </div>
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

        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="num-asc">Número ↑</option>
          <option value="num-desc">Número ↓</option>
          <option value="title">Título A–Z</option>
        </select>
      </section>

      <section className="chapterGrid">
        {filtered.map((c) => (
          <ChapterCard key={c.id} chapter={c} storyId={story.id} />
        ))}
        {filtered.length === 0 && <div className="empty">Sin resultados para "{query}"</div>}
      </section>

      <CreateChapterModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        story={story}
        onCreated={onChapterCreated}
      />
    </div>
  );
}
