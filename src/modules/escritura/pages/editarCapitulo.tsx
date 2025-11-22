// src/modules/escritura/pages/EditarCapitulo.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import '../styles/capitulos.css';
import '../styles/editarCapitulo.css';

// --- AI demo (no llamadas externas) ---
const correctWithAI = (text: string): string => {
  let corrected = text
    .replace(/\bi\b/g, 'I')
    .replace(/([.!?]\s*)([a-z\u00E0-\u017F])/g, (m, p1, p2) => p1 + p2.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
  if (!/[.!?]$/.test(corrected)) corrected += '.';
  return corrected;
};

type ChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string | null;
  summary: string | null;
  content: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function EditarCapitulo({ storyId, chapterId }: { storyId: string; chapterId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  // AI comparison
  const [showComparison, setShowComparison] = useState(false);
  const [aiCorrectedContent, setAiCorrectedContent] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        if (chapterId === 'nuevo') {
          // nuevo: iniciar campos vacíos
          if (!mounted) return;
          setChapter(null);
          setEditedTitle('');
          setEditedSummary('');
          setEditedContent('');
          setIsPublished(false);
          setPublishedAt(null);
          setLoading(false);
          return;
        }

        // cargar capítulo existente desde la tabla 'chapters'
        const { data, error } = await supabase
          .from<ChapterRow>('chapters')
          .select('*')
          .eq('id', chapterId)
          .limit(1)
          .single();

        if (error) throw error;
        if (!mounted) return;

        setChapter(data ?? null);
        setEditedTitle(data?.title ?? '');
        setEditedSummary(data?.summary ?? '');
        setEditedContent(data?.content ?? '');
        setIsPublished(Boolean(data?.is_published));
        setPublishedAt(data?.published_at ?? null);
      } catch (err: any) {
        console.error('Error cargando capítulo', err);
        alert('No se pudo cargar el capítulo. Revisa la consola.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [chapterId]);

  // obtener siguiente chapter_number si vamos a crear
  const getNextChapterNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      const max = (data && data.length && (data[0] as any).chapter_number) || 0;
      return Number(max) + 1;
    } catch (err) {
      console.error('Error leyendo max chapter_number', err);
      return 1;
    }
  };

  const handleAICorrection = () => {
    const corrected = correctWithAI(editedContent || '');
    setAiCorrectedContent(corrected);
    setShowComparison(true);
  };

  const handleApplyCorrection = () => {
    setEditedContent(aiCorrectedContent);
    setShowComparison(false);
  };

  const handlePublishToggle = () => {
    if (!isPublished) {
      const now = new Date().toISOString();
      setPublishedAt(now);
      setIsPublished(true);
    } else {
      setPublishedAt(null);
      setIsPublished(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // validaciones mínimas
      if (!editedTitle.trim()) {
        alert('El capítulo necesita un título.');
        setSaving(false);
        return;
      }

      if (chapterId === 'nuevo') {
        // crear nuevo capítulo: calcular chapter_number
        const nextNumber = await getNextChapterNumber();
        const insert = {
          story_id: storyId,
          chapter_number: nextNumber,
          title: editedTitle.trim(),
          summary: editedSummary || null,
          content: editedContent || null,
          is_published: isPublished || false,
          published_at: isPublished ? publishedAt ?? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('chapters').insert([insert]).select('*').single();
        if (error) throw error;

        // opcional: actualizar updated_at en stories
        await supabase.from('stories').update({ updated_at: new Date().toISOString() }).eq('id', storyId);

        alert('Capítulo creado correctamente.');
        // redirigir a lista de capítulos o a editar recién creado
        router.push(`/escritura/capitulos/${storyId}`);
        return;
      }

      // update existente
      const updatePayload: any = {
        title: editedTitle.trim(),
        summary: editedSummary || null,
        content: editedContent || null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
        published_at: isPublished ? (publishedAt ?? new Date().toISOString()) : null,
      };

      const { data: updated, error: updErr } = await supabase
        .from('chapters')
        .update(updatePayload)
        .eq('id', chapterId)
        .select('*')
        .single();

      if (updErr) throw updErr;

      // opcional: actualizar updated_at en stories
      await supabase.from('stories').update({ updated_at: new Date().toISOString() }).eq('id', storyId);

      alert('Capítulo actualizado correctamente.');
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: any) {
      console.error('Error guardando capítulo', err);
      alert('No se pudo guardar el capítulo. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page">Cargando capítulo...</div>;

  return (
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title"> {chapterId === 'nuevo' ? 'Crear capítulo nuevo' : `Editar Capítulo #${chapter?.chapter_number ?? '—'}`} </h1>
          <p className="subtitle">Historia: {storyId}</p>
        </div>

        <div className="aiButtonContainer">
          <button onClick={handleAICorrection} title="IA: Corrige gramática y mejora la continuidad de la historia" className="aiButton">
            🤖 Kolla IA
          </button>
        </div>
      </header>

      <section className="meta metaSection">
        <article className="card cardArticle">
          <h2>Detalles del Capítulo</h2>

          <div className="formGroup">
            <label htmlFor="title" className="label">Título</label>
            <input id="title" type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="input" />
          </div>

          <div className="formGroup">
            <label htmlFor="summary" className="label">Resumen</label>
            <textarea id="summary" value={editedSummary} onChange={(e) => setEditedSummary(e.target.value)} className="input textarea" />
          </div>

          <div className="formGroup">
            <label htmlFor="content" className="label">Contenido</label>

            {showComparison ? (
              <div className="comparisonContainer">
                <div className="comparisonColumn">
                  <h4 className="comparisonHeader comparisonHeaderOriginal">Texto Original</h4>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="input contentTextarea"
                    rows={14}
                  />
                </div>

                <div className="comparisonColumn">
                  <h4 className="comparisonHeader comparisonHeaderCorrected">Corregido por IA</h4>
                  <textarea value={aiCorrectedContent} readOnly className="correctedTextarea" rows={14} />
                </div>
              </div>
            ) : (
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="input contentTextarea" rows={18} />
            )}

            {showComparison && (
              <div className="correctionButtons">
                <button onClick={handleApplyCorrection} className="btnGhost" style={{ background: 'var(--brand)', color: 'var(--bg)' }}>
                  Aplicar Corrección
                </button>
                <button onClick={() => setShowComparison(false)} className="btnGhost">Cancelar</button>
              </div>
            )}
          </div>

          <div className="publishedToggle" style={{ marginTop: 12 }}>
            <label className="switch">
              <input type="checkbox" checked={isPublished} onChange={handlePublishToggle} />
              <span>Publicado</span>
            </label>
            {isPublished && publishedAt && (
              <span className="date">Publicado el {new Date(publishedAt).toLocaleDateString()}</span>
            )}
          </div>
        </article>
      </section>

      <section className="bottomSection">
        <div className="bottomButtons">
          <button onClick={handleSave} className="btnGhost" style={{ background: 'var(--brand)', color: 'var(--bg)' }} disabled={saving}>
            {saving ? 'Guardando...' : (chapterId === 'nuevo' ? 'Crear capítulo' : 'Guardar cambios')}
          </button>
          <button onClick={() => router.back()} className="btnGhost">Cancelar</button>
        </div>
      </section>
    </main>
  );
}
