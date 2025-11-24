// src/modules/escritura/pages/capitulos.tsx
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import '../styles/capitulos.css';

type ChapterDB = {
  id: string;
  story_id: string;
  title: string | null;
  content: string | null;
  chapter_number: number | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
  summary?: string | null;
};

type StoryDB = {
  id: string;
  title: string;
  description?: string | null;
  author_id?: string;
  created_at?: string;
  updated_at?: string;
  cover_url?: string | null;
  chapters?: ChapterDB[];
};

type TagRow = {
  id: string;
  name: string;
  type: 'genre' | 'tag';
};

export default function Capitulos({ storyId }: { storyId: string }) {
  const router = useRouter();

  const [story, setStory] = useState<StoryDB | null>(null);
  const [chapters, setChapters] = useState<ChapterDB[]>([]);
  const [loading, setLoading] = useState(false);

  // Chips (genres & tags) state
  const [genreChips, setGenreChips] = useState<TagRow[]>([]);
  const [tagChips, setTagChips] = useState<TagRow[]>([]);
  const [chipInput, setChipInput] = useState('');
  const [chipType, setChipType] = useState<'genre' | 'tag'>('genre');
  const [suggestions, setSuggestions] = useState<TagRow[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Modal create chapter
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const chipInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { loadStory(); loadChips(); }, [storyId]);

  // Load story + chapters
  async function loadStory() {
    setLoading(true);
    try {
      // SELECT story and nested chapters. Note: use column names that match your DB:
      const { data, error } = await supabase
        .from<StoryDB>('stories')
        .select(
          `id,title,description,author_id,created_at,updated_at,chapters(id,story_id,title,summary,content,chapter_number,is_published,published_at,created_at,updated_at)`
        )
        .eq('id', storyId)
        .single();

      if (error) {
        console.error('Error cargando story', error);
        setStory(null);
        setChapters([]);
      } else {
        setStory(data);
        setChapters((data?.chapters || []).sort((a,b) => {
          const an = a.chapter_number ?? 0; const bn = b.chapter_number ?? 0;
          return an - bn;
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  // Load existing tags (genres + tags) for suggestions and load story's current chips via story_tags
  async function loadChips() {
    if (!storyId) return;
    try {
      const { data: linked, error: err } = await supabase
        .from('story_tags')
        .select('tag_id')
        .eq('story_id', storyId);

      if (err) {
        console.error('error fetching story_tags', err);
      } else {
        const ids = (linked || []).map((r: any) => r.tag_id);
        if (ids.length > 0) {
          const { data: tags, error: err2 } = await supabase
            .from<TagRow>('tags')
            .select('*')
            .in('id', ids);

          if (err2) console.error(err2);
          else {
            setGenreChips(tags.filter(t => t.type === 'genre'));
            setTagChips(tags.filter(t => t.type === 'tag'));
          }
        } else {
          setGenreChips([]);
          setTagChips([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Suggestion lookup while typing
  useEffect(() => {
    let cancelled = false;
    if (!chipInput.trim()) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }

    (async () => {
      const q = chipInput.trim();
      const { data, error } = await supabase
        .from<TagRow>('tags')
        .select('*')
        .ilike('name', `%${q}%`)
        .eq('type', chipType)
        .limit(8);

      if (error) {
        console.error('suggestions error', error);
        return;
      }
      if (!cancelled && data) {
        // hide those already selected
        const selectedIds = (chipType === 'genre' ? genreChips : tagChips).map(c => c.id);
        setSuggestions(data.filter(d => !selectedIds.includes(d.id)));
        setSuggestOpen(true);
      }
    })();

    return () => { cancelled = true; };
  }, [chipInput, chipType, genreChips, tagChips]);

  // add chip (existing tag row)
  async function addChipFromSuggestion(item: TagRow) {
    // link story_tag if not linked
    await linkTagToStory(item.id);
    if (item.type === 'genre') setGenreChips(prev => [...prev, item]);
    else setTagChips(prev => [...prev, item]);
    setChipInput('');
    setSuggestOpen(false);
  }

  // add chip by typed name: create tag if not exists, then link
  async function addChipTyped(name: string) {
    const normalized = name.trim();
    if (!normalized) return;
    setChipInput('');
    setSuggestOpen(false);

    // Check exists
    const { data: existing, error: selErr } = await supabase
      .from<TagRow>('tags')
      .select('*')
      .ilike('name', normalized)
      .eq('type', chipType)
      .limit(1);

    if (selErr) {
      console.error('error checking tag', selErr);
      return;
    }

    let row: TagRow | null = existing && existing[0] ? existing[0] : null;

    if (!row) {
      // create tag
      const { data: insData, error: insErr } = await supabase
        .from<TagRow>('tags')
        .insert([{ name: normalized, type: chipType }])
        .select()
        .single();

      if (insErr) {
        console.error('error creating tag', insErr);
        return;
      }
      row = insData;
    }

    // link
    await linkTagToStory(row.id);

    if (chipType === 'genre') setGenreChips(prev => [...prev, row!]);
    else setTagChips(prev => [...prev, row!]);
  }

  // link tag_id <-> story via story_tags table (avoid duplicate)
  async function linkTagToStory(tagId: string) {
    try {
      // check existing link
      const { data: existing, error: selErr } = await supabase
        .from('story_tags')
        .select('*')
        .eq('story_id', storyId)
        .eq('tag_id', tagId)
        .limit(1);

      if (selErr) {
        console.error('error checking story_tags', selErr);
        return;
      }
      if (existing && existing.length > 0) return; // already linked

      const { error: insErr } = await supabase
        .from('story_tags')
        .insert([{ story_id: storyId, tag_id: tagId }]);

      if (insErr) console.error('error linking tag to story', insErr);
    } catch (e) {
      console.error(e);
    }
  }

  // remove chip from UI + story_tags
  async function removeChip(chip: TagRow) {
    if (!confirm(`Quitar "${chip.name}" de la historia?`)) return;
    try {
      // delete link
      const { error } = await supabase
        .from('story_tags')
        .delete()
        .eq('story_id', storyId)
        .eq('tag_id', chip.id);

      if (error) {
        console.error('error removing link', error);
      } else {
        if (chip.type === 'genre') setGenreChips(prev => prev.filter(p => p.id !== chip.id));
        else setTagChips(prev => prev.filter(p => p.id !== chip.id));
      }
    } catch (e) { console.error(e); }
  }

  // compute publication progress
  const progress = useMemo(() => {
    const total = chapters.length;
    const published = chapters.filter(c => c.is_published).length;
    const pct = total === 0 ? 0 : Math.round((published / total) * 100);
    return { total, published, pct };
  }, [chapters]);

  // Create chapter modal logic
  function openCreate() { setCreateOpen(true); }
  function closeCreate() { setCreateOpen(false); }

  async function createChapter({ title, summary, content, publish }: { title: string; summary?: string; content?: string; publish?: boolean }) {
    setCreating(true);
    try {
      // determine next chapter_number
      const maxRes = await supabase
        .from<ChapterDB>('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (maxRes.data && maxRes.data.length > 0 && typeof maxRes.data[0].chapter_number === 'number') {
        nextNumber = (maxRes.data[0].chapter_number || 0) + 1;
      }

      const insertObj = {
        story_id: storyId,
        title: title || `Capítulo ${nextNumber}`,
        summary: summary || null,
        content: content || null,
        chapter_number: nextNumber,
        is_published: !!publish,
        published_at: publish ? new Date().toISOString() : null,
      };

      const { data: newCh, error: insErr } = await supabase
        .from<ChapterDB>('chapters')
        .insert([insertObj])
        .select()
        .single();

      if (insErr) {
        console.error('Error creando capítulo ', insErr);
        alert('Error creando capítulo: ' + (insErr.message || insErr.toString()));
      } else {
        setChapters(prev => [...prev, newCh].sort((a,b)=> (a.chapter_number||0)-(b.chapter_number||0)));
        setCreateOpen(false);
        // redirect to editor? Aquí sólo recargamos (si quieres redirigir, usar router.push(`/escritura/capitulos/${storyId}/editar/${newCh.id}`))
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  // UI helpers
  function onChipInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (chipInput.trim()) addChipTyped(chipInput);
    } else if (e.key === 'ArrowDown') {
      // focus suggestion list (not implemented keyboard fully)
    }
  }

  if (!story && loading) {
    return <div className="page"><div style={{maxWidth:1100, margin:'40px auto'}}>Cargando...</div></div>;
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">{story?.title ?? 'Historia'}</h1>
          <p className="subtitle">por {story?.author_id ?? '—'}</p>
          <div className="badges" style={{marginTop:10}}>
            {genreChips.map(g => <span key={g.id} className="badgeGenre badge">{g.name}</span>)}
            {tagChips.map(t => <span key={t.id} className="badgeTag badge">#{t.name}</span>)}
          </div>
        </div>
      </header>

      <section className="meta metaSection" style={{padding: '0 20px 10px'}}>
        <article className="card cardArticle">
          <h3>Descripción</h3>
          <p className="note">{story?.description}</p>

          <div style={{marginTop:16}}>
            <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:8}}>
              <div>
                <strong>Géneros</strong>
                <div className="chips" style={{marginTop:8}}>
                  {genreChips.map(g => (
                    <div key={g.id} className="chip genreChip">
                      {g.name}
                      <button className="chipRemove" onClick={()=>removeChip(g)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="editRow">
                  <input
                    ref={chipInputRef}
                    className="chipInput"
                    placeholder="Añadir género y Enter"
                    value={chipInput}
                    onChange={e => { setChipInput(e.target.value); setChipType('genre'); }}
                    onKeyDown={onChipInputKeyDown}
                    onFocus={()=>setChipType('genre')}
                  />
                </div>
              </div>

              <div style={{marginLeft:24}}>
                <strong>Etiquetas</strong>
                <div className="chips" style={{marginTop:8}}>
                  {tagChips.map(t => (
                    <div key={t.id} className="chip tagChip">
                      {t.name}
                      <button className="chipRemove" onClick={()=>removeChip(t)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="editRow">
                  <input
                    className="chipInput"
                    placeholder="Añadir etiqueta y Enter"
                    value={chipInput}
                    onChange={e => { setChipInput(e.target.value); setChipType('tag'); }}
                    onKeyDown={onChipInputKeyDown}
                    onFocus={()=>setChipType('tag')}
                  />
                </div>
              </div>
            </div>
            <p className="note">Puedes modificar <strong>géneros</strong> y <strong>etiquetas</strong>. Estos cambios no afectan el estado de publicación de los capítulos.</p>
          </div>
        </article>

        <aside className="card cardArticle">
          <h3>Publicación</h3>
          <div style={{marginTop:12}}>
            <div className="progressBar">
              <div className="progressFill" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="progressText">{progress.published} publicados de {progress.total} ({progress.pct}%)</div>
          </div>
        </aside>
      </section>

      <div className="toolbar">
        <div className="searchBox" style={{maxWidth:560}}>
          <input className="input" placeholder="Buscar por número, título o resumen..." />
          <span className="searchIcon">🔍</span>
        </div>

        <label className="switch"><input type="checkbox" /> <span>Solo publicados</span></label>

        <select className="select">
          <option>Número ↑</option>
          <option>Número ↓</option>
        </select>

        {/* button area placeholder; actual button will also be shown at bottom right */}
        <div style={{flex:1}} />

        {/* Floating bottom area: single Nuevo Capítulo */}
      <div style={{maxWidth:1100, margin:'14px auto 60px', padding:'0 20px', display:'flex', justifyContent:'flex-end'}}>
        <button className="btn create" onClick={openCreate}>+ Nuevo Capítulo</button>
      </div>
      </div>

      {/* Grid of chapters */}
      <section className="chapterGrid">
        {chapters.length === 0 && <div className="empty">No hay capítulos aún.</div>}
        {chapters.map(ch => (
          <article key={ch.id} className="chapterCard" data-published={!!ch.is_published}>
            <div className="chapterHeader">
              <div className="chNumber">#{ch.chapter_number}</div>
              <div>
                <h3 className="chTitle">{ch.title || `Capítulo ${ch.chapter_number}`}</h3>
              </div>
              <div>{ch.is_published ? <span className="badgeOk">Publicado</span> : <span className="badgeDraft">Borrador</span>}</div>
            </div>
            <p className="chSummary">{ch.summary}</p>
            <div className="chFooter">
              <div>
                {ch.is_published && ch.published_at ? <div className="date">Publicado el {new Date(ch.published_at).toLocaleDateString()}</div> : <div className="pending">Pendiente de publicación</div>}
              </div>
              <div>
                <button className="btnGhost" onClick={() => router.push(`/escritura/capitulos/${storyId}/editar/${ch.id}`)}>Editar</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      

      {/* Suggestions dropdown (simple) */}
      {suggestOpen && suggestions.length > 0 && (
        <div style={{
          position: 'fixed', left: 80, bottom: 120, background: 'var(--surface)', border: '1px solid var(--stroke)',
          borderRadius:8, padding:8, zIndex:60, maxWidth:360
        }}>
          {suggestions.map(s => (
            <div key={s.id} style={{padding:'6px 8px', cursor:'pointer'}} onMouseDown={(e)=>{ e.preventDefault(); addChipFromSuggestion(s); }}>
              {s.name}
            </div>
          ))}
        </div>
      )}

      {/* Create Chapter Modal */}
      {createOpen && (
        <CreateChapterModal
          onClose={closeCreate}
          onCreate={createChapter}
          loading={creating}
        />
      )}
    </main>
  );
}

/* ---------------------------
   CreateChapterModal component
   --------------------------- */
function CreateChapterModal({ onClose, onCreate, loading } : { onClose: ()=>void, onCreate: (data:{title:string,summary?:string,content?:string,publish?:boolean})=>Promise<void>, loading?: boolean }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [publish, setPublish] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    await onCreate({ title, summary, content, publish });
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(4,8,12,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:80
    }}>
      <div style={{ width: 880, maxWidth:'96%', borderRadius:12, padding:20 }} className="formContainer">
        <h3>Crear Nuevo Capítulo</h3>
        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>Título</label>
            <input type="text" className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título del capítulo" />
          </div>
          <div className="formGroup">
            <label>Resumen</label>
            <textarea className="input" style={{height:88}} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Breve resumen..." />
          </div>
          <div className="formGroup">
            <label>Contenido</label>
            <textarea className="input" style={{height:160}} value={content} onChange={e=>setContent(e.target.value)} placeholder="Contenido (puedes editar después)"/>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}><input type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)} /> Publicar ahora</label>
          </div>

          <div className="formActions" style={{marginTop:18}}>
            <button type="button" className="btn cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn create" disabled={loading}>{loading ? <span className="spinner" /> : 'Crear capítulo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
