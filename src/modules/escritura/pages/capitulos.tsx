'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import CreateChapterModal from '@/modules/escritura/components/CreateChapterModal';
import '../styles/capitulos.css';

// helpers minimalistas
const normalizeStr = (s?: string) => (s || '').toString().toLowerCase();

function mapStoryRowToLocal(row: any) {
  return {
    id: row.id,
    title: row.title,
    author: row.author_name ?? row.author_id,
    description: row.description ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chapters: (row.chapters || []).map((c: any) => ({
      id: c.id,
      number: c.chapter_number ?? c.number ?? 0,
      title: c.title,
      summary: c.summary,
      content: c.content,
      isPublished: Boolean(c.is_published),
      publishedAt: c.published_at,
    })),
  };
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
      arr = [...arr].sort((a: any, b: any) => b.number - a.number);
      break;
    case 'title':
      arr = [...arr].sort((a: any, b: any) => a.title.localeCompare(b.title));
      break;
    default:
      arr = [...arr].sort((a: any, b: any) => a.number - b.number);
  }
  return arr;
}

export default function Capitulos({ storyId: propStoryId }: { storyId?: string } = {}) {
  const router = useRouter();
  const [selectedStoryId, setSelectedStoryId] = useState(propStoryId || '');
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [story, setStory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState('num-asc');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // auth init
  useEffect(() => {
    let mounted = true;
    const sub = supabase.auth.onAuthStateChange(async () => {
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

  // fetch stories list for current user
  useEffect(() => {
    let mounted = true;
    if (!authReady) return;
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

  // fetch selected story + chapters (usa chapter_number)
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
        setStory(data ? mapStoryRowToLocal(data) : null);
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
    const published = (story?.chapters || []).filter((c: any) => c.isPublished).length;
    const pct = total ? Math.round((published / total) * 100) : 0;
    return { total, published, pct };
  }, [story]);

  const filtered = useMemo(() => filterChapters(story, query, onlyPublished, sortBy), [story, query, onlyPublished, sortBy]);

  // when a chapter is created from modal
  function onChapterCreated(newCh: any) {
    setStory((s: any) => {
      if (!s) return s;
      return { ...s, chapters: [...(s.chapters || []), newCh] };
    });
    // redirect to edit del capítulo creado
    router.push(`/escritura/capitulos/${selectedStoryId}/${newCh.id}/editar`);
  }

  if (!authReady) return <div className="page">Comprobando autenticación...</div>;
  if (loading) return <div className="page">Cargando...</div>;
  if (!story) return <div className="page">No se encontró la historia seleccionada.</div>;

  return (
    <div className="page">
      <div className="topBar">
        <label>Historia:</label>
        <select value={selectedStoryId} onChange={(e) => setSelectedStoryId(e.target.value)}>
          {storiesList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>

      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{story.title}</h1>
          <p className="subtitle">por <strong>{story.author}</strong></p>
        </div>
      </header>

      <section className="meta">
        <article className="card">
          <h2>Descripción</h2>
          <p>{story.description}</p>
          <ul className="metaList">
            <li><span>Creado:</span> {new Date(story.createdAt).toLocaleDateString()}</li>
            <li><span>Capítulos:</span> {stats.total}</li>
            <li><span>Publicados:</span> {stats.published}</li>
          </ul>
        </article>
      </section>

      <section className="toolbar">
        <input className="input" placeholder="Buscar por número, título o resumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="switch">
          <input type="checkbox" checked={onlyPublished} onChange={(e) => setOnlyPublished(e.target.checked)} />
          <span>Solo publicados</span>
        </label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="num-asc">Número ↑</option>
          <option value="num-desc">Número ↓</option>
          <option value="title">Título A–Z</option>
        </select>
      </section>

      <section className="chapterGrid">
        {(filtered || []).map((c: any) => (
          <article key={c.id} className="chapterCard" data-published={c.isPublished}>
            <div className="chapterHeader">
              <span className="chNumber">#{c.number}</span>
              <h3 className="chTitle">{c.title}</h3>
              <span className={c.isPublished ? 'badgeOk' : 'badgeDraft'}>{c.isPublished ? 'Publicado' : 'Borrador'}</span>
            </div>
            <p className="chSummary">{c.summary}</p>
            <footer className="chFooter">
              {c.isPublished ? <time>Publicado {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : '—'}</time> : <em>Pendiente</em>}
              <Link href={`/escritura/capitulos/${story.id}/${c.id}/editar`}><button className="btnGhost">Editar</button></Link>
            </footer>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty">Sin resultados para "{query}"</div>}
      </section>

      {/* -- BOTÓN DE CREAR CAPÍTULO ABAJO (según diseño original) -- */}
      <footer className="bottomActions">
        <div className="leftInfo">Total: {stats.total} — Publicados: {stats.published}</div>
        <div className="rightActions">
          <button className="btn create" onClick={() => setShowCreateModal(true)}><Plus /> Nuevo Capítulo</button>
        </div>
      </footer>

      <CreateChapterModal open={showCreateModal} onClose={() => setShowCreateModal(false)} story={story} onCreated={onChapterCreated} />
    </div>
  );
}
