import React from 'react';
import Link from 'next/link';
import styles from './styles/footer.module.css';

const Footer: React.FC = () => {
  const footerLinks = [
    { title: 'Acerca de', href: '/acerca-de' },
    { title: 'Términos y Condiciones', href: '/terminos-condiciones' },
    { title: 'Privacidad', href: '/privacidad' },
    { title: 'Ayuda', href: '/ayuda' },
    { title: 'Publicidad', href: '/advertising' },
    { title: 'Desarrolladores', href: '/developers' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerLinks}>
          {footerLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className={styles.footerLink}
            >
              {link.title}
            </Link>
          ))}
        </div>
        <div className={styles.footerDivider}></div>
        <p className={styles.footerCopyright}>
          © 2025 Comunidad Lectora Bolivia. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
