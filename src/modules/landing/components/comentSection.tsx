import React from "react";
import Image from "next/image";
import "../styles/comentsection.css"; // o usa Tailwind si prefieres

const LandingSection: React.FC = () => {
  return (
    <section className="landing-section">
      <div className="image-area">
        {/* Ilustración principal */}
        <Image
          src="/ilustracion.png"
          alt="Ilustración"
          className="illustration"
          width={600}
          height={400}
        />

        {/* Comentario 1 */}
        <div className="comment comment-1">
          <Image
            src="/avatar1.jpg"
            alt="Avatar user"
            className="avatar"
            width={40}
            height={40}
          />
          <p>
            <strong>auqu33n</strong> todos estamos perdiendo la cabeza
            colectivamente por este capítulo ¿verdad?
          </p>
          <div className="likes">105 ♥</div>
        </div>

        {/* Comentario 2 */}
        <div className="comment comment-2">
          <Image
            src="/avatar2.jpg"
            alt="Avatar user"
            className="avatar"
            width={40}
            height={40}
          />
          <p>
            <strong>slowburn_stan</strong> QUE ALGUIEN ME PASE LAS PALOMITAS 🍿
          </p>
          <div className="likes">98 ♥</div>
        </div>
      </div>

      <div className="text-area">
        <h1>Tu club de lectura, pero más grande (mucho más grande)</h1>
        <p>
          Lee, reacciona y conecta con millones de fans que viven por las mismas
          historias que tú.
        </p>
      </div>
    </section>
  );
};

export default LandingSection;
