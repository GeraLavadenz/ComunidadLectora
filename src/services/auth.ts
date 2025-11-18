// src/services/auth.ts
import { supabase } from "@/lib/supabaseClient";

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role?: "reader" | "author" | "moderator" | "admin";
};

/**
 * Registro por email + password.
 * Crea usuario en auth de Supabase y upsertea perfil en la tabla `perfiles`.
 */
export async function registerUser(input: NewUserInput) {
  const { name, email, password, role = "reader" } = input;

  // signUp en supabase (cliente)
  const { data, error: signErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_para_mostrar: name,
        role,
      },
    },
  });

  if (signErr) throw signErr;
  // En apps con confirmación por correo: user puede ser null hasta confirmar.
  const user = data?.user ?? null;

  // Si user existe, insertamos/enlazamos perfil en la tabla `perfiles`.
  // Si la app usa confirmación por email y user es null, podemos esperar a webhook o usar
  // la metadata para crear perfil en el callback. Aquí intentamos crear si tenemos user.
  if (user) {
    const perfil = {
      identificacion: user.id, // UUID
      nombre_de_usuario: email.split("@")[0],
      nombre_para_mostrar: name,
      correo_electronico: email,
      avatar_url: null,
      biografia: null,
      role,
      proveedor: "email",
      id_proveedor: null,
      contraseña_hash: null,
      está_activo: true,
      último_inicio_de_sesión: new Date().toISOString(),
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("perfiles")
      .upsert(perfil, { onConflict: "identificacion" });

    if (upsertErr) {
      // No abortamos el registro por un fallo en el perfil; lanzamos para que el front lo muestre.
      throw upsertErr;
    }
  }

  return user;
}

/**
 * Inicia flujo OAuth con Google. 
 *. signInWithOAuth devuelve una URL de redirección; aquí la usamos para redirigir.
 * Asegúrate de configurar el provider Google en Supabase (Client ID/Secret) y redirect URLs.
 */
export async function signInWithGoogle(defaultRole: NewUserInput["role"] = "reader") {
  const redirectTo = window.location.origin + "/auth/callback"; // ruta donde procesarás la sesión tras OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) throw error;

  // signInWithOAuth devuelve una url a la que redirigir
  if (data?.url) {
    // redirige el navegador al proveedor
    window.location.href = data.url;
    return;
  }

  // Si no hay url, devolvemos data por compatibilidad
  return data;
}
