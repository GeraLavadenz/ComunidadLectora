import React from 'react';
import Header from '../../../components/header/header';
import Footer from '../../../components/footer/footer';
import styles from '../styles/TerminosCondiciones.module.css';

const TerminosCondiciones: React.FC = () => {
  return (
    <>
      <Header />
      <div className={styles.terminosContainer}>
        <div className={styles.heroSection}>
          <h1 className={styles.mainTitle}>Términos y Condiciones</h1>
          <p className={styles.heroSubtitle}>
            Reglas y condiciones de uso de Comunidad Lectora Bolivia
          </p>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.card}>
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar Comunidad Lectora Bolivia, aceptas estar sujeto a estos términos y condiciones de uso.
              Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.
            </p>
          </div>

          <div className={styles.card}>
            <h2>2. Uso del Servicio</h2>
            <p>
              El servicio está destinado únicamente para uso personal y no comercial. No puedes utilizar el servicio para
              actividades ilegales o que violen los derechos de terceros. Debes proporcionar información veraz y actualizada.
            </p>
          </div>

          <div className={styles.card}>
            <h2>3. Contenido del Usuario</h2>
            <p>
              Al publicar contenido en nuestra plataforma, garantizas que tienes los derechos necesarios sobre dicho contenido.
              No somos responsables por el contenido generado por usuarios, pero nos reservamos el derecho de moderar y eliminar
              contenido que viole estos términos.
            </p>
          </div>

          <div className={styles.card}>
            <h2>4. Privacidad</h2>
            <p>
              Tu privacidad es importante para nosotros. Consulta nuestra Política de Privacidad para entender cómo recopilamos,
              usamos y protegemos tu información personal.
            </p>
          </div>

          <div className={styles.card}>
            <h2>5. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de Comunidad Lectora Bolivia, incluyendo logos, textos y diseños, está protegido por derechos de autor.
              No puedes copiar, distribuir o utilizar este contenido sin autorización expresa.
            </p>
          </div>

          <div className={styles.card}>
            <h2>6. Limitación de Responsabilidad</h2>
            <p>
              Comunidad Lectora Bolivia no se hace responsable por daños directos, indirectos o consecuentes que puedan surgir
              del uso del servicio. El servicio se proporciona "tal cual" sin garantías.
            </p>
          </div>

          <div className={styles.card}>
            <h2>7. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos
              inmediatamente después de su publicación en la plataforma.
            </p>
          </div>

          <div className={styles.card}>
            <h2>8. Contacto</h2>
            <p>
              Si tienes preguntas sobre estos términos y condiciones, puedes contactarnos a través de nuestro "formulario
              de contacto" o enviando un "correo electrónico" a soporte@comunidadlectorabolivia.com.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TerminosCondiciones;
