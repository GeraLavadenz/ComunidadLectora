"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../styles/capitulos.css";
import "../styles/editarCapitulo.css";
import { stories } from "../storiesData";

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
    return <div className="page">Capítulo no encontrado</div>;
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
    <main className="page">
      <header className="hero">
        <div className="heroGlow" />
        <div className="heroContent">
          <h1 className="title">Editar Capítulo #{editedChapter.number}</h1>
          <p className="subtitle">
            Historia: {story.title} por {story.author}
          </p>
        </div>
        <div className="aiButtonContainer">
          <button
            onClick={handleAICorrection}
            title="IA: Corrige gramática y mejora la continuidad de la historia"
            className="aiButton"
          >
            🤖 Kolla IA
          </button>
        </div>
      </header>

      <section className="meta metaSection">
        <article className="card cardArticle">
          <h2>Detalles del Capítulo</h2>
          <div className="formGroup">
            <label htmlFor="title" className="label">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={editedChapter.title}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, title: e.target.value } : prev)}
              className="input input"
            />
          </div>
          <div className="formGroup">
            <label htmlFor="summary" className="label">
              Resumen
            </label>
            <textarea
              id="summary"
              value={editedChapter.summary}
              onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, summary: e.target.value } : prev)}
              className="input textarea"
            />
          </div>
          <div className="formGroup">
            <label htmlFor="content" className="label">
              Contenido
            </label>
            {showComparison ? (
              <div className="comparisonContainer">
                <div className="comparisonColumn">
                  <h4 className="comparisonHeader comparisonHeaderOriginal">Texto Original</h4>
                  <textarea
                    id="content"
                    value={editedChapter.content || ""}
                    onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, content: e.target.value } : prev)}
                    className="input contentTextarea"
                    placeholder="Escribe el contenido completo del capítulo aquí..."
                  />
                </div>
                <div className="comparisonColumn">
                  <h4 className="comparisonHeader comparisonHeaderCorrected">Corregido por IA</h4>
                  <textarea
                    value={aiCorrectedContent}
                    readOnly
                    className="correctedTextarea"
                  />
                </div>
              </div>
            ) : (
              <textarea
                id="content"
                value={editedChapter.content || ""}
                onChange={(e) => setEditedChapter((prev) => prev ? { ...prev, content: e.target.value } : prev)}
                className="input contentTextarea"
                placeholder="Escribe el contenido completo del capítulo aquí..."
              />
            )}
            {showComparison && (
              <div className="correctionButtons">
                <button onClick={handleApplyCorrection} className="btnGhost" style={{ background: "var(--brand)", color: "var(--bg)" }}>
                  Aplicar Corrección
                </button>
                <button onClick={() => setShowComparison(false)} className="btnGhost">
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div className="publishedToggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={editedChapter.isPublished}
                onChange={handlePublishToggle}
              />
              <span>Publicado</span>
            </label>
            {editedChapter.isPublished && editedChapter.publishedAt && (
              <span className="date">
                Publicado el {new Date(editedChapter.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </article>
      </section>

      <section className="bottomSection">
        <div className="bottomButtons">
          <button onClick={handleSave} className="btnGhost" style={{ background: "var(--brand)", color: "var(--bg)" }}>
            Guardar Cambios
          </button>
          <button onClick={() => router.back()} className="btnGhost">
            Cancelar
          </button>
        </div>
      </section>


    </main>
  );
}
