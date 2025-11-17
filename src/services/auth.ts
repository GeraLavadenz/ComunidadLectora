// src/services/auth.ts
import { supabase } from "@/lib/supabase";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: "reader" | "author";
};

// REGISTRO NORMAL (email + password)
export async function registerUser({ name, email, password, role }: RegisterPayload) {
  // 1) Crear usuario en auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre: name, role } }
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("No se pudo crear el usuario.");

  // 2) Crear perfil en tu tabla "profiles"
  const { error: insertErr } = await supabase.from("profiles").insert([
    {
      id: user.id,
      username: name.replace(/\s+/g, "").toLowerCase(),
      display_name: name,
      email: email,
      role,
      provider: "email",
      provider_id: user.id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  if (insertErr) throw insertErr;

  return user;
}

// LOGIN CON GOOGLE
export async function signInWithGoogle(role: "reader" | "author") {
  const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" }
    }
  });

  if (error) throw error;

  return data;
}
