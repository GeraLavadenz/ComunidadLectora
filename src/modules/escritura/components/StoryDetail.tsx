import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import supabase from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';
import ChipEditor from './ChipEditor';
import ChapterCard from './ChapterCard';
import { filterChapters, mapStoryRowToLocal } from '../utils/helpers';

interface Story {
  id: string;
  title: string;
  author: string;
  description: string;
  genres: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  number: number;
  chapter_number: number;
  title: string;
  summary: string;
  content: string;
  isPublished: boolean;
  is_published: boolean;
  publishedAt: string;
  published_at: string;
}

interface StoryDetailProps {
  story: Story;
  refreshStory: () => Promise<void>;
}

export default function StoryDetail({ story, refreshStory }: StoryDetailProps) {
  const [local, setLocal] = useState<Story>(() => ({ ...story }));
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

  async function persistStoryFields(updates: Partial<Story>) {
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

  function handleAddTag(val: string) {
    const updated = [...(local.tags || []), val].filter((v, i, a) => a.indexOf(v) === i); // simple dedup
    setLocal((s) => ({ ...s, tags: updated, updatedAt: new Date().toISOString() }));
    setSavingTags(true);
    persistStoryFields({ tags: updated }).finally(() => setSavingTags(false));
  }
  function handleRemoveTag(val: string) {
    const updated = (local.tags || []).filter(t => t !== val);
    setLocal((s) => ({ ...s, tags: updated, updatedAt: new Date().toISOString() }));
    setSavingTags(true);
    persistStoryFields({ tags: updated }).finally(() => setSavingTags(false));
  }
  function handleAddGenre(val: string) {
    const updated = [...(local.genres || []), val].filter((v, i, a) => a.indexOf(v) === i);
    setLocal((s) => ({ ...s, genres: updated, updatedAt: new Date().toISOString() }));
    setSavingGenres(true);
    persistStoryFields({ genres: updated }).finally(() => setSavingGenres(false));
  }
  function handleRemoveGenre(val: string) {
    const updated = (local.genres || []).filter(g => g !== val);
    setLocal((s) => ({ ...s, genres: updated, updatedAt: new Date().toISOString() }));
    setSavingGenres(true);
    persistStoryFields({ genres: updated }).finally(() => setSavingGenres(false));
  }

  const handleCreateChapter = async () => {
    const nextNumber = (local.chapters || []).reduce((m, c) => Math.max(m, Number(c.number ?? 0)), 0) + 1;
    if (!newChapter.title.trim()) return alert('El capítulo necesita título.');
    const insert = {
      story_id: local.id,
      chapter_number: nextNumber,
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
      const newCh: Chapter = {
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
        {filtered.length === 0 && <div className="empty">Sin resultados para &#34;{query}&#34;</div>}
      </section>
    </main>
  );
}
