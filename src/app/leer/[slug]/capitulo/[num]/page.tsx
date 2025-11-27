// /app/leer/[slug]/page.tsx
import React from "react";
import supabase from "@/lib/supabaseClient";
import type { Metadata } from "next";

interface Params { slug: string; }

export async function generateMetadata({ params }: { params: Params }) : Promise<Metadata> {
  const { slug } = await params; // await aquí también si usas params
  // opcional: fetch título para metadata
  return { title: `Leer — ${slug}` };
}

export default async function ReadStoryPage({ params }: { params: Params }) {
  // ✨ CORRECCIÓN: await antes de usar params.slug
  const { slug } = await params;

  // ejemplo: obtener capítulo por slug (ajusta el from/select a tu esquema)
  const { data, error } = await supabase
    .from("chapters")
    .select("id, title, content, story_id, chapter_number")
    .eq("slug", slug)
    .single();

  if (error) {
    // maneja error de forma amigable en server component
    return (
      <div style={{ padding: 20 }}>
        <h1>Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 20 }}>
        <h1>No encontrado</h1>
        <p>Capítulo no existe.</p>
      </div>
    );
  }

  // render
  return (
    <main style={{ padding: 20 }}>
      <h1>{data.title}</h1>
      <small>Cap. {data.chapter_number}</small>
      <article dangerouslySetInnerHTML={{ __html: data.content ?? "" }} />
    </main>
  );
}
