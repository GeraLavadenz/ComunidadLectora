"use client";
import React from "react";
import { useParams } from "next/navigation";
import styles from "../../../../modules/escritura/styles/misHistorias.module.css";
import { stories } from "../../../../modules/escritura/storiesData";
import { motion } from "framer-motion";

const VerHistoria = () => {
  const params = useParams();
  const storyId = params.id as string;
  const story = stories.find((s) => s.id === storyId);

  if (!story) {
    return (
      <main className={styles.container}>
        <h1 className={styles.title}>Historia no encontrada</h1>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{story.title}</h1>

      <div className={styles.formContainer} style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Autor:</strong> {story.author}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Géneros:</strong> {story.genres.join(", ")}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Etiquetas:</strong> {story.tags.join(", ")}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Creado:</strong> {new Date(story.createdAt).toLocaleDateString("es-ES")}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Actualizado:</strong> {new Date(story.updatedAt).toLocaleDateString("es-ES")}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Descripción:</strong>
          <p style={{ marginTop: "0.5rem", lineHeight: "1.6" }}>{story.description}</p>
        </div>
      </div>

      <section>
        <h2 style={{ color: "var(--brand)", marginBottom: "1rem", fontSize: "1.5rem" }}>Capítulos</h2>
        {story.chapters.length === 0 ? (
          <div className={styles.card} style={{ textAlign: "center", padding: "2rem" }}>
            <p>No hay capítulos publicados aún.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {story.chapters
              .filter((chapter) => chapter.isPublished)
              .map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  className={styles.card}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <div className={styles.cardHeader}>
                    <h3>Capítulo {chapter.number}: {chapter.title}</h3>
                    <span className={styles.badge}>
                      {chapter.isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
                    {chapter.summary}
                  </p>
                  {chapter.publishedAt && (
                    <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                      <strong>Publicado:</strong> {new Date(chapter.publishedAt).toLocaleDateString("es-ES")}
                    </p>
                  )}
                  {chapter.content && (
                    <div style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      background: "var(--surface-2)",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--stroke)",
                      maxHeight: "300px",
                      overflow: "auto",
                      lineHeight: "1.6"
                    }}>
                      <p style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.9rem" }}>
                        {chapter.content}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default VerHistoria;
