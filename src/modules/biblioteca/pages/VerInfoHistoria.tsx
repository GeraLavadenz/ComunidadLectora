// C:\Users\PC\Documents\CuentaUni\comunidad_lectora\src\modules\biblioteca\pages\VerInfoHistoria.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

type Tag = { id: string; name: string };
type Profile = { display_name?: string; avatar_url?: string };
type Story = {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  author_id?: string;
  profiles?: Profile | null;
};

export default function VerInfoHistoria({ storyId: propStoryId }: { storyId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recs, setRecs] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determinar ID: prop > ?id= > URL fallback
  const storyId =
    propStoryId ??
    (typeof window !== 'undefined' ? searchParams?.get('id') ?? undefined : undefined);

  useEffect(() => {
    if (!storyId) {
      setError('No se recibió ID de la historia.');
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        // 1) Obtener historia + autor
        const { data: storyData, error: storyErr } = await supabase
          .from('stories')
          .select(`
            id,
            title,
            description,
            cover_url,
            author_id,
            profiles (
              display_name,
              avatar_url
            )
          `)
          .eq('id', storyId)
          .single();

        if (storyErr || !storyData) {
          throw storyErr ?? new Error('Historia no encontrada');
        }

        // 2) Obtener tags (story_tags -> tags)
        const { data: tagData } = await supabase
          .from('story_tags')
          .select('tags(id, name)')
          .eq('story_id', storyId);

        // 3) Recomendaciones: otras stories del mismo autor
        const { data: recData } = await supabase
          .from('stories')
          .select('id, title, cover_url')
          .eq('author_id', storyData.author_id)
          .neq('id', storyData.id)
          .limit(6);

        if (!mounted) return;
        setStory(storyData);
        setTags((tagData ?? []).map((t: any) => ({ id: t.tags.id, name: t.tags.name })));
        setRecs(recData ?? []);
        setError(null);
      } catch (err: any) {
        setError(err.message ?? 'Error al cargar historia');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [storyId]);

  if (loading) return <div className="p-6">Cargando historia…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!story) return <div className="p-6">Historia no encontrada.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex gap-6">
        <div className="w-40 h-56 bg-gray-200 rounded overflow-hidden">
          {story.cover_url ? (
            <Image
              src={story.cover_url}
              width={300}
              height={400}
              alt={story.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
              Sin portada
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold">{story.title}</h1>
            {story.profiles && (
              <p className="text-gray-600 mt-1">Por: {story.profiles.display_name}</p>
            )}
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {tags.map((t) => (
              <span key={t.id} className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Descripción</h2>
        <p className="text-gray-700 leading-relaxed">{story.description ?? '—'}</p>
      </div>

      {recs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Más del autor</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recs.map((r) => (
              <Link key={r.id} href={`/biblioteca/ver-info?id=${r.id}`} className="group flex flex-col items-center">
                <div className="w-32 h-44 bg-gray-200 rounded overflow-hidden">
                  {r.cover_url ? (
                    <Image src={r.cover_url} width={200} height={300} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Sin portada</div>
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
}
