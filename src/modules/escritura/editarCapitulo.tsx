"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/capitulos.module.css";
import { stories } from "./storiesData";

interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  isPublished: boolean;
  publishedAt?: string;
  content?: string; // Agregado para contenido editable
}

export default function EditarCapitulo({ storyId, chapterId }: { storyId: string; chapterId: string }) {
  const router = useRouter();
  const story = stories.find((s) => s.id === storyId);
  const chapter = story?.chapters.find((c) => c.id === chapterId);

  const [editedChapter, setEditedChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (chapter) {
      setEditedChapter({ ...chapter });
    }
  }, [chapter]);

  if (!story || !chapter || !editedChapter) {
    return <div className={styles.page}>Capítulo no encontrado</div>;
  }

  const handleSave = () => {
    // Aquí iría la lógica para guardar en backend, por ahora solo local
    // Actualizar el storiesData (en una app real, esto sería una API call)
    const storyIndex = stories.findIndex((s) => s.id === storyId);
    if (storyIndex !== -1) {
      const chapterIndex = stories[storyIndex].chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex !== -1) {
        stories[storyIndex].chapters[chapterIndex] = { ...editedChapter };
        stories[storyIndex].updatedAt = new Date().toISOString();
        alert("Capítulo guardado exitosamente");
        router.push(`/escritura/capitulos/${storyId}`);
      }
    }
  };

  const handlePublishToggle = () => {
    setEditedChapter((prev) => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        isPublished: !prev.isPublished,
        publishedAt: !prev.isPublished ? now : undefined,
      };
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Editar Capítulo #{editedChapter.number}</h1>
          <p className={styles.subtitle}>
            Historia: {story.title} por {story.author}
          </p>
        </div>
      </header>

      <section className={styles.meta}>
        <article className={styles.card}>
          <h2>Detalles del Capítulo</h2>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem" }}>
              Título
            </label>
            <input
              id="title"
              type="text"
              value={editedChapter.title}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, title: e.target.value } : prev)}
              className={styles.input}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="summary" style={{ display: "block", marginBottom: "0.5rem" }}>
              Resumen
            </label>
            <textarea
              id="summary"
              value={editedChapter.summary}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, summary: e.target.value } : prev)}
              className={styles.input}
              style={{ width: "100%", minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="content" style={{ display: "block", marginBottom: "0.5rem" }}>
              Contenido
            </label>
            <textarea
              id="content"
              value={editedChapter.content || ""}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, content: e.target.value } : prev)}
              className={styles.input}
              style={{ width: "100%", minHeight: "400px", resize: "vertical", fontFamily: "monospace", fontSize: "14px" }}
              placeholder="Escribe el contenido completo del capítulo aquí..."
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={editedChapter.isPublished}
                onChange={handlePublishToggle}
              />
              <span>Publicado</span>
            </label>
            {editedChapter.isPublished && editedChapter.publishedAt && (
              <span className={styles.date}>
                Publicado el {new Date(editedChapter.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </article>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px 50px" }}>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button onClick={handleSave} className={styles.btnGhost} style={{ background: "var(--brand)", color: "var(--bg)" }}>
            Guardar Cambios
          </button>
          <button onClick={() => router.back()} className={styles.btnGhost}>
            Cancelar
          </button>
        </div>
      </section>
    </main>
  );
}
