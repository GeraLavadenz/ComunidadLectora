// =====================================================
// 📚 Datos mock (arreglo en memoria; sin BD por ahora)
// =====================================================
export type Book = {
  id: string;
  title: string;
  author: string;
  genres: string[]; // e.g., ["Fantasía", "Romance"]
  tags: string[];   // e.g., ["BL", "Dark", "Spicy"]
  cover?: string;   // URL opcional
  rating?: number;  // 0..5
};

export const BOOKS: Book[] = [
  {
    id: "b1",
    title: "Sombras del Altiplano",
    author: "G. Lavadenz",
    genres: ["Fantasía", "Aventura"],
    tags: ["Autores Locales", "Magia", "Saga"],
    cover:
      "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=800&auto=format&fit=crop",
    rating: 4.6,
  },
  {
    id: "b2",
    title: "Circuitos y Versos",
    author: "V. Bedoya",
    genres: ["Ciencia Ficción"],
    tags: ["Spicy", "IA", "Ciberpunk"],
    cover:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
    rating: 4.1,
  },
  {
    id: "b3",
    title: "La Biblioteca del Castillo",
    author: "R. Bautista",
    genres: ["Misterio", "Suspenso"],
    tags: ["EMI", "Investigación"],
    cover:
      "https://images.unsplash.com/photo-1519681390290-7e6f31b05ded?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
  },
  {
    id: "b4",
    title: "Cuerdas y Tinta",
    author: "S. Sumi",
    genres: ["Romance", "Drama"],
    tags: ["BL", "Dark", "Spicy"],
    cover:
      "https://images.unsplash.com/photo-1519681390437-2b63b154a3fd?q=80&w=800&auto=format&fit=crop",
    rating: 4.4,
  },
  {
    id: "b5",
    title: "Redes del Destino",
    author: "G. Lavadenz",
    genres: ["Tecnología", "No Ficción"],
    tags: ["Seguridad", "Redes", "EMI"],
    cover:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
    rating: 4.0,
  },
];
