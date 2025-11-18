// app/auth/callback/page.tsx (o pages/auth/callback.tsx si usas pages/)
"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Esto procesa la URL devuelta por el proveedor y establece la sesión
      const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (error) {
        console.error("Error al procesar callback OAuth:", error);
        // redirige a login con mensaje
        router.push("/login?error=oauth");
        return;
      }
      // Todo OK => llévalo a la biblioteca
      router.push("/biblioteca");
    })();
  }, [router]);

  return <p>Procesando...</p>;
}
