import React from 'react';
import Link from 'next/link';
import styles from './styles/footer.module.css';

const Footer: React.FC = () => {
  const footerLinks = [
    { title: 'Acerca de', href: '/info/acerca-de' },
    { title: 'Términos y Condiciones', href: '/info/terminos-condiciones' },
    { title: 'Privacidad', href: '/info/privacidad' },
    { title: 'Ayuda', href: '/info/ayuda' },
    /*{ title: 'Publicidad', href: '/advertising' },*/
    { title: 'Desarrolladores', href: '/info/desarrolladores' },
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
