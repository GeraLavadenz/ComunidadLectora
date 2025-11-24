import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: genresData, error: genresError } = await supabase
      .from("tags")
      .select("id, name, type")
      .eq("type", "genre")
      .order("name");

    if (genresError) throw genresError;

    const genres = (genresData ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      slug: g.name.toLowerCase().replace(/\s+/g, "-"),
    }));

    const { data: tagsData, error: tagsError } = await supabase
      .from("tags")
      .select("id, name, type")
      .eq("type", "tag")
      .order("name");

    if (tagsError) throw tagsError;

    const tags = (tagsData ?? []).map((t: any) => ({ id: t.id, name: t.name }));

    return NextResponse.json({ genres, tags });
  } catch (err: any) {
    console.error("/api/meta error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
