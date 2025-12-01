/* eslint-disable jsx-a11y/anchor-is-valid */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import "@/modules/biblioteca/styles/VerInfoHistoria.css";

interface Profile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface Story {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  author_id: string;
}

interface TagData {
  id: string;
  name: string;
  type: string; // genre | tag
}

interface Chapter {
  id: string;
  title?: string | null;
  chapter_number?: number | null;
  is_published?: boolean | null;
  published_at?: string | null;
}

type Props = {
  storyId?: string;
};

const VerInfoHistoria: React.FC<Props> = ({ storyId: propStoryId }) => {
  const searchParams = useSearchParams();

  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [tags, setTags] = useState<TagData[]>([]);
  const [recs, setRecs] = useState<Story[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const storyId =
    propStoryId ??
    (typeof window !== "undefined" ? searchParams?.get("id") ?? undefined : undefined);

  useEffect(() => {
    let mounted = true;

    if (!storyId) {
      setError("No se recibió ID de la historia.");
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const loadData = async (): Promise<void> => {
      setLoading(true);
      try {
        // 1) Obtener historia
        const { data: storyData, error: storyErr } = await supabase
          .from<Story>("stories")
          .select("id, title, description, cover_url, author_id")
          .eq("id", storyId)
          .single();

        if (storyErr || !storyData) {
          throw storyErr ?? new Error("Historia no encontrada.");
        }

        if (!mounted) return;
        setStory(storyData);

        // 2) Obtener autor
        const { data: authorData } = await supabase
          .from<Profile>("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", storyData.author_id)
          .single();

        if (mounted) setAuthor(authorData ?? null);

        // 3) Obtener Tags + Géneros (tags.type)
        const { data: tagData } = await supabase
          .from("story_tags")
          .select("tags(id, name, type)")
          .eq("story_id", storyId);

        if (mounted && Array.isArray(tagData)) {
          setTags(
            tagData.map((t: any) => ({
              id: t.tags.id,
              name: t.tags.name,
              type: t.tags.type,
            }))
          );
        }

        // 4) Recomendaciones
        const { data: recData } = await supabase
          .from<Story>("stories")
          .select("id, title, cover_url, author_id")
          .eq("author_id", storyData.author_id)
          .neq("id", storyData.id)
          .limit(6);

        if (mounted) setRecs(recData ?? []);

        // 5) Capítulos
        const { data: chapterData } = await supabase
          .from<Chapter>("chapters")
          .select("id, title, chapter_number, is_published, published_at")
          .eq("story_id", storyId)
          .order("chapter_number", { ascending: true });

        if (mounted) setChapters(chapterData ?? []);

        setError(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al cargar la información de la historia";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [storyId]);

  const publishedChapters = chapters.filter((c) => c.is_published);
  const publishedCount = publishedChapters.length;

  if (loading) {
    return <div className="vih-container">Cargando historia…</div>;
  }

  if (error) {
    return (
      <div className="vih-container" role="alert">
        <div className="vih-section">{error}</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="vih-container">
        <div className="vih-section">Historia no encontrada.</div>
      </div>
    );
  }

  return (
    <div className="vih-container">
      {/* Header */}
      <header className="vih-header" aria-labelledby={`story-title-${story.id}`}>
        <div className="vih-cover">
          {story.cover_url ? (
            <Image
              src={story.cover_url}
              alt={`Portada de ${story.title}`}
              fill
              className="vih-cover-img"
            />
          ) : (
            <div className="vih-cover-placeholder" />
          )}
        </div>

        <div className="vih-info">
          <h1 id={`story-title-${story.id}`} className="vih-title">
            {story.title}
          </h1>

          <p className="vih-author">Por: {author?.display_name ?? "—"}</p>

          {/* GÉNEROS */}
          <div className="vih-genres">
            {tags
              .filter((t) => t.type === "genre")
              .map((t) => (
                <span key={t.id} className="vih-genre">
                  {t.name}
                </span>
              ))}
          </div>

          {/* TAGS */}
          <div className="vih-tags">
            {tags
              .filter((t) => t.type !== "genre")
              .map((t) => (
                <span key={t.id} className="vih-tag">
                  {t.name}
                </span>
              ))}
          </div>
        </div>
      </header>

      {/* Descripción */}
      <section className="vih-section" aria-labelledby="desc-heading">
        <h2 id="desc-heading">Descripción</h2>
        <p className="vih-description">{story.description ?? "—"}</p>
      </section>

      {/* Capítulos */}
      <section className="vih-section" aria-labelledby="chapters-heading">
        <div className="vih-chapters-heading">
          <h2 id="chapters-heading">Capítulos</h2>
          <div className="vih-chapter-count">
            Publicados: <strong>{publishedCount}</strong>
          </div>
        </div>

        {chapters.length === 0 ? (
          <p className="vih-description">Aún no hay capítulos.</p>
        ) : (
          <ol className="vih-chapter-list">
            {chapters.map((c) => {
              const isPub = Boolean(c.is_published);
              const href = isPub
                ? `/biblioteca/leer?storyId=${encodeURIComponent(story.id)}&chapterId=${encodeURIComponent(c.id)}`
                : "#";

              return (
                <li key={c.id} className="vih-chapter-item">
                  <div className="vih-chapter-meta">
                    <div className="vih-chapter-number">
                      Cap. {c.chapter_number ?? "—"} {isPub ? "" : "(borrador)"}
                    </div>

                    <div className="vih-chapter-title">{c.title ?? "Sin título"}</div>

                    {isPub && c.published_at && (
                      <div className="vih-chapter-date">
                        {new Date(c.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div>
                    {isPub ? (
                      <Link href={href} className="vih-btn read">
                        Leer
                      </Link>
                    ) : (
                      <button className="vih-btn disabled" disabled>
                        No publicado
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Recomendaciones */}
      {recs.length > 0 && (
        <section className="vih-section" aria-labelledby="recs-heading">
          <h2 id="recs-heading">Más del autor</h2>

          <div className="vih-recs-grid">
            {recs.map((r) => (
              <Link
                key={r.id}
                href={`/biblioteca/ver-info/${encodeURIComponent(r.id)}`}
                className="vih-rec"
              >
                <div className="vih-rec-cover">
                  {r.cover_url ? (
                    <Image src={r.cover_url} alt={r.title} fill className="vih-cover-img" />
                  ) : (
                    <div className="vih-cover-placeholder" />
                  )}
                </div>

                <p className="vih-rec-title">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default VerInfoHistoria;
