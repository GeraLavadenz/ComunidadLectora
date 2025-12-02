import React from 'react';
import { Trophy, Award, Star } from 'lucide-react';
import './styles/Premios.css';

const Premios: React.FC = () => {
  return (
    <main className="premios-main">
      <div className="premios-container">
        {/* Header Section */}
        <div className="premios-header">
          <Trophy className="premios-trophy-icon" />
          <h1 className="premios-title">
            Premios Comunidad Lectora
          </h1>
          <p className="premios-subtitle">
            Descubre los premios otorgados por la Comunidad Lectora. Participa en concursos literarios y gana reconocimientos por tus obras.
          </p>
        </div>

        {/* Premios Grid */}
        <div className="premios-grid">
          {/* Premio 1 */}
          <div className="premio-card">
            <div className="premio-header">
              <Award className="premio-icon premio-icon-blue" />
              <h3 className="premio-card-title">Premio al Mejor Autor Novel</h3>
            </div>
            <p className="premio-description">
              Reconocimiento a los nuevos talentos literarios que demuestran creatividad excepcional.
            </p>
            <div className="premio-stars">
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star className="star-filled" />
            </div>
          </div>

          {/* Premio 2 */}
          <div className="premio-card">
            <div className="premio-header">
              <Trophy className="premio-icon premio-icon-green" />
              <h3 className="premio-card-title">Premio Literatura Boliviana</h3>
            </div>
            <p className="premio-description">
              Destacando obras que representan la riqueza cultural y literaria de Bolivia.
            </p>
            <div className="premio-stars">
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star />
            </div>
          </div>

          {/* Premio 3 */}
          <div className="premio-card">
            <div className="premio-header">
              <Award className="premio-icon premio-icon-purple" />
              <h3 className="premio-card-title">Premio Poesía Joven</h3>
            </div>
            <p className="premio-description">
              Reconociendo la voz poética de las nuevas generaciones literarias.
            </p>
            <div className="premio-stars">
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star className="star-filled" />
              <Star />
              <Star />
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <h2 className="cta-title">
            ¿Quieres participar?
          </h2>
          <p className="cta-description">
            Únete a nuestros concursos literarios y demuestra tu talento. Las inscripciones están abiertas todo el año.
          </p>
          <button className="cta-button">
            Ver Concursos Activos
          </button>
        </div>
      </div>
    </main>
  );
};

export default Premios;
