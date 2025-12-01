// app/genres/[id]/[slug]/page.tsx (server component)
import { redirect } from 'next/navigation';

export default function GenreRedirectPage({ params }: { params: { id: string; slug: string } }) {
  const { id } = params;

  // Redirige a la biblioteca con query param "genre"
  // Asegúrate que app/biblioteca/page.tsx lea searchParams.genre
  redirect(`/biblioteca?genre=${encodeURIComponent(id)}`);
}
