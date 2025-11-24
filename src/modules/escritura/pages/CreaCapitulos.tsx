"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import "../styles/capitulos.css";

export default function NewChapterPage({ params }: { params?: { id?: string } }) {
  const hookParams = useParams();
  const router = useRouter();

  // resolver storyId robustamente
  const storyId = (() => {
    if (params && params.id) return params.id;
    if (hookParams && (hookParams as any).id) return (hookParams as any).id;
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const idx = parts.lastIndexOf("capitulos");
      if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
      return parts[parts.length - 2] || parts[parts.length - 1];
    }
    return undefined;
  })();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!storyId) {
      // no storyId -> redirect back to list
      router.push("/escritura/capitulos");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!storyId) {
      alert("ID de historia no encontrado.");
      return;
    }
    setCreating(true);
    try {
      setLoading(true);
      // calcular next chapter_number desde DB para evitar race conditions simples
      const { data: maxRes, error: maxErr } = await supabase
        .from("chapters")
        .select("chapter_number")
        .eq("story_id", storyId)
        .order("chapter_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxErr) throw maxErr;
      const currentMax = maxRes?.chapter_number ?? 0;
      const nextNumber = (typeof currentMax === "number" ? currentMax : parseInt(String(currentMax || "0"), 10)) + 1;

      const payload = {
        story_id: storyId,
        title: title || `Capítulo ${nextNumber}`,
        summary: summary || "",
        content: content || "",
        chapter_number: nextNumber,
        is_published: isPublished,
      };

      const { data, error } = await supabase.from("chapters").insert([payload]).select().single();

      if (error) {
        console.error("Error creando capítulo:", error);
        alert("Error creando capítulo: " + (error?.message ?? JSON.stringify(error)));
        return;
      }

      alert("Capítulo creado correctamente.");
      // redirige a la lista de capítulos de la historia
      router.push(`/escritura/capitulos/${storyId}`);
    } catch (err: any) {
      console.error("create err", err);
      alert("Error creando capítulo: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setCreating(false);
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="heroContent">
          <h1 className="title">Crear nuevo capítulo</h1>
          <p className="subtitle">Historia: {storyId ?? "—"}</p>
        </div>
      </header>

      <section className="meta metaSection">
        <article className="card formContainer">
          <form onSubmit={handleCreate}>
            <div className="formGroup">
              <label>Título</label>
              <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del capítulo" />
            </div>

            <div className="formGroup">
              <label>Resumen (opcional)</label>
              <textarea className="textarea" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Resumen breve" />
            </div>

            <div className="formGroup">
              <label>Contenido</label>
              <textarea className="textarea" rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Contenido completo del capítulo" />
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="formActions">
              <label className="switch">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                <span>Publicar ahora</span>
              </label>

              <div style={{ marginLeft: "auto" }}>
                <button type="button" className="btn cancel" onClick={() => router.push(`/escritura/capitulos/${storyId}`)}>Cancelar</button>
                <button type="submit" className="btn create" disabled={creating}>{creating ? "Creando..." : "Crear capítulo"}</button>
              </div>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
