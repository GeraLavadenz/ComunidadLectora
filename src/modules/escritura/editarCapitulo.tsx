"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/capitulos.module.css";
import { stories } from "./storiesData";

// Función básica de corrección de IA (demo)
const correctWithAI = (text: string): string => {
  // Simulación de correcciones básicas
  let corrected = text
    .replace(/\bi\b/g, 'I') // Capitalizar 'i' sola
    .replace(/([.!?]\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase()) // Capitalizar después de puntuación
    .replace(/\s+/g, ' ') // Espacios múltiples a uno
    .trim();

  // Agregar punto final si no tiene
  if (!/[.!?]$/.test(corrected)) {
    corrected += '.';
  }

  return corrected;
};

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
  const [showComparison, setShowComparison] = useState(false);
  const [aiCorrectedContent, setAiCorrectedContent] = useState<string>("");

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

  const handleAICorrection = () => {
    if (editedChapter?.content) {
      const corrected = correctWithAI(editedChapter.content);
      setAiCorrectedContent(corrected);
      setShowComparison(true);
    }
  };

  const handleApplyCorrection = () => {
    setEditedChapter((prev) => prev ? { ...prev, content: aiCorrectedContent } : prev);
    setShowComparison(false);
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
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button
            onClick={handleAICorrection}
            title="IA: Corrige gramática y mejora la continuidad de la historia"
            style={{
              background: "var(--brand)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "bold",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              gap: "8px",
            }}
          >
            🤖 Kolla IA
          </button>
        </div>
      </header>

      <section className={styles.meta} style={{ width: "100%", maxWidth: "100%", padding: "0", margin: "0" }}>
        <article className={styles.card} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem", padding: "20px", boxSizing: "border-box" }}>
          <h2>Detalles del Capítulo</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="title" style={{ display: "block" }}>
              Título
            </label>
            <input
              id="title"
              type="text"
              value={editedChapter.title}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, title: e.target.value } : prev)}
              className={styles.input}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="summary" style={{ display: "block" }}>
              Resumen
            </label>
            <textarea
              id="summary"
              value={editedChapter.summary}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, summary: e.target.value } : prev)}
              className={styles.input}
              style={{ width: "100%", minHeight: "80px", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
            <label htmlFor="content" style={{ display: "block" }}>
              Contenido
            </label>
            {showComparison ? (
              <div style={{ width: "100%", maxWidth: "100%", display: "flex", gap: "16px", flex: 1 }}>
                <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "14px" }}>Texto Original</h4>
                  <textarea
                    id="content"
                    value={editedChapter.content || ""}
                    onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, content: e.target.value } : prev)}
                    className={styles.input}
                    style={{ width: "100%", minHeight: "400px", resize: "vertical", fontFamily: "monospace", fontSize: "14px", boxSizing: "border-box", flex: 1 }}
                    placeholder="Escribe el contenido completo del capítulo aquí..."
                  />
                </div>
                <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column" }}>
                  <h4 style={{ color: "var(--brand)", marginBottom: "10px", fontSize: "14px" }}>Corregido por IA</h4>
                  <textarea
                    value={aiCorrectedContent}
                    readOnly
                    style={{
                      width: "100%",
                      minHeight: "400px",
                      resize: "vertical",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      flex: 1,
                      padding: "10px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      background: "var(--bg-secondary)",
                    }}
                  />
                </div>
              </div>
            ) : (
              <textarea
                id="content"
                value={editedChapter.content || ""}
                onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, content: e.target.value } : prev)}
                className={styles.input}
                style={{ width: "100%", minHeight: "400px", resize: "vertical", fontFamily: "monospace", fontSize: "14px", boxSizing: "border-box", flex: 1 }}
                placeholder="Escribe el contenido completo del capítulo aquí..."
              />
            )}
            {showComparison && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
                <button onClick={handleApplyCorrection} className={styles.btnGhost} style={{ background: "var(--brand)", color: "var(--bg)" }}>
                  Aplicar Corrección
                </button>
                <button onClick={() => setShowComparison(false)} className={styles.btnGhost}>
                  Cancelar
                </button>
              </div>
            )}
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
