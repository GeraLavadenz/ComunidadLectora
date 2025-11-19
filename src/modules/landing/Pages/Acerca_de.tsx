import React from 'react';
import Image from 'next/image';
import Header from '../../../components/header/header';
import Footer from '../../../components/footer/footer';
import logoCompleto from '../../../../public/logoCompleto.png';
import styles from '../styles/AcercaDe.module.css';

const AcercaDe: React.FC = () => {
  return (
    <>
      <Header />
      <div className={styles.acercaDeContainer}>
        <div className={styles.heroSection}>
          <div className={styles.logoSection}>
            <Image
              src={logoCompleto}
              alt="Comunidad Lectora Bolivia"
              width={400}
              height={120}
              className={styles.logoCompleto}
            />
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.mainTitle}>Acerca de Comunidad Lectora Bolivia</h1>
            <p className={styles.heroSubtitle}>
              Conectando mentes a través de las palabras
            </p>
          </div>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.card}>
            <h2>Nuestra Misión</h2>
            <p>
              Comunidad Lectora Bolivia es una plataforma dedicada a fomentar la lectura, la escritura y el intercambio cultural en Bolivia.
              Nuestro objetivo es conectar a lectores apasionados, escritores emergentes y amantes de la literatura en un espacio inclusivo y colaborativo.
            </p>
          </div>

          <div className={styles.card}>
            <h2>Lo que Ofrecemos</h2>
            <p>
              En nuestra comunidad, puedes explorar una amplia variedad de libros, participar en discusiones literarias, compartir tus propias historias
              y conectarte con personas que comparten tus intereses. Creemos en el poder de las palabras para transformar vidas y enriquecer nuestras culturas.
            </p>
          </div>

          <div className={styles.card}>
            <h2>Únete a la Comunidad</h2>
            <p>
              Únete a nosotros para descubrir nuevos mundos a través de la lectura, inspirarte con historias locales y globales, y contribuir al crecimiento
              de una comunidad literaria vibrante en Bolivia.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AcercaDe;
