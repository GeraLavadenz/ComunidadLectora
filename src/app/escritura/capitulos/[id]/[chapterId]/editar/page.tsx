import React from "react";
import Header from "@/components/header/header";
import Footer from "@/components/footer/footer";
import EditarCapitulo from "@/modules/escritura/pages/editarCapitulo";

interface Props {
  params: { id: string; chapterId: string };
}

export default function Page({ params }: Props) {
  const { id, chapterId } = params;
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <EditarCapitulo storyId={id} chapterId={chapterId} />
      </main>
      <Footer />
    </div>
  );
}
