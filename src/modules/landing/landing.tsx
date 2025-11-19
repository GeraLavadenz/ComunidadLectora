import React from 'react';
import Header from '@/components/header/header';
import Footer from '@/components/footer/footer';
import HeroSection from './components/HeroSection';
import BookGallerySection from './components/BookGallerySection';
import BookShelvesSection from './components/BookShelvesSection';
import ComentSection from './components/comentSection';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <BookGallerySection />
        <BookShelvesSection />
        <ComentSection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
