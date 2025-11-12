import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const footerLinks = [
    { title: 'Acerca de', href: '/acerca-de' },
    { title: 'Privacidad', href: '/privacy' },
    { title: 'Términos', href: '/terms' },
    { title: 'Ayuda', href: '/help' },
    { title: 'Publicidad', href: '/advertising' },
    { title: 'Desarrolladores', href: '/developers' },
  ];

  return (
    <footer className="bg-[#165C1E] border-t border-[#2C8E2C] py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center space-x-6 space-y-4 md:space-y-0 md:flex-nowrap">
          {footerLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="text-[#3F875F] hover:text-[#4CD23D] text-sm font-medium transition-colors"
            >
              {link.title}
            </Link>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-[#2C8E2C] text-center">
          <p className="text-[#3F875F] text-sm">
            © 2025 Comunidad Lectora Bolivia. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
