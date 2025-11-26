"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import AITextCorrector from "@/modules/escritura/components/AITextCorrector"; // ruta que indicaste
import "../styles/capitulos-create.css";

export default function NewChapterFromModules({ storyId }: { storyId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  // side panel
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitial, setAiInitial] = useState(""); // texto pasado al corrector

  useEffect(() => {
    if (!storyId) return;
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  async function loadMeta() {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("id, title, chapters(id, chapter_number)")
        .eq("id", storyId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const chs = data.chapters || [];
        const max = chs.reduce((acc: number, c: { chapter_number?: number }) => Math.max(acc, c.chapter_number ?? 0), 0);
        setNextNumber(max + 1);
        setChapterTitle(`Capítulo ${max + 1}`);
      } else {
        setNextNumber(1);
        setChapterTitle("Capítulo 1");
      }
    } catch (e) {
      console.error("loadMeta error", e);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!storyId) return alert("ID de historia no encontrado");
    if (!chapterTitle.trim()) return alert("El título no puede estar vacío");
    setSaving(true);
    try {
      const payload = {
        story_id: storyId,
        title: chapterTitle,
        content: chapterContent || "",
        chapter_number: nextNumber ?? 1,
        is_published: publishNow,
      };
      const { error } = await supabase.from("chapters").insert([payload]).select().single();
      if (error) throw error;
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: unknown) {
      console.error("create chapter error", err);
      alert("Error creando capítulo: " + (err instanceof Error ? err.message : JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }



  // callback que AITextCorrector usará para aplicar la corrección (onApply)
  function handleApplyAISuggestion(newText: string) {
    setChapterContent(newText);
    // dejar el panel abierto para comparar si quieres; si prefieres cerrarlo, descomenta:
    // setAiOpen(false);
  }

  return (
    <main className="page">
      <div className="formContainer">
        <h2>Nuevo capítulo</h2>
        
        <form onSubmit={handleSubmit} className={aiOpen ? "formWithAISide" : ""}>
          <div className="formRow">
            {/* LEFT: editor principal */}
            <div className="editorColumn">
              <div className="formGroup">
                <label>Título</label>
                <input className="input" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
              </div>

              <div className="formGroup">
                <div className="labelWithActions">
                  <label>Contenido / Resumen</label>
                  <div className="inlineActions">
                  <button 
                    type="button" 
                    className={`kollaIAButton ${aiOpen ? "active" : ""}`}
                    onClick={() => setAiOpen(!aiOpen)}
                    >
                    🧠 KOLLA IA
                    </button>

                    <button type="button" className="btnGhost" onClick={() => { setChapterContent(""); }}>Limpiar</button>
                  </div>
                </div>

                <textarea
                  className="textarea mainTextarea"
                  rows={18}
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  placeholder="Escribe o pega el borrador aquí..."
                />
              </div>

              <div className="formActionsRow">
                <label className="switch">
                  <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                  <span>Publicar ahora</span>
                </label>

                <div className="formBtns">
                  <button type="button" className="btn cancel" onClick={() => router.push(`/escritura/capitulos/${storyId}`)}>Cancelar</button>
                  <button type="submit" className="btn create" disabled={saving}>{saving ? "Creando..." : "Crear capítulo"}</button>
                </div>
              </div>
            </div>

            {/* RIGHT: panel IA (visible si aiOpen) */}
            {aiOpen && (
              <aside className="aiColumn" aria-label="Comparador IA">
                <div className="aiHeader">
                  <h3>KOLLA IA — Corrección y comparación</h3>
                  <div className="aiHeaderActions">
                  </div>
                </div>

                {/* AITextCorrector se encarga de generar y ofrecer 'Aplicar' */}
                <AITextCorrector
                  initialText={aiInitial}
                  onApply={handleApplyAISuggestion}
                  apiEndpoint="/api/ai/correct"
                />
              </aside>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}


