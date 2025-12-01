import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock } from 'lucide-react';

const Eventos: React.FC = () => {
  // Datos de ejemplo para eventos
  const eventos = [
    {
      id: 1,
      titulo: 'Charla con Autor Nacional',
      descripcion: 'Una conversación profunda con uno de los autores más destacados de Bolivia.',
      fecha: '15 de Octubre, 2023',
      hora: '18:00',
      lugar: 'Centro Cultural de La Paz',
      imagen: '/event1.jpg', // Placeholder para imagen
    },
    {
      id: 2,
      titulo: 'Taller de Escritura Creativa',
      descripcion: 'Aprende técnicas avanzadas de escritura en este taller interactivo.',
      fecha: '22 de Octubre, 2023',
      hora: '14:00',
      lugar: 'Biblioteca Municipal de Santa Cruz',
      imagen: '/event2.jpg', // Placeholder para imagen
    },
    {
      id: 3,
      titulo: 'Presentación de Nuevo Libro',
      descripcion: 'Descubre la última obra de un autor boliviano emergente.',
      fecha: '5 de Noviembre, 2023',
      hora: '19:30',
      lugar: 'Teatro Municipal de Cochabamba',
      imagen: '/event3.jpg', // Placeholder para imagen
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eventos de Autores Bolivianos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora los eventos organizados por autores bolivianos. Asiste a charlas, talleres y presentaciones literarias que enriquecen nuestra comunidad lectora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventos.map((evento) => (
            <Card key={evento.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-t-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500">Imagen del Evento</span>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {evento.titulo}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {evento.descripcion}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {evento.fecha}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {evento.hora}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    {evento.lugar}
                  </div>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Más Información
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿Quieres organizar un evento o tienes preguntas? Contáctanos.
          </p>
          <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
            Contactar Organizador
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Eventos;
