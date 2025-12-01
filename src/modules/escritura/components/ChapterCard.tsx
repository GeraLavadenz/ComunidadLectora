import React from "react";
import Link from "next/link";

interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  isPublished: boolean;
  publishedAt: string;
}

interface ChapterCardProps {
  chapter: Chapter;
  storyId: string;
}

export default function ChapterCard({ chapter, storyId }: ChapterCardProps) {
  const readerHref = `/biblioteca/leer?storyId=${encodeURIComponent(storyId)}&chapterId=${encodeURIComponent(chapter.id)}`;

  return (
    <article
      className="chapterCard"
      data-published={chapter.isPublished}
      tabIndex={0}
      aria-label={`Capítulo ${chapter.number}: ${chapter.title}`}
    >
      <div className="chapterHeader">
        <span className="chNumber">#{chapter.number}</span>
        <h3 className="chTitle">{chapter.title}</h3>
        <span
          className={chapter.isPublished ? "badgeOk" : "badgeDraft"}
          title={chapter.isPublished ? "Publicado" : "Borrador"}
        >
          {chapter.isPublished ? "Publicado" : "Borrador"}
        </span>
      </div>

      <p className="chSummary">{chapter.summary}</p>

      <footer className="chFooter">
        {chapter.isPublished ? (
          <time className="date" dateTime={chapter.publishedAt}>
            Publicado el {chapter.publishedAt && new Date(chapter.publishedAt).toLocaleDateString()}
          </time>
        ) : (
          <em className="pending">Pendiente de publicación</em>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/escritura/capitulos/${storyId}/${chapter.id}/editar`} legacyBehavior>
            <button className="btnGhost" aria-label={`Editar capítulo ${chapter.number}`}>Editar</button>
          </Link>

          {/* Ver: lleva al lector ubicado en este capítulo */}
          {/*<Link href={readerHref} legacyBehavior>
            <button className="btn outline" aria-label={`Ver capítulo ${chapter.number}`}>Ver</button>
          </Link>*/}

          {/* Opcional: abrir en nueva pestaña (descomenta si lo prefieres)
          <a href={readerHref} target="_blank" rel="noopener noreferrer">
            <button className="btn outline">Ver (nueva pestaña)</button>
          </a>
          */}
        </div>
      </footer>
    </article>
  );
}
