import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import '@/modules/landing/styles/animations.css'; // Import custom animations
import '@/modules/landing/styles/HeroSection.css'; // Import custom styles

import libro from '../assets/libro-de-educacion.png';
import chat from '../assets/globos-de-texto.png';
import grupo from '../assets/grupo.png';

const HeroSection: React.FC = () => {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="landing-space-y-6">
          <h1 className="landing-title fade-in-up">
            <span className="block">Ven por la historia.</span>
            <span className="block highlight fade-in-up delay-1">Quédate por la conexión.</span>
          </h1>
          <p className="landing-description slide-in-left delay-2">
            Historias mejores que el streaming. Chat de grupos para conectar con lectores y autores bolivianos.
          </p>
          <div className="landing-buttons bounce-in delay-3">
            <Link
              href="/register"
              className="landing-button-primary pulse-glow"
            >
              Únete ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/explore"
              className="landing-button-secondary pulse-glow"
            >
              Explora historias
            </Link>
          </div>
        </div>
        {/* Illustrations with actual images */}
        <div className="landing-illustrations">
          <div className="landing-illustration bounce-in delay-1">
            <div className="landing-illustration-circle pulse-glow">
              <Image
                src={libro}
                alt="Libro de educación"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          </div>
          <div className="landing-illustration bounce-in delay-2">
            <div className="landing-illustration-circle pulse-glow">
              <Image
                src={chat}
                alt="Globos de texto"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          </div>
          <div className="landing-illustration bounce-in delay-3">
            <div className="landing-illustration-circle pulse-glow">
              <Image
                src={grupo}
                alt="Grupo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
