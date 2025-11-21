import Header from "@/components/header/header";
import Footer from "@/components/footer/footer";
import EditarCapitulo from "../../../../../../modules/escritura/pages/editarCapitulo";

export default async function Page({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params;
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
