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
  return (
    <article className="chapterCard" data-published={chapter.isPublished} tabIndex={0} aria-label={`Capítulo ${chapter.number}: ${chapter.title}`}>
      <div className="chapterHeader">
        <span className="chNumber">#{chapter.number}</span>
        <h3 className="chTitle">{chapter.title}</h3>
        <span className={chapter.isPublished ? "badgeOk" : "badgeDraft"} title={chapter.isPublished ? "Publicado" : "Borrador"}>
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
        <Link href={`/escritura/capitulos/${storyId}/${chapter.id}/editar`}>
          <button className="btnGhost">Editar</button>
        </Link>
      </footer>
    </article>
  );
}
