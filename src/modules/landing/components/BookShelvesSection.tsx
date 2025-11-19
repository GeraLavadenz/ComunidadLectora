import React from 'react';
import Image from 'next/image';
import '@/modules/landing/styles/BookShelvesSection.css';

import LIBRO1 from '../assets/LIBRO1.jpeg';
import LIBRO2 from '../assets/LIBRO2.jpg';
import LIBRO3 from '../assets/El violín del diablo.jpeg';
import LIBRO4 from '../assets/LOS ORÍGENES DEL TOTALITARISMO ☆ Hannah Arendt_ Inglaterra_Alemania,  1951.jpeg';
import LIBRO5 from '../assets/La peste _ Albert Camus.jpeg';
import LIBRO6 from '../assets/_Racismo y poder en Bolivia_, de Fernando Molina(2021).jpeg';
/*import LIBRO7 from '../assets/_Perú, 1890-1977_ es la reedición del clásico libro de Rosemary Thorp y Geoffrey Bertram, uno de los primeros estudios de largo aliento de la economía nacional del siglo XX_.jpeg';*/
import LIBRO8 from '../assets/descargar (1).jpeg';

const BookShelvesSection: React.FC = () => {
  const leftBooks = [
    { src: LIBRO1.src, alt: 'Libro 1' },
    { src: LIBRO2.src, alt: 'Libro 2' },
    { src: LIBRO3.src, alt: 'Libro 3' },
    { src: LIBRO4.src, alt: 'Libro 4' },
  ];

  const rightBooks = [
    { src: LIBRO5.src, alt: 'Libro 5' },
    { src: LIBRO6.src, alt: 'Libro 6' },
   /* { src: LIBRO7.src, alt: 'Libro 7' },*/
    { src: LIBRO8.src, alt: 'Libro 8' },
  ];

  return (
    <section className="book-shelves-section">
      <div className="shelves-container">
        <div className="shelf left-shelf">
          {leftBooks.map((book, index) => (
            <div key={index} className="book-container" style={{ animationDelay: `${index * 0.5}s` }}>
              <Image
                src={book.src}
                alt={book.alt}
                width={80}
                height={120}
                className="book-image"
              />
            </div>
          ))}
        </div>
        <div className="shelf-divider">
            <div>
                <h1 className="fade-in-up">
                    <span>Todos los géneros.</span>
                    <span className="highlight fade-in-up delay-1">Todos los tropos.</span>
                    <span className="fade-in-up delay-2">Todos tuyos.</span>
                </h1>
                <p className="slide-in-left delay-2">Encuentra tu próxima lectura favorita, sea cual sea tu estado de ánimo o vibra (no te juzgamos).</p>
            </div>
        </div>
        <div className="shelf right-shelf">
          {rightBooks.map((book, index) => (
            <div key={index} className="book-container" style={{ animationDelay: `${index * 0.5}s` }}>
              <Image
                src={book.src}
                alt={book.alt}
                width={80}
                height={120}
                className="book-image"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookShelvesSection;
