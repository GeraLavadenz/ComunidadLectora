// src/app/biblioteca/ver-info/[id]/page.tsx
import React from "react";
import VerInfoHistoria from "@/modules/biblioteca/pages/VerInfoHistoria";

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  const { id } = params;
  // Pasamos el id como prop al componente cliente
  // VerInfoHistoria ya soporta recibir storyId prop
  return <VerInfoHistoria storyId={id} />;
}
