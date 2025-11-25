"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import AITextCorrector from "@/modules/escritura/components/AITextCorrector"; // ruta que indicaste
import "../styles/capitulos-create.css";

export default function NewChapterFromModules({ storyId }: { storyId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  // side panel
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitial, setAiInitial] = useState(""); // texto pasado al corrector
  const [aiResult, setAiResult] = useState<string | null>(null); // respuesta previa (opcional)

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
        setStoryTitle(data.title || "");
        const chs = data.chapters || [];
        const max = chs.reduce((acc: number, c: any) => Math.max(acc, c.chapter_number ?? 0), 0);
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
      const { data, error } = await supabase.from("chapters").insert([payload]).select().single();
      if (error) throw error;
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: any) {
      console.error("create chapter error", err);
      alert("Error creando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  // abrir el panel IA y pasar el texto actual
  function openAISidePanel() {
    setAiInitial(chapterContent);
    setAiResult(null);
    setAiOpen(true);
  }

  // callback que AITextCorrector usará para aplicar la corrección (onApply)
  function handleApplyAISuggestion(newText: string) {
    setChapterContent(newText);
    setAiResult(newText);
    // dejar el panel abierto para comparar si quieres; si prefieres cerrarlo, descomenta:
    // setAiOpen(false);
  }

  return (
    <main className="page">
      <div className="formContainer">
        <h2>Nuevo capítulo</h2>

        <div className="metaList">
          <div><strong>Historia:</strong> {storyTitle || "—"}</div>
          <div><strong>Siguiente número:</strong> {nextNumber ?? "—"}</div>
        </div>

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

                    <button type="button" className="btnGhost" onClick={() => { setChapterContent(""); setAiResult(null); }}>Limpiar</button>
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

// Chip editor UI (igual)
function ChipEditor({ items = [], placeholder, onAdd, onRemove, badgeClass = "", ariaLabel = "" }: any) {
  const [value, setValue] = useState("");

  function onKeyDown(e: any) {
    if (e.key === "Enter") {
      const v = value.trim();
      if (v) {
        onAdd(v);
        setValue("");
      }
    }
  }

  return (
    <div aria-label={ariaLabel}>
      <div className="chips">
        {items.map((it: string) => (
          <span key={it} className={`chip ${badgeClass}`}>
            {it}
            <button className="chipRemove" title={`Eliminar ${it}`} onClick={() => onRemove(it)} aria-label={`Eliminar ${it}`}>×</button>
          </span>
        ))}
      </div>
      <input className="chipInput" placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKeyDown} />
    </div>
  );
}
