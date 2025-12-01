// app/biblioteca/leer/page.tsx
import React from 'react';
// importa tu cliente / componente lector
import LeerPage from '@/modules/biblioteca/pages/leer'; 
// ajusta la ruta si tu alias @ o path es distinto

export default function Page() {
  // Page es un Server Component que simplemente renderiza tu componente cliente
  return <LeerPage />;
}
