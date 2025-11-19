import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

import bookImage from './assets/bb1058d835407a4d318c91d2cfc5c359.jpg';
import './styles/404animations.css';

const Error404: React.FC = () => {
  const [showImage, setShowImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowImage(true), 500); // Show image after 0.5 seconds
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8F0] to-white flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        <h1 className="text-6xl md:text-8xl font-bold text-[#165C1E] animate-bounce">
          404
        </h1>
        <p className="text-2xl font-semibold text-[#187A25]">
          Página no encontrada
        </p>
        <p className="text-[#3F875F] text-lg">
          La página que buscas se ha perdido entre las páginas de un libro...
        </p>

        {/* Bookshelf Scene with Enhanced Animations - Commented out to hide the animation */}
        {/*
        <div className="relative h-48 w-full bg-[#E8F5E8] rounded-lg overflow-hidden shadow-lg">
          <div className="flex items-end h-full p-4 space-x-1 animate-bookshelf-load">
            <div className="w-8 h-20 bg-[#4CD23D] rounded-l-lg flex items-end justify-center p-1 book-animate book-1">
              <span className="text-xs text-white font-bold">HIST</span>
            </div>
            <div className="w-8 h-24 bg-[#187A25] flex items-end justify-center p-1 book-animate book-2">
              <span className="text-xs text-white font-bold">AVEN</span>
            </div>
            <div className="w-8 h-16 bg-[#165C1E] rounded-r-lg flex items-end justify-center p-1 book-animate book-3">
              <span className="text-xs text-white font-bold">TURA</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#2C8E2C] rounded-b-lg shelf-animate"></div>
            <div className="absolute top-2 left-1/4 w-1 h-1 bg-[#3F875F]/50 rounded-full dust-1"></div>
            <div className="absolute top-4 right-1/4 w-1 h-1 bg-[#3F875F]/30 rounded-full dust-2"></div>
          </div>
        </div>
        */}

        {/* Fading Image */}
        {showImage && (
          <div className="fade-in-image flex justify-center">
            <Image
              src={bookImage}
              alt="Libro perdido"
              width={400}
              height={300}
              className="rounded-lg shadow-lg object-cover object-top"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}
            />
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#187A25] hover:bg-[#4CD23D] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>

    </div>
  );
};

export default Error404;
