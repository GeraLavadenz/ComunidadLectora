import React from "react";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Chapter {
  id: string;
  title: string;
  content: string;
  chapter_number: number;
}

interface Story {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
}

export default async function ReadStoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // Obtener historia por slug
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id, title, slug, cover_url")
    .eq("slug", slug)
    .single();

  if (storyError || !story) return notFound();

  // Obtener capítulos publicados
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, content, chapter_number")
    .eq("story_id", story.id)
    .eq("is_published", true)
    .order("chapter_number", { ascending: true });

  if (!chapters || chapters.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
        <p>No hay capítulos publicados aún.</p>
      </div>
    );
  }

  // Primer capítulo por defecto
  const firstChapter: Chapter = chapters[0];

  return (
    <div className="max-w-3xl mx-auto p-6">
      {story.cover_url && (
        <img
          src={story.cover_url}
          alt={story.title}
          className="w-full rounded-lg mb-6"
        />
      )}

      <h1 className="text-4xl font-bold mb-2">{story.title}</h1>

      {/* Navegación de capítulos */}
      <nav className="my-6 flex flex-wrap gap-2">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/leer/${slug}/capitulo/${ch.chapter_number}`}
            className="px-3 py-1 border rounded hover:bg-neutral-800 transition"
          >
            Capítulo {ch.chapter_number}
          </Link>
        ))}
      </nav>

      {/* Vista previa del primer capítulo */}
      <article className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          Capítulo {firstChapter.chapter_number}: {firstChapter.title}
        </h2>

        <div className="prose prose-invert whitespace-pre-wrap">
          {firstChapter.content}
        </div>
      </article>
    </div>
  );
}
