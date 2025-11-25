"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import "../styles/capitulos.css";
import "../styles/editarCapitulo.css";

// Carga dinámica del corrector IA (evita SSR issues)
const AITextCorrector = dynamic(() => import("@/modules/escritura/components/AITextCorrector"), { ssr: false });

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
  const [localTitle, setLocalTitle] = useState("");
  const [localSummary, setLocalSummary] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  // IA panel state
  const [showAI, setShowAI] = useState(false);
  const [aiCorrectedText, setAiCorrectedText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load chapter from Supabase
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

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  if (loading) return <div className="page">Cargando capítulo...</div>;
  if (!chapter) return <div className="page">Capítulo no encontrado.</div>;

  // Save to DB
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
      // update local state
      setChapter((prev) => (prev ? { ...prev, ...payload } as ChapterRow : prev));
      setPublishedAt(payload.published_at);
      alert("Capítulo guardado correctamente");
      // redirigir a la lista de capítulos (opcional)
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: any) {
      console.error("Error guardando capítulo", err);
      alert("Error guardando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  // Toggle publish
  async function handlePublishToggle() {
    const newPublished = !isPublished;
    setIsPublished(newPublished);
    setPublishedAt(newPublished ? new Date().toISOString() : null);
    // no auto-save aquí, espera a que el usuario pulse Guardar
  }

  // IA integration:
  // AITextCorrector debe aceptar props: { originalText, onApply(correctedText) } 
  // (ajusta si tu componente tiene otra API)
  function handleApplyAICorrection(corrected: string) {
    setAiCorrectedText(corrected);
    // dejar al usuario aplicar manualmente:
    // aplicarlo automáticamente:
    setLocalContent(corrected);
    setShowAI(false);
  }

  return (
    <main className={`page ${showAI ? "formWithAISide" : ""}`}>
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">Editar Capítulo #{chapter.chapter_number}</h1>
          <p className="subtitle">Historia: {storyId} {/* si quieres el título de la story, puedes cargar stories.title en loadChapter */}</p>
        </div>

        <div style={{ position: "absolute", right: 24, top: 24 }}>
          <button
            className={`kollaIAButton ${showAI ? "active" : ""}`}
            onClick={() => setShowAI((s) => !s)}
            title={showAI ? "Cerrar panel de IA" : "Abrir panel de IA"}
            aria-pressed={showAI}
          >
            🤖 Kolla IA
          </button>
        </div>
      </header>

      <section className="meta metaSection">
        <article className="card cardArticle">
          <h3>Detalles del Capítulo</h3>

          <form onSubmit={handleSave} className="formRow">
            {/* Editor column */}
            <div className="editorColumn">
              <div className="formGroup">
                <label className="label" htmlFor="title">Título</label>
                <input
                  id="title"
                  className="input"
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label className="label" htmlFor="content">Contenido</label>
                <textarea
                  id="content"
                  className="contentTextarea mainTextarea"
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  placeholder="Escribe el contenido completo del capítulo aquí..."
                />
              </div>

              <div className="publishedToggle" style={{ marginTop: 12 }}>
                <label className="switch">
                  <input type="checkbox" checked={isPublished} onChange={handlePublishToggle} />
                  <span>Publicado</span>
                </label>
                {isPublished && publishedAt && (
                  <span className="date" style={{ marginLeft: 12 }}>
                    Publicado el {new Date(publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 16 }} className="formActions">
                <button type="submit" className="btn create" disabled={saving}>{saving ? "Guardando..." : "Guardar Cambios"}</button>
                <button type="button" className="btn cancel" onClick={() => router.back()}>Cancelar</button>
              </div>
            </div>

            {/* AI Column (lado derecho) */}
            {showAI && (
              <aside className="aiColumn" aria-label="Panel corrector IA">
                <div className="aiHeader">
                  <h3>Corrector IA</h3>
                  <div className="aiHeaderActions">
                    <button className={`aiBtn ${aiCorrectedText ? "active" : ""}`} onClick={() => {
                      // Si ya hay corrección generada, aplicarla
                      if (aiCorrectedText) {
                        setLocalContent(aiCorrectedText);
                        setShowAI(false);
                      }
                    }}>
                      Aplicar corrección
                    </button>
                    <button className="aiBtn" onClick={() => { setShowAI(false); }}>Cerrar</button>
                  </div>
                </div>

                <div className="aiTextAreaWrap">
                  {/* Si tu AITextCorrector expone onApply y originalText props ajusta aquí */}
                  {typeof AITextCorrector !== "undefined" ? (
                    <AITextCorrector
                      originalText={localContent}
                      onApply={(corrected: string) => handleApplyAICorrection(corrected)}
                      // opcionales: onGenerate, onError, loading etc.
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
