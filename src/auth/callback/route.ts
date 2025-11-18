import { NextResponse } from "next/server";
import { createClient } from "../../utils/supabase/server";

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect("/auth/login");

  const profileData = {
    identificacion: user.id,
    correo_electronico: user.email,
    nombre_para_mostrar: user.user_metadata.full_name ?? "",
    avatar_url: user.user_metadata.avatar_url ?? "",
    proveedor: "google",
    id_proveedor: user.identities?.[0]?.id ?? null,
    esta_activo: true,
    role: "user",
  };

  await supabase.from("perfiles").upsert(profileData);

  return NextResponse.redirect("/");
}
