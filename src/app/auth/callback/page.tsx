// src/app/auth/callback/page.tsx
'use client';
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // procesa la URL y guarda la sesión en el cliente
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (!code) throw new Error("No auth code found");

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        const user = data.user;
        if (!user) return router.push("/login?error=no-user");

        const role = url.searchParams.get("role") || "reader";

        // comprobar si ya existe perfil
        const { data: existing, error: selErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (selErr) console.warn(selErr);

        if (!existing) {
          const meta: Record<string, unknown> = user.user_metadata || {};
          await supabase.from("profiles").insert([{
            id: user.id,
            username: (meta.name || user.email || "").toString().replace(/\s+/g, "").toLowerCase(),
            display_name: meta.name || "",
            email: user.email,
            avatar_url: meta.avatar_url || meta.picture || "",
            role,
            provider: "google",
            provider_id: user.id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        }

        router.push("/biblioteca");
      } catch (e) {
        console.error("OAuth callback error", e);
        router.push("/login?error=oauth");
      }
    })();
    }, [router]);

  return <div>Procesando inicio de sesión...</div>;
}
