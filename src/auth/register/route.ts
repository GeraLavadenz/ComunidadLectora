// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "../../utils/supabase/server";

type Body = { name: string; email: string; password: string };

export async function POST(req: Request) {
  const supabase = createClient();
  const body: Body = await req.json();

  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // 1) Registrar en Auth
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    // opcional: options: { emailRedirectTo: ... }
  });

  if (signError) return NextResponse.json({ error: signError.message }, { status: 400 });

  const userId = signData.user?.id;
  if (!userId) return NextResponse.json({ error: "No se obtuvo el id del usuario" }, { status: 500 });

  // 2) Insertar en tabla 'perfiles' (solo los campos que tienes desde el form)
  // Ajusta los nombres de columna si tu DB usa otros.
  const profileInsert = {
    identificacion: userId,               // id del auth
    nombre_para_mostrar: name,
    correo_electronico: email,
    proveedor: "email",
    esta_activo: true,
    role: "user",
    // avatar_url, biografia, nombre_de_usuario, id_proveedor quedan null por ahora
  };

  const { error: profileError } = await supabase
    .from("perfiles")
    .insert([profileInsert]);

  if (profileError) {
    // opcional: eliminar el usuario auth si falla el insert para evitar cuentas huérfanas
    await supabase.auth.api.deleteUser(userId).catch(() => {});
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
