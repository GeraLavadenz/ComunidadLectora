interface MenuItem {
  title: string;
  href: string;
}

export const genres: MenuItem[] = [
  { title: 'Romance', href: '/biblioteca?genre=romance' },
  { title: 'Fantasía', href: '/biblioteca?genre=fantasia' },
  { title: 'Literatura Boliviana', href: '/biblioteca?genre=literatura-boliviana' },
  { title: 'Novela Juvenil', href: '/biblioteca?genre=novela-juvenil' },
  { title: 'Ciencia Ficción', href: '/biblioteca?genre=ciencia-ficcion' },
  { title: 'Terror', href: '/biblioteca?genre=terror' },
  { title: 'Poesía', href: '/biblioteca?genre=poesia' },
  { title: 'Clásicos', href: '/biblioteca?genre=clasicos' },
];

export const community: MenuItem[] = [
  { title: 'Premios Comunidad Lectora', href: '/community/premios' },
  { title: 'Eventos de Autores Bolivianos', href: '/community/eventos' },
  { title: 'Autores Nacionales', href: '/community/autores' },
  { title: 'Embajadores Bolivianos', href: '/community/embajadores' },
];

export const createOptions: MenuItem[] = [
  { title: 'Mis historias', href: '/escritura/mis-historias' },
  { title: 'Recursos útiles para escritores', href: '/resources' },
  { title: 'Corrector inteligente', href: '/programs' },
];
