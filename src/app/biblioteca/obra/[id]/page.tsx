// app/biblioteca/obra/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";

export default async function Page(props: any) {
  // 🔥 SOLUCIÓN CRUCIAL
  const params = await props.params;
  const id = params.id;

  if (!id) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Error</h1>
        <p>ID faltante en la ruta.</p>
      </main>
    );
  }

  // cliente público, sin cookies → 100% compatible con Turbopack
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Error al consultar historia</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Historia no encontrada</h1>
        <p>ID: {id}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </main>
  );
}
