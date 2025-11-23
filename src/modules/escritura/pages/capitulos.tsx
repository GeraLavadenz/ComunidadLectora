'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import '../styles/capitulos.css';

type TagRow = {
  id: string;
  name: string;
  type: 'genre' | 'tag';
};

type ChapterDB = {
  id: string;
  story_id: string;
  title: string;
  content: string;
  chapter_number: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function CapitulosPage({ params }: { params: { id: string } }) {
  const storyId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<ChapterDB[]>([]);
  const [genres, setGenres] = useState<TagRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const [search, setSearch] = useState('');
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');

  // -------------------------------------------------------
  //  🔥 NUEVO loadStory() instalado y funcionando
  // -------------------------------------------------------
  async function loadStory() {
    setLoading(true);
    try {
      // 1) story
      const { data: storyData, error: storyErr } = await supabase
        .from('stories')
        .select('id,title,description,author_id,created_at,updated_at,cover_url')
        .eq('id', storyId)
        .single();

      if (storyErr) throw storyErr;
      if (!storyData) throw new Error('Historia no encontrada');

      // 2) profile del autor
      let authorName = '—';
      if (storyData.author_id) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('full_name,username')
          .eq('id', storyData.author_id)
          .single();
        if (!profErr && prof) authorName = prof.full_name || prof.username || '—';
      }

      // 3) capítulos
      const { data: chData, error: chErr } = await supabase
        .from('chapters')
        .select('id,story_id,chapter_number,title,content,is_published,published_at,created_at,updated_at')
        .eq('story_id', storyId);

      if (chErr) throw chErr;

      const chs: ChapterDB[] = (chData || [])
        .map((c: any) => ({
          id: c.id,
          story_id: c.story_id,
          title: c.title,
          content: c.content ?? '',
          chapter_number: c.chapter_number ?? 0,
          is_published: !!c.is_published,
          published_at: c.published_at ?? null,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }))
        .sort((a, b) => a.chapter_number - b.chapter_number);

      // 4) story_tags → tags
      const { data: stTags, error: stTagsErr } = await supabase
        .from('story_tags')
        .select('tag_id')
        .eq('story_id', storyId);

      if (stTagsErr) throw stTagsErr;

      const tagIds = (stTags || []).map((r: any) => r.tag_id).filter(Boolean);

      let g: TagRow[] = [];
      let t: TagRow[] = [];

      if (tagIds.length) {
        const { data: tagRows, error: tagErr } = await supabase
          .from('tags')
          .select('id,name,type')
          .in('id', tagIds);

        if (!tagErr && tagRows) {
          g = tagRows.filter((x: any) => x.type === 'genre');
          t = tagRows.filter((x: any) => x.type === 'tag');
        }
      }

      // set state final
      setStory({ ...storyData, authorName });
      setChapters(chs);
      setGenres(g);
      setTags(t);
    } catch (err: any) {
      console.error('Error cargando historia', err);
      alert('Error cargando historia: ' + (err?.message ?? JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------
  // loadStory al entrar
  // --------------------------------------------
  useEffect(() => {
    if (!storyId) return;
    loadStory();
  }, [storyId]);

  // --------------------------------------------
  // filtros
  // --------------------------------------------
  const filteredChapters = useMemo(() => {
    let list = [...chapters];

    if (onlyPublished) list = list.filter((c) => c.is_published);

    if (search.trim() !== '') {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        c.title.toLowerCase().includes(s) ||
        c.content.toLowerCase().includes(s) ||
        c.chapter_number.toString().includes(s)
      );
    }

    list.sort((a, b) => {
      return sortBy === 'asc' ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number;
    });

    return list;
  }, [chapters, search, onlyPublished, sortBy]);

  // --------------------------------------------
  // render
  // --------------------------------------------
  if (!story) {
    return <div className="page">Cargando historia...</div>;
  }

  return (
    <main className="page">
      {/* HERO */}
      <header className="hero">
        <div className="heroGlow" />

        <div className="heroContent">
          <h1 className="title">{story.title}</h1>
          <p className="subtitle">por {story.authorName}</p>

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

      {/* META info */}
      <section className="meta">
        <article className="card">
          <h3>Descripción</h3>
          <p>{story.description}</p>
          <ul className="metaList">
            <li>Creado: <span>{new Date(story.created_at).toLocaleDateString()}</span></li>
            <li>Actualizado: <span>{new Date(story.updated_at).toLocaleDateString()}</span></li>
            <li>Capítulos: <span>{chapters.length}</span></li>
          </ul>
        </article>

        <article className="card">
          <h3>Publicación</h3>
          <div className="progressBar">
            <div
              className="progressFill"
              style={{
                width:
                  chapters.length > 0
                    ? ((chapters.filter((c) => c.is_published).length / chapters.length) * 100).toFixed(0) + '%'
                    : '0%',
              }}
            />
          </div>
          <p className="progressText">
            {chapters.filter((c) => c.is_published).length} publicados de {chapters.length}
          </p>
        </article>
      </section>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="searchBox">
          <input
            className="input"
            placeholder="Buscar por número, título o resumen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={onlyPublished}
            onChange={() => setOnlyPublished(!onlyPublished)}
          />
          Solo publicados
        </label>

        <select
          className="select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Número ↑</option>
          <option value="desc">Número ↓</option>
        </select>

        <button
          className="btnGhost"
          style={{ background: 'var(--brand)', color: 'var(--bg)' }}
          onClick={() => alert('Aquí va el modal de nuevo capítulo')}
        >
          + Nuevo Capítulo
        </button>
      </div>

      {/* CAPÍTULOS */}
      <section className="chapterGrid">
        {filteredChapters.length === 0 && (
          <div className="empty">No hay capítulos para mostrar</div>
        )}

        {filteredChapters.map((c) => (
          <article
            key={c.id}
            className="chapterCard"
            data-published={c.is_published}
          >
            <div className="chapterHeader">
              <span className="chNumber">#{c.chapter_number}</span>
              <h4 className="chTitle">{c.title}</h4>
              {c.is_published ? (
                <span className="badgeOk">Publicado</span>
              ) : (
                <span className="badgeDraft">Borrador</span>
              )}
            </div>

            <p className="chSummary">{c.content.slice(0, 120)}...</p>

            <div className="chFooter">
              {c.is_published ? (
                <span className="date">
                  Publicado el{' '}
                  {c.published_at
                    ? new Date(c.published_at).toLocaleDateString()
                    : '—'}
                </span>
              ) : (
                <span className="pending">Pendiente de publicación</span>
              )}

              <button
                className="btnGhost"
                onClick={() => router.push(`/escritura/editar/${c.id}`)}
              >
                Editar
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
