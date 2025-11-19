import Header from "@/components/header/header";
import Footer from "@/components/footer/footer";
import MisHistorias from '../../../modules/escritura/misHistorias';

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <MisHistorias />
      </main>
      <Footer />
    </div>
  );
}
