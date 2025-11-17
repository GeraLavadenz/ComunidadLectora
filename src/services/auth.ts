// src/services/auth.ts
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

  if (error) {
    throw new Error(error.message);
  }

  // Insert user profile into profiles table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        display_name: name,
        email,
        role,
        photo_url: data.user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        status: 'active',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Optionally, you might want to delete the user if profile creation fails
    }
  }

  return data.user;
}

/** Sign-in/up con Google: crea/actualiza perfil en Supabase. */
export async function signInWithGoogle(defaultRole: NewUserInput["role"] = "reader") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/biblioteca`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    if (error.message.includes('Unsupported provider')) {
      throw new Error('Google OAuth no está configurado en Supabase. Ve a tu dashboard de Supabase > Authentication > Providers y habilita Google OAuth.');
    }
    throw new Error(error.message);
  }

  // Note: Profile creation for OAuth will be handled in a database trigger or auth hook
  // since the user might not be immediately available after OAuth redirect

  return data;
}
