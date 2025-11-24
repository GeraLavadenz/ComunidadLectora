// src/modules/escritura/pages/newChapter.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function NewChapterFromModules({ storyId }: { storyId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

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
      // redirige a la lista de capítulos en tu ruta principal (igual que antes)
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: any) {
      console.error("create chapter error", err);
      alert("Error creando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <div className="formContainer">
        <h2>Nuevo capítulo</h2>
        <div className="metaList">
          <div><strong>Historia:</strong> {storyTitle || "—"}</div>
          <div><strong>Siguiente número:</strong> {nextNumber ?? "—"}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>Título</label>
            <input className="input" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
          </div>

          <div className="formGroup">
            <label>Contenido / Resumen</label>
            <textarea className="textarea" rows={8} value={chapterContent} onChange={(e) => setChapterContent(e.target.value)} />
          </div>

          <div className="formActions">
            <label className="switch">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              <span>Publicar ahora</span>
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn cancel" onClick={() => router.push(`/escritura/capitulos/${storyId}`)}>Cancelar</button>
              <button type="submit" className="btn create" disabled={saving}>{saving ? "Creando..." : "Crear capítulo"}</button>
            </div>
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