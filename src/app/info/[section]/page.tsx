import AcercaDe from '../../../modules/landing/Pages/Acerca_de';
import Ayuda from '../../../modules/landing/Pages/Ayuda';
import Desarrolladores from '../../../modules/landing/Pages/Desarrolladores';
import Privacidad from '../../../modules/landing/Pages/Privacidad';
import TerminosCondiciones from '../../../modules/landing/Pages/TerminosCondiciones';

interface PageProps {
  params: Promise<{
    section: string;
  }>;
}

const sectionComponents: Record<string, React.ComponentType> = {
  'acerca-de': AcercaDe,
  'ayuda': Ayuda,
  'desarrolladores': Desarrolladores,
  'privacidad': Privacidad,
  'terminos-condiciones': TerminosCondiciones,
};

export default async function Page({ params }: PageProps) {
  const { section } = await params;
  const Component = sectionComponents[section];

  if (!Component) {
    return <div>Página no encontrada</div>;
  }

  return <Component />;
}
