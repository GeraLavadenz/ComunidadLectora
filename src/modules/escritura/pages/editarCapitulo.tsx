"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import "../styles/capitulos.css";
import "../styles/editarCapitulo.css";

// carga dinámica del corrector IA (evita SSR issues)
const AITextCorrector = dynamic(
  () => import("@/modules/escritura/components/AITextCorrector"),
  { ssr: false }
);

type ChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  summary: string | null;
  content: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function EditarCapitulo({ storyId, chapterId }: { storyId: string; chapterId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [storyTitle, setStoryTitle] = useState<string | null>(null);

  const [localTitle, setLocalTitle] = useState("");
  const [localSummary, setLocalSummary] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  // IA panel state
  const [showAI, setShowAI] = useState(false);
  const [aiCorrectedText, setAiCorrectedText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar capítulo desde Supabase
  const loadChapter = useCallback(async () => {
    if (!chapterId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, story_id, chapter_number, title, summary, content, is_published, published_at, created_at, updated_at")
        .eq("id", chapterId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setChapter(null);
        setLoading(false);
        return;
      }
      setChapter(data);
      setLocalTitle(data.title ?? "");
      setLocalSummary(data.summary ?? "");
      setLocalContent(data.content ?? "");
      setIsPublished(!!data.is_published);
      setPublishedAt(data.published_at ?? null);
    } catch (err: any) {
      console.error("Error cargando capítulo", err);
      alert("Error cargando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  // Cargar título de la historia (para mostrar nombre en la UI)
  const loadStoryTitle = useCallback(async () => {
    if (!storyId) return;
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("title")
        .eq("id", storyId)
        .maybeSingle();
      if (error) throw error;
      if (data) setStoryTitle(data.title ?? null);
    } catch (err: any) {
      console.warn("No se pudo cargar título de story", err);
      setStoryTitle(null);
    }
  }, [storyId]);

  useEffect(() => {
    loadChapter();
    loadStoryTitle();
  }, [loadChapter, loadStoryTitle]);

  if (loading) return <div className="page">Cargando capítulo...</div>;
  if (!chapter) return <div className="page">Capítulo no encontrado.</div>;

  // Guardar en BD
  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: localTitle,
        summary: localSummary,
        content: localContent,
        is_published: isPublished,
        published_at: isPublished ? (publishedAt ?? new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("chapters").update(payload).eq("id", chapterId).select().maybeSingle();
      if (error) throw error;
      setChapter((prev) => (prev ? { ...prev, ...payload } as ChapterRow : prev));
      setPublishedAt(payload.published_at);
      alert("Capítulo guardado correctamente");
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: any) {
      console.error("Error guardando capítulo", err);
      alert("Error guardando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  // Toggle publish (no guarda automáticamente)
  function handlePublishToggle() {
    const newPublished = !isPublished;
    setIsPublished(newPublished);
    setPublishedAt(newPublished ? new Date().toISOString() : null);
  }

  // IA integration: aplicamos la corrección recibida y cerramos el panel
  function handleApplyAICorrection(corrected: string) {
    setAiCorrectedText(corrected);
    setLocalContent(corrected);
    setShowAI(false);
  }

  return (
    <main className={`page ${showAI ? "formWithAISide" : ""}`}>
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroInner">
          <div className="heroContent">
            <h1 className="title">Editar Capítulo #{chapter.chapter_number}</h1>
            <p className="subtitle">Historia: {storyTitle ?? storyId}</p>
          </div>
          <div className="heroRightPlaceholder" />
        </div>
      </header>

      <section className="centerContainer">
        <article className={`card cardWide ${showAI ? "withAI" : "noAI"}`}>
          <h3 className="cardTitle">Detalles del Capítulo</h3>

          <form onSubmit={handleSave} className="formRow">
            {/* Editor column */}
            <div className="editorColumn">
              <div className="titleRow">
                <div className="titleField">
                  <label className="label" htmlFor="title">Título</label>
                  <input
                    id="title"
                    className="input"
                    type="text"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                  />
                </div>

                <div className="iaButtonWrapper">
                  <button
                    type="button"
                    className={`kollaIAButton ${showAI ? "active" : ""}`}
                    onClick={() => setShowAI((s) => !s)}
                    title={showAI ? "Cerrar panel de IA" : "Abrir panel de IA"}
                    aria-pressed={showAI}
                  >
                    🤖 Kolla IA
                  </button>
                </div>
              </div>

              <div className="formGroup">
                <label className="label" htmlFor="content">Contenido</label>
                <textarea
                  id="content"
                  className="contentTextarea mainTextarea"
                  value={localContent ?? ""}
                  onChange={(e) => setLocalContent(e.target.value)}
                  placeholder="Escribe el contenido completo del capítulo aquí..."
                />
              </div>

              <div className="publishedToggle">
                <label className="switch">
                  <input type="checkbox" checked={isPublished} onChange={handlePublishToggle} />
                  <span>Publicado</span>
                </label>
                {isPublished && publishedAt && (
                  <span className="date">Publicado el {new Date(publishedAt).toLocaleDateString()}</span>
                )}
              </div>

              <div className="formActions">
                <button type="submit" className="btn create" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button type="button" className="btn cancel" onClick={() => router.back()}>
                  Cancelar
                </button>
              </div>
            </div>

            {/* AI Column (lado derecho) */}
            {showAI && (
              <aside className="aiColumn" aria-label="Panel corrector IA">
                <div className="aiHeader">
                  <h3 className="aiTitle">KOLLA IA — Corrección y comparación</h3>
                  <div className="aiHeaderActions">                    
                  </div>
                </div>

                <div className="aiTextAreaWrap">
                  {AITextCorrector ? (
                    <AITextCorrector
                      originalText={localContent}
                      onApply={(corrected: string) => handleApplyAICorrection(corrected)}
                    />
                  ) : (
                    <div className="muted">Cargando corrector IA...</div>
                  )}
                </div>
              </aside>
            )}
          </form>
        </article>
      </section>
    </main>
  );
}
