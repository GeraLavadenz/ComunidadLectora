import React from 'react';
import Header from '../../../components/header/header';
import Footer from '../../../components/footer/footer';
import Image from 'next/image';
import logoCompleto from '../../../../public/logoCompleto.png';
import styles from '../styles/Desarrolladores.module.css';

const Desarrolladores: React.FC = () => {
  const teamMembers = [
    {
      name: 'Ana García',
      role: 'Desarrolladora Frontend',
      bio: 'Especialista en React y Next.js con 5 años de experiencia creando interfaces de usuario intuitivas.',
      skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
      image: '👩‍💻',
      linkedin: '#',
      github: '#'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Desarrollador Backend',
      bio: 'Experto en Node.js y Firebase, apasionado por la arquitectura de sistemas escalables.',
      skills: ['Node.js', 'Firebase', 'MongoDB', 'API Design'],
      image: '👨‍💻',
      linkedin: '#',
      github: '#'
    },
    {
      name: 'María López',
      role: 'Diseñadora UX/UI',
      bio: 'Creadora de experiencias digitales centradas en el usuario, con enfoque en accesibilidad.',
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
      image: '👩‍🎨',
      linkedin: '#',
      github: '#'
    },
    {
      name: 'Juan Pérez',
      role: 'DevOps Engineer',
      bio: 'Especialista en despliegue y mantenimiento de infraestructuras cloud.',
      skills: ['AWS', 'Docker', 'CI/CD', 'Monitoring'],
      image: '👨‍🔧',
      linkedin: '#',
      github: '#'
    },
    {
      name: 'Laura Martínez',
      role: 'Product Manager',
      bio: 'Lidera el desarrollo de productos con visión estratégica y enfoque en el usuario.',
      skills: ['Product Strategy', 'Agile', 'Analytics', 'Stakeholder Management'],
      image: '👩‍💼',
      linkedin: '#',
      github: '#'
    },
    {
      name: 'Diego Sánchez',
      role: 'QA Engineer',
      bio: 'Garantiza la calidad del software mediante testing automatizado y manual exhaustivo.',
      skills: ['Selenium', 'Jest', 'Postman', 'Test Planning'],
      image: '👨‍🔬',
      linkedin: '#',
      github: '#'
    }
  ];

  const milestones = [
    {
      year: '2023',
      title: 'Fundación',
      description: 'Nace Comunidad Lectora Bolivia con la visión de conectar lectores en todo el país.',
      icon: '🌱'
    },
    {
      year: '2024',
      title: 'Lanzamiento Beta',
      description: 'Primera versión pública con funcionalidades básicas de biblioteca y escritura colaborativa.',
      icon: '🚀'
    },
    {
      year: '2024',
      title: 'Crecimiento',
      description: 'Más de 10,000 usuarios registrados y miles de historias compartidas.',
      icon: '📈'
    },
    {
      year: '2025',
      title: 'Expansión',
      description: 'Nuevas funcionalidades como clubs de lectura virtuales y eventos literarios.',
      icon: '🌟'
    }
  ];

  const values = [
    {
      title: 'Innovación',
      description: 'Buscamos constantemente nuevas formas de mejorar la experiencia de lectura.',
      icon: '💡'
    },
    {
      title: 'Comunidad',
      description: 'Creemos en el poder de conectar personas a través de las historias.',
      icon: '🤝'
    },
    {
      title: 'Accesibilidad',
      description: 'Hacemos que la literatura sea accesible para todos, sin importar su ubicación.',
      icon: '🌍'
    },
    {
      title: 'Calidad',
      description: 'Mantenemos altos estándares en todo lo que hacemos, desde el código hasta el contenido.',
      icon: '⭐'
    }
  ];

  return (
    <>
      <Header />
      <div className={styles.desarrolladoresContainer}>
        <div className={styles.heroSection}>
          <Image
            src={logoCompleto}
            alt="Comunidad Lectora Bolivia"
            width={200}
            height={40}
            className={styles.logo}
          />
          <h1 className={styles.mainTitle}>Portal de Desarrolladores</h1>
          <p className={styles.heroSubtitle}>
            Integra con nuestra plataforma y construye experiencias increíbles para lectores
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Nuestro Equipo</h2>
          <div className={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div key={index} className={styles.teamCard}>
                <div className={styles.teamImage}>{member.image}</div>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p className={styles.teamBio}>{member.bio}</p>
                <div className={styles.teamSkills}>
                  {member.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className={styles.skillTag}>{skill}</span>
                  ))}
                </div>
                <div className={styles.teamLinks}>
                  <a href={member.linkedin} className={styles.socialLink}>LinkedIn</a>
                  <a href={member.github} className={styles.socialLink}>GitHub</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Nuestra Historia</h2>
          <div className={styles.timeline}>
            {milestones.map((milestone, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineIcon}>{milestone.icon}</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineYear}>{milestone.year}</div>
                  <h3 className={styles.timelineTitle}>{milestone.title}</h3>
                  <p className={styles.timelineDescription}>{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Nuestros Valores</h2>
          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <div key={index} className={styles.valueCard}>
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Únete a Nuestro Equipo</h2>
          <div className={styles.joinCard}>
            <h3>¿Te apasiona la tecnología y la literatura?</h3>
            <p>
              Estamos siempre buscando talento excepcional para unirse a nuestro equipo.
              Si tienes experiencia en desarrollo web, diseño UX/UI, o gestión de productos,
              queremos conocerte.
            </p>
            <div className={styles.joinButtons}>
              <button className={styles.primaryButton}>Ver Posiciones Disponibles</button>
              <button className={styles.secondaryButton}>Enviar CV</button>
            </div>
          </div>
        </div>

        <div className={styles.ctaSection}>
          <h2>¿Listo para empezar?</h2>
          <p>Regístrate como desarrollador y obtén acceso a nuestras herramientas</p>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryButton}>Crear Cuenta Developer</button>
            <button className={styles.secondaryButton}>Ver Documentación</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Desarrolladores;
