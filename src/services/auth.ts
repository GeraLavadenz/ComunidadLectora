// /services/auth.ts
import { supabase } from "@/lib/supabase";

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role?: "reader" | "author" | "moderator" | "admin";
};

export async function registerUser(input: NewUserInput) {
  const { name, email, password, role = "reader" } = input;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
        role,
      },
    },
  });

  if (error) throw new Error(error.message);

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        display_name: name,
        email,
        role,
        photo_url: data.user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        status: "active",
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // opcional: revertir el signup si lo considerás necesario
    }
  }

  return data.user;
}

/** Sign-in/up con Google (inicia flujo OAuth). */
export async function signInWithGoogle(defaultRole: NewUserInput["role"] = "reader") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // recomiendo NO usar redirectTo salvo que hayas agregado EXACTAMENTE esa URL en Google Console
      // redirectTo: `${window.location.origin}/biblioteca`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    if (error.message.includes("Unsupported provider")) {
      throw new Error(
        "Google OAuth no está configurado en Supabase. Ve a tu dashboard de Supabase > Authentication > Providers y habilita Google OAuth."
      );
    }
    throw new Error(error.message);
  }

  return data;
}
