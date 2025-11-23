import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, type')
    .eq('type', 'genre')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    data.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.name.toLowerCase().replace(/\s+/g, '-'),
    }))
  );
}
