// src/app/api/library/meta/route.ts
import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabaseClient'; 
export async function GET() {
  try {
    const { data: genresData, error: genresError } = await supabase
      .from('tags')
      .select('id, name')
      .eq('type', 'genre');

    if (genresError) {
      console.error('Error cargando géneros:', genresError);
      return NextResponse.json({ error: 'Error cargando géneros' }, { status: 500 });
    }

    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('id, name')
      .eq('type', 'tag');

    if (tagsError) {
      console.error('Error cargando etiquetas:', tagsError);
      return NextResponse.json({ error: 'Error cargando etiquetas' }, { status: 500 });
    }

    return NextResponse.json({ genres: genresData ?? [], tags: tagsData ?? [] });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('api/library/meta ERROR:', err);
    return NextResponse.json({ error: errMsg ?? 'Error interno' }, { status: 500 });
  }
}
