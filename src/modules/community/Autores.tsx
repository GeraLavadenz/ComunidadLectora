import React from 'react';

interface Author {
  name: string;
  bio: string;
  image: string;
  works: string[];
}

const Autores: React.FC = () => {
  const authors: Author[] = [
    {
      name: 'Jaime Saenz',
      bio: 'Poeta y escritor boliviano, conocido por su obra surrealista y su exploración de temas existenciales.',
      image: '/minilogo.png', // Placeholder image
      works: ['El frío', 'La noche', 'Felipe Delgado']
    },
    {
      name: 'Adolfo Cáceres Romero',
      bio: 'Novelista y ensayista, autor de obras que retratan la sociedad boliviana y sus conflictos.',
      image: '/minilogo.png', // Placeholder image
      works: ['No una sino muchas muertes', 'Los dueños de la tierra']
    },
    {
      name: 'Óscar Cerruto',
      bio: 'Poeta y narrador, reconocido por su estilo innovador y su compromiso social.',
      image: '/minilogo.png', // Placeholder image
      works: ['Aluvión de fuego', 'Patria de sal']
    },
    {
      name: 'Gaby Vallejo',
      bio: 'Escritora contemporánea, autora de novelas que exploran la identidad y la memoria.',
      image: '/minilogo.png', // Placeholder image
      works: ['El tungsteno', 'La ciudad de los gatos']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-primary mb-4 tracking-tight">Autores Nacionales</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Conoce a los autores bolivianos destacados en la Comunidad Lectora. Explora sus obras y contribuciones a la literatura nacional.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
          {authors.map((author, index) => (
            <div key={index} className="bg-card border border-border rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-sm">
              <div className="flex flex-col items-center text-center">
                <img
                  src={author.image}
                  alt={author.name}
                  className="w-28 h-28 rounded-full mx-auto mb-6 object-cover border-4 border-primary/20 shadow-md"
                />
                <h2 className="text-2xl font-bold text-card-foreground mb-3">{author.name}</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{author.bio}</p>
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-3 text-card-foreground">Obras destacadas:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {author.works.map((work, workIndex) => (
                      <li key={workIndex} className="flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                        {work}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Autores;
