import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role (solo server)
);

export async function GET() {
  try {
    // --- Géneros ---
    const { data: genresData, error: genresError } = await supabase
      .from("tags")
      .select("id, name, type")
      .eq("type", "genre")
      .order("name", { ascending: true });

    if (genresError) throw genresError;

    const genres = (genresData ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.name.toLowerCase().replace(/\s+/g, "-"),
    }));

    // --- Etiquetas ---
    const { data: tagsData, error: tagsError } = await supabase
      .from("tags")
      .select("id, name, type")
      .eq("type", "tag")
      .order("name", { ascending: true });

    if (tagsError) throw tagsError;

    const tags = (tagsData ?? []).map((t) => ({
      id: t.id,
      name: t.name,
    }));

    // --- Respuesta final ---
    return NextResponse.json({
      genres,
      tags,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
