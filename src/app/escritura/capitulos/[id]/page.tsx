import Header from "@/components/header/header";
import Footer from "@/components/footer/footer";
import Capitulos from "../../../../modules/escritura/pages/capitulos";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Capitulos params={{ id }} />
      </main>
      <Footer />
    </div>
  );
}
