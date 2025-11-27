/* eslint-disable jsx-a11y/anchor-is-valid */
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";

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

interface Tag {
  id: string;
  name: string;
}

type Props = {
  storyId?: string;
};

const VerInfoHistoria: React.FC<Props> = ({ storyId: propStoryId }) => {
  const searchParams = useSearchParams();

  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recs, setRecs] = useState<Story[]>([]);
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
        // 1) Obtener historia (sin embed)
        const {
          data: storyData,
          error: storyErr,
        } = await supabase
          .from<Story>("stories")
          .select("id, title, description, cover_url, author_id")
          .eq("id", storyId)
          .single();

        if (storyErr || !storyData) {
          throw storyErr ?? new Error("Historia no encontrada.");
        }

        if (!mounted) return;
        setStory(storyData);

        // 2) Obtener autor por separado
        const { data: authorData, error: authorErr } = await supabase
          .from<Profile>("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", storyData.author_id)
          .single();

        if (authorErr) {
          // no stop app; se muestra sin autor si falla
          // eslint-disable-next-line no-console
          console.warn("No se pudo obtener autor:", authorErr.message);
          if (mounted) setAuthor(null);
        } else {
          if (mounted) setAuthor(authorData ?? null);
        }

        // 3) Tags (story_tags -> tags)
        const { data: tagData } = await supabase
          .from("story_tags")
          .select("tags(id, name)")
          .eq("story_id", storyId);

        if (mounted && Array.isArray(tagData)) {
          setTags(
            tagData.map((t: any) => ({
              id: t.tags.id as string,
              name: t.tags.name as string,
            }))
          );
        }

        // 4) Recomendaciones del mismo autor (excluir actual)
        const { data: recData } = await supabase
          .from<Story>("stories")
          .select("id, title, cover_url, author_id")
          .eq("author_id", storyData.author_id)
          .neq("id", storyData.id)
          .limit(6);

        if (mounted) setRecs(recData ?? []);

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

  if (loading) {
    return <div className="p-6">Cargando historia…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500" role="alert">{error}</div>;
  }

  if (!story) {
    return <div className="p-6">Historia no encontrada.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-10">
      {/* Header: portada + título + autor */}
      <div className="flex gap-6">
        <div className="w-40 h-56 relative rounded overflow-hidden bg-gray-200">
          {story.cover_url ? (
            <Image
              src={story.cover_url}
              alt={`Portada de ${story.title}`}
              fill
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Sin portada
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between py-2">
          <div>
            <h1 className="text-3xl font-bold">{story.title}</h1>
            {author ? (
              <p className="text-gray-600 mt-1">Por: {author.display_name ?? "—"}</p>
            ) : (
              <p className="text-gray-600 mt-1">Por: —</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {tags.map((t) => (
              <span
                key={t.id}
                className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm"
                aria-label={`Etiqueta ${t.name}`}
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Descripción</h2>
        <p className="text-gray-700 leading-relaxed">{story.description ?? "—"}</p>
      </section>

      {/* Recomendaciones */}
      {recs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Más del autor</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recs.map((r) => (
              <Link
                key={r.id}
                href={`/biblioteca/ver-info?id=${r.id}`}
                className="group flex flex-col items-center"
              >
                <div className="w-32 h-44 relative rounded overflow-hidden bg-gray-200">
                  {r.cover_url ? (
                    <Image
                      src={r.cover_url}
                      alt={`Portada de ${r.title}`}
                      fill
                      style={{ objectFit: "cover" }}
                      // no className transform that lints as unused style
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      Sin portada
                    </div>
                  )}
                </div>

                <p className="mt-2 text-sm text-center group-hover:underline">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default VerInfoHistoria;
