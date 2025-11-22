// src/modules/escritura/pages/capitulos.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import '../styles/capitulos.css';

// -------------------------
// util helpers
// -------------------------
function normalizeStr(s: any) {
  return (s || '').toString().toLowerCase();
}

function filterChapters(story: any, query: string, onlyPublished: boolean, sortBy: string) {
  const q = (query || '').trim().toLowerCase();
  let arr = (story?.chapters || []).filter((c: any) => {
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

function addChip(list: string[] | undefined, value: string) {
  const v = (value || '').trim();
  if (!v) return list || [];
  const exists = (list || []).some((x) => x.toLowerCase() === v.toLowerCase());
  return exists ? list : [...(list || []), v];
}
function removeChip(list: string[] | undefined, value: string) {
  const v = (value || '').toLowerCase();
  return (list || []).filter((x) => x.toLowerCase() !== v);
}

// -------------------------
// DB mapper
// -------------------------
function mapStoryRowToLocal(row: any) {
  return {
    id: row.id,
    title: row.title,
    author: row.author_name ?? row.author_id,
    description: row.description ?? '',
    genres: row._genres_names ?? [], // opcional si quieres precargar nombres
    tags: row._tags_names ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chapters: (row.chapters || []).map((c: any) => ({
      id: c.id,
      number: c.chapter_number ?? c.number ?? 0, // usa chapter_number si existe
      title: c.title,
      summary: c.summary,
      content: c.content,
      isPublished: Boolean(c.is_published),
      publishedAt: c.published_at,
    })),
  };
}

// -------------------------
// funciones para tags/genres
// -------------------------
async function ensureTag(name: string, type: 'genre' | 'tag') {
  // devuelve id del tag (existe o se crea)
  const tName = name.trim();
  if (!tName) throw new Error('Nombre vacío');

  // 1) buscar
  const { data: found, error: selErr } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', tName)
    .eq('type', type)
    .limit(1);

  if (selErr) throw selErr;
  if (found && found.length) return found[0].id;

  // 2) crear
  const { data: ins, error: insErr } = await supabase
    .from('tags')
    .insert([{ name: tName, type }])
    .select()
    .single();

  if (insErr) throw insErr;
  return ins.id;
}

async function linkStoryTag(storyId: string, tagId: string) {
  // crear la fila en story_tags si no existe
  // comprobar existencia:
  const { data: existing, error: selErr } = await supabase
    .from('story_tags')
    .select('story_id, tag_id')
    .eq('story_id', storyId)
    .eq('tag_id', tagId)
    .limit(1);

  if (selErr) throw selErr;
  if (existing && existing.length) return; // ya linked

  const { error: insErr } = await supabase
    .from('story_tags')
    .insert([{ story_id: storyId, tag_id: tagId }]);

  if (insErr) throw insErr;
}

// suggestions
async function fetchSuggestions(q: string, type: 'genre' | 'tag') {
  if (!q || q.trim() === '') return [];
  const { data, error } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', `${q}%`)
    .eq('type', type)
    .limit(10);

  if (error) {
    console.error('suggestions error', error);
    return [];
  }
  return data || [];
}

// -------------------------
// ChipEditor con sugerencias simples
// -------------------------
function ChipEditor({ items = [], placeholder, onAdd, onRemove, badgeClass = '', ariaLabel = '', type = 'tag' as 'tag' | 'genre' }) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    (async () => {
      const s = await fetchSuggestions(value, type);
      if (!mounted) return;
      setSuggestions(s);
    })();
    return () => { mounted = false; };
  }, [value, type]);

  // click outside hide suggestions
  useEffect(() => {
    function onDoc(e: any) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setSuggestions([]);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function commitValue(v: string) {
    const vv = v.trim();
    if (!vv) return;
    setValue('');
    setSuggestions([]);
    await onAdd(vv);
  }

  return (
    <div aria-label={ariaLabel} ref={ref} style={{ position: 'relative' }}>
      <div className="chips">
        {items.map((it: string) => (
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            await commitValue(value);
          } else if (e.key === 'ArrowDown' && suggestions.length) {
            // opcional: seleccionar primera suggestion
            await commitValue(suggestions[0].name);
          }
        }}
      />

      {suggestions.length > 0 && (
        <div className="suggestionsDropdown" role="listbox">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="suggestionItem"
              onMouseDown={async (ev) => {
                // onMouseDown para evitar perder foco antes del commit
                ev.preventDefault();
                await commitValue(s.name);
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------
// StoryDetail (local editing + crear cap)
// -------------------------
function StoryDetail({ story, refreshStory }: { story: any; refreshStory: () => Promise<void> }) {
  const [local, setLocal] = useState(() => ({ ...story }));
  const [query, setQuery] = useState('');
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState('num-asc');
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

  // cuando el usuario añade un genre -> ensureTag + linkStoryTag
  async function handleAddGenre(val: string) {
    setSavingGenres(true);
    try {
      const tagId = await ensureTag(val, 'genre');
      await linkStoryTag(local.id, tagId);
      // actualizar nombres locales (no hay relación directa en esta consulta minimal)
      setLocal((s: any) => ({ ...s, genres: addChip(s.genres, val) }));
      if (refreshStory) await refreshStory();
    } catch (err) {
      console.error('Error guardando género', err);
      alert('No se pudo guardar el género. Revisa la consola.');
    } finally {
      setSavingGenres(false);
    }
  }
  async function handleRemoveGenre(val: string) {
    // aquí sólo quitamos visualmente; si quieres borrar relación en BD hay que eliminar story_tags
    setLocal((s: any) => ({ ...s, genres: removeChip(s.genres, val) }));
    // opcional: eliminar relation en BD (no implementado para no borrar tags globales)
  }

  async function handleAddTag(val: string) {
    setSavingTags(true);
    try {
      const tagId = await ensureTag(val, 'tag');
      await linkStoryTag(local.id, tagId);
      setLocal((s: any) => ({ ...s, tags: addChip(s.tags, val) }));
      if (refreshStory) await refreshStory();
    } catch (err) {
      console.error('Error guardando etiqueta', err);
      alert('No se pudo guardar la etiqueta. Revisa la consola.');
    } finally {
      setSavingTags(false);
    }
  }
  function handleRemoveTag(val: string) {
    setLocal((s: any) => ({ ...s, tags: removeChip(s.tags, val) }));
  }

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
            <ChipEditor
              items={local.genres}
              placeholder="Añadir género y Enter"
              onAdd={handleAddGenre}
              onRemove={handleRemoveGenre}
              badgeClass="genreChip"
              ariaLabel="Editor de géneros"
              type="genre"
            />
          </div>

          <div className="editRow">
            <h3 className="editTitle">Etiquetas {savingTags ? '(guardando...)' : ''}</h3>
            <ChipEditor
              items={local.tags}
              placeholder="Añadir etiqueta y Enter"
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              badgeClass="tagChip"
              ariaLabel="Editor de etiquetas"
              type="tag"
            />
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
        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Ordenar capítulos">
          <option value="num-asc">Número ↑</option>
          <option value="num-desc">Número ↓</option>
          <option value="title">Título A–Z</option>
        </select>

        {/* El botón NO abre formulario inline: redirige a la pantalla de edición */}
        <CreateChapterButton storyId={local.id} />
      </section>

      <section className="chapterGrid">
        {filtered.map((c: any) => (
          <ChapterCard key={c.id} chapter={c} storyId={local.id} />
        ))}
        {filtered.length === 0 && <div className="empty">Sin resultados para "{query}"</div>}
      </section>
    </main>
  );
}

// -------------------------
// CreateChapterButton (redirige a editor)
// -------------------------
function CreateChapterButton({ storyId }: { storyId: string }) {
  const router = useRouter();

  function handleGo() {
    // redirige a la página de edición para crear nuevo capítulo.
    // Asegúrate de tener una ruta que capture "nuevo" o manejes en el editor.
    router.push(`/escritura/capitulos/${storyId}/nuevo/editar`);
  }

  return (
    <button className="btn create" onClick={handleGo}>
      <Plus /> Nuevo Capítulo
    </button>
  );
}

function ChapterCard({ chapter, storyId }: { chapter: any; storyId: string }) {
  return (
    <article className="chapterCard" data-published={chapter.isPublished} tabIndex={0} aria-label={`Capítulo ${chapter.number}: ${chapter.title}`}>
      <div className="chapterHeader">
        <span className="chNumber">#{chapter.number}</span>
        <h3 className="chTitle">{chapter.title}</h3>
        <span className={chapter.isPublished ? 'badgeOk' : 'badgeDraft'} title={chapter.isPublished ? 'Publicado' : 'Borrador'}>
          {chapter.isPublished ? 'Publicado' : 'Borrador'}
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

// -------------------------
// Wrapper: carga historias y selected story
// -------------------------
export default function Capitulos({ storyId: propStoryId }: { storyId?: string }) {
  const [selectedStoryId, setSelectedStoryId] = useState(propStoryId || '');
  const [story, setStory] = useState<any | null>(null);
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // load user's stories (solo metadata)
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
        if (!selectedStoryId && data?.length) setSelectedStoryId(data[0].id);
      } catch (err) {
        console.error('Error cargando historias', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [authReady, userId]);

  // load story + chapters: seleccionar chapters usando column names de tu BD
  useEffect(() => {
    let mounted = true;
    if (!selectedStoryId) return;
    (async () => {
      setLoading(true);
      try {
        // solicitar story; NOTA: no intento traer columnas que no existan
        const { data, error } = await supabase
          .from('stories')
          .select(`id, title, description, author_id, created_at, updated_at,
                   chapters(id, story_id, chapter_number, title, summary, content, is_published, published_at)`)
          .eq('id', selectedStoryId)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;
        if (!data) {
          setStory(null);
        } else {
          setStory(mapStoryRowToLocal(data));
        }
      } catch (err) {
        console.error('Error cargando historia', err);
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
      const { data, error } = await supabase
        .from('stories')
        .select(`id, title, description, author_id, created_at, updated_at,
                 chapters(id, story_id, chapter_number, title, summary, content, is_published, published_at)`)
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
          {storiesList.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
        </select>
      </div>

      <StoryDetail story={story} refreshStory={refreshStory} />
    </div>
  );
}
