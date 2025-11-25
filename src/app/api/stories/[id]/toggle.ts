// pages/api/stories/[id]/toggle.ts
import type { NextApiRequest, NextApiResponse } from "next";
// uso el cliente que subiste — ruta local: /mnt/data/supabaseClient.ts
import supabase from "/mnt/data/supabaseClient.ts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Invalid story id" });

  // Requerimos token en header Authorization: Bearer <access_token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];

  // obtener usuario desde Supabase usando el token
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    console.error("auth.getUser error:", userErr);
    return res.status(401).json({ error: "Invalid session / token" });
  }
  const user = userData.user;

  // obtener historia y validar autoría
  const { data: story, error: storyErr } = await supabase
    .from("stories")
    .select("id, author_id, status")
    .eq("id", id)
    .single();

  if (storyErr) {
    console.error("fetch story error:", storyErr);
    return res.status(500).json({ error: "Could not fetch story" });
  }
  if (!story) return res.status(404).json({ error: "Story not found" });

  if (story.author_id !== user.id) {
    return res.status(403).json({ error: "Forbidden: you are not the author" });
  }

  // toggle status
  const newStatus = story.status === "published" ? "draft" : "published";

  const { data: updated, error: updateErr } = await supabase
    .from("stories")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (updateErr) {
    console.error("update story error:", updateErr);
    return res.status(500).json({ error: "Could not update story status" });
  }

  return res.status(200).json({ story: updated });
}