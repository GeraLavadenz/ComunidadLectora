'use client';

import React, { useState } from 'react';
import Header from '../../../components/header/header';
import Footer from '../../../components/footer/footer';
import styles from '../styles/Ayuda.module.css';

const Ayuda: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    alert('Mensaje enviado. Te responderemos pronto.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const faqs = [
    {
      question: '¿Cómo puedo crear una cuenta?',
      answer: 'Para crear una cuenta, haz clic en "Registrate" en la esquina superior derecha. Completa el formulario con tu información y verifica tu correo electrónico.'
    },
    {
      question: '¿Cómo publicar una historia?',
      answer: 'Una vez registrado, ve a "Escribir" en el menú principal. Selecciona "Crear Nueva Historia" y comienza a escribir. Puedes guardar borradores y publicar cuando estés listo.'
    },
    {
      question: '¿Cómo buscar libros en la biblioteca?',
      answer: 'Usa la barra de búsqueda en la página de Biblioteca. Puedes filtrar por género, autor, calificación o usar palabras clave específicas.'
    },
    {
      question: '¿Cómo contactar a otros lectores?',
      answer: 'En la sección "Comunidad" encontrarás foros y grupos de discusión. También puedes comentar en historias y libros publicados por otros usuarios.'
    },
    {
      question: '¿Puedo editar mi perfil?',
      answer: 'Sí, ve a tu perfil haciendo clic en tu avatar en la esquina superior derecha. Allí podrás actualizar tu información, foto de perfil y preferencias.'
    },
    {
      question: '¿Cómo reportar contenido inapropiado?',
      answer: 'Cada publicación tiene un botón "Reportar" en la esquina inferior derecha. Selecciona el motivo del reporte y nuestro equipo lo revisará.'
    },
    {
      question: '¿Hay límites en el número de historias que puedo publicar?',
      answer: 'No hay límites estrictos, pero te recomendamos mantener la calidad. Si publicas contenido de baja calidad repetidamente, tu cuenta podría ser suspendida.'
    },
    {
      question: '¿Cómo funciona el sistema de calificaciones?',
      answer: 'Los usuarios pueden calificar historias del 1 al 5. Las calificaciones ayudan a otros lectores a encontrar contenido de calidad.'
    }
  ];

  return (
    <>
      <Header />
      <div className={styles.ayudaContainer}>
        <div className={styles.heroSection}>
          <h1 className={styles.mainTitle}>Centro de Ayuda</h1>
          <p className={styles.heroSubtitle}>
            Encuentra respuestas a tus preguntas o contáctanos directamente
          </p>
        </div>

        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'faq' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            Preguntas Frecuentes
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'contact' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Contactar Soporte
          </button>
        </div>

        {activeTab === 'faq' && (
          <div className={styles.faqSection}>
            <div className={styles.faqGrid}>
              {faqs.map((faq, index) => (
                <div key={index} className={styles.faqCard}>
                  <h3 className={styles.faqQuestion}>{faq.question}</h3>
                  <p className={styles.faqAnswer}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className={styles.contactSection}>
            <div className={styles.contactCard}>
              <h2>¿No encontraste lo que buscas?</h2>
              <p>Envíanos tu pregunta y te responderemos lo antes posible.</p>

              <form onSubmit={handleSubmit} className={styles.contactForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nombre *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Correo electrónico *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject">Asunto *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Mensaje *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className={styles.formTextarea}
                    placeholder="Describe tu pregunta o problema en detalle..."
                  />
                </div>

                <button type="submit" className={styles.submitButton}>
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Ayuda;
