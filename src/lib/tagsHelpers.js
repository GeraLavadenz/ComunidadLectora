import { supabase } from "@/lib/supabaseClient";

export async function ensureTag(name, type = "tag") {
  const clean = name.trim();
  if (!clean) throw new Error("tag vacío");

  // Buscar tag existente
  const { data: found, error: err1 } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", clean)
    .maybeSingle();

  if (err1) throw err1;
  if (found?.id) return found.id;

  // Insertar nuevo tag
  const { data: inserted, error: err2 } = await supabase
    .from("tags")
    .insert([{ name: clean, type }])
    .select("id")
    .single();

  if (err2) {
    // Puede ser conflicto por unique
    if (err2.code === "23505") {
      const { data: retry } = await supabase
        .from("tags")
        .select("id")
        .ilike("name", clean)
        .maybeSingle();
      return retry?.id;
    }
    throw err2;
  }

  return inserted.id;
}

export async function linkStoryTag(storyId, tagId) {
  const { error } = await supabase
    .from("story_tags")
    .insert([{ story_id: storyId, tag_id: tagId }])
    .onConflict(["story_id", "tag_id"])
    .ignore();

  if (error) throw error;
}

export async function unlinkStoryTag(storyId, tagId) {
  const { error } = await supabase
    .from("story_tags")
    .delete()
    .match({ story_id: storyId, tag_id: tagId });

  if (error) throw error;
}

export async function fetchTagSuggestions(q, type = "tag") {
  if (!q.trim()) return [];
  const { data, error } = await supabase
    .from("tags")
    .select("id,name")
    .ilike("name", `%${q.trim()}%`)
    .eq("type", type)
    .limit(10);

  if (error) throw error;
  return data;
}
