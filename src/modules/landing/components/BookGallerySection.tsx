'use client';

import React from 'react';
import DomeGallery from '../../../components/DomeGallery.jsx';
import { useTheme } from '../../../lib/theme-provider.tsx';
import '@/modules/landing/styles/BookGallerySection.css'; // Import custom styles

import LIBRO3 from '../assets/El violín del diablo.jpeg';
import LIBRO1 from '../assets/LIBRO1.jpeg';
import LIBRO2 from '../assets/LIBRO2.jpg';
import LIBRO4 from '../assets/LOS ORÍGENES DEL TOTALITARISMO ☆ Hannah Arendt_ Inglaterra_Alemania,  1951.jpeg';
import LIBRO5 from '../assets/La peste _ Albert Camus.jpeg';
import LIBRO6 from '../assets/_Racismo y poder en Bolivia_, de Fernando Molina(2021).jpeg';
/*import LIBRO7 from '../assets/_Perú, 1890-1977_ es la reedición del clásico libro de Rosemary Thorp y Geoffrey Bertram, uno de los primeros estudios de largo aliento de la economía nacional del siglo XX_.jpeg';*/
import LIBRO8 from '../assets/descargar (1).jpeg';



const BookGallerySection: React.FC = () => {
  const { theme } = useTheme();
  const bookImages = [

    { src: LIBRO1.src, alt: 'Libro 1' },
    { src: LIBRO2.src, alt: 'Libro 2' },
    { src: LIBRO3.src, alt: 'Libro 3' },
    { src: LIBRO4.src, alt: 'Libro 4' },
    { src: LIBRO5.src, alt: 'Libro 5' },
    { src: LIBRO6.src, alt: 'Libro 6' },
    /*{ src: LIBRO7.src, alt: 'Libro 7' },*/
    { src: LIBRO8.src, alt: 'Libro 8' },

    { src: LIBRO1.src, alt: 'Libro 1' },
    { src: LIBRO2.src, alt: 'Libro 2' },
    { src: LIBRO3.src, alt: 'Libro 3' },
    { src: LIBRO4.src, alt: 'Libro 4' },
    { src: LIBRO5.src, alt: 'Libro 5' },
    { src: LIBRO6.src, alt: 'Libro 6' },
    /*{ src: LIBRO7.src, alt: 'Libro 7' },*/
    { src: LIBRO8.src, alt: 'Libro 8' },
  ];

  const overlayBlurColor = theme === 'dark' ? '#1a1a1a' : '#F0F8F0';

  return (
    <section className="book-gallery-section">
      <div className="book-gallery-container">
        <h2 className="book-gallery-title">Galería de Libros</h2>
        <div style={{ filter: 'sepia(0.4) hue-rotate(90deg) saturate(1.3) brightness(1.1)', height: '500px' }}>
          <DomeGallery
            images={bookImages}
            grayscale={false}
            imageBorderRadius="20px"
            openedImageBorderRadius="30px"
            overlayBlurColor={overlayBlurColor}
          />
        </div>
      </div>
    </section>
  );
};

export default BookGallerySection;
