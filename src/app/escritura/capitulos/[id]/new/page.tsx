// src/app/escritura/capitulos/[id]/new/page.tsx
"use client";

import React from "react";
import NewChapterFromModules from "@/modules/escritura/pages/CreaCapitulos"; // IMPORTA desde modules
import { useParams } from "next/navigation";

export default function NewPageWrapper() {
  // next app router pasa params en useParams en cliente
  const params = useParams() as { id?: string };
  const storyId = params?.id ?? "";

  // Renderiza el componente que vive en src/modules (client component)
  return <NewChapterFromModules storyId={storyId} />;
}
