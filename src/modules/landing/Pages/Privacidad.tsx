import React from 'react';
import Header from '../../../components/header/header';
import Footer from '../../../components/footer/footer';
import styles from '../styles/Privacidad.module.css';

const Privacidad: React.FC = () => {
  return (
    <>
      <Header />
      <div className={styles.privacidadContainer}>
        <div className={styles.heroSection}>
          <h1 className={styles.mainTitle}>Política de Privacidad</h1>
          <p className={styles.heroSubtitle}>
            Cómo protegemos y manejamos tu información personal
          </p>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.card}>
            <h2>1. Información que Recopilamos</h2>
            <p>
              Recopilamos información que nos proporcionas directamente, como cuando creas una cuenta, publicas contenido
              o nos contactas. También recopilamos información automáticamente a través de cookies y tecnologías similares.
            </p>
          </div>

          <div className={styles.card}>
            <h2>2. Cómo Usamos tu Información</h2>
            <p>
              Utilizamos tu información para proporcionar y mejorar nuestros servicios, personalizar tu experiencia,
              comunicarnos contigo y mantener la seguridad de nuestra plataforma.
            </p>
          </div>

          <div className={styles.card}>
            <h2>3. Compartir Información</h2>
            <p>
              No vendemos tu información personal a terceros. Podemos compartir información en situaciones limitadas,
              como cuando es requerido por ley o para proteger nuestros derechos legales.
            </p>
          </div>

          <div className={styles.card}>
            <h2>4. Cookies y Tecnologías Similares</h2>
            <p>
              Utilizamos cookies para mejorar tu experiencia en nuestro sitio. Puedes controlar las cookies a través
              de la configuración de tu navegador, aunque algunas funciones pueden no funcionar correctamente sin ellas.
            </p>
          </div>

          <div className={styles.card}>
            <h2>5. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra
              acceso no autorizado, alteración, divulgación o destrucción.
            </p>
          </div>

          <div className={styles.card}>
            <h2>6. Tus Derechos</h2>
            <p>
              Tienes derecho a acceder, rectificar, eliminar o portar tu información personal. También puedes oponerte
              al procesamiento de tus datos en ciertas circunstancias.
            </p>
          </div>

          <div className={styles.card}>
            <h2>7. Retención de Datos</h2>
            <p>
              Conservamos tu información personal solo durante el tiempo necesario para cumplir con los propósitos
              descritos en esta política, a menos que se requiera un período de retención más largo por ley.
            </p>
          </div>

          <div className={styles.card}>
            <h2>8. Cambios a esta Política</h2>
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Te notificaremos sobre cambios significativos
              a través de nuestro sitio web o por correo electrónico.
            </p>
          </div>

          <div className={styles.card}>
            <h2>9. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través de nuestro formulario
              de contacto o enviando un correo electrónico a privacidad@comunidadlectorabolivia.com.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Privacidad;
