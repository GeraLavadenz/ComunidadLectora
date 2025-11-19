"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/misHistorias.module.css";
import { motion } from "framer-motion";
import { Edit, Eye, Trash, Plus } from "lucide-react";
import { stories } from "./storiesData";

const MisHistorias = () => {
  const router = useRouter();
  const [storiesList, setStoriesList] = useState(stories);
  const [showForm, setShowForm] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    author: '',
    description: '',
    genres: [] as string[],
    tags: [] as string[]
  });

  const historias = storiesList.map((story) => ({
    id: story.id,
    titulo: story.title,
    genero: story.genres.join(", "),
    estado: story.chapters.some((c) => !c.isPublished) ? "En curso" : "Finalizada",
    fecha: new Date(story.createdAt).toLocaleDateString("es-ES"),
  }));

  const handleEdit = (id: string) => {
    router.push(`/escritura/capitulos/${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/escritura/historias/${id}/ver`);
  };

  const handleCreate = () => {
    const id = `h-${storiesList.length + 1}`;
    const newS = {
      id,
      title: newStory.title,
      author: newStory.author,
      description: newStory.description,
      genres: newStory.genres,
      tags: newStory.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: []
    };
    setStoriesList([...storiesList, newS]);
    setNewStory({ title: '', author: '', description: '', genres: [], tags: [] });
    setShowForm(false);
    router.push(`/escritura/capitulos/${id}`);
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Mis Historias</h1>

      <div className={styles.createSection}>
        <button className={`${styles.btn} ${styles.create}`} onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Crear Nueva Historia
        </button>
      </div>

      {showForm && (
        <motion.div
          className={styles.formContainer}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3>Crear Nueva Historia</h3>
          <div className={styles.formGroup}>
            <label>Título:</label>
            <input
              type="text"
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              placeholder="Ingresa el título de la historia"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Autor:</label>
            <input
              type="text"
              value={newStory.author}
              onChange={(e) => setNewStory({ ...newStory, author: e.target.value })}
              placeholder="Ingresa el nombre del autor"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Descripción:</label>
            <textarea
              value={newStory.description}
              onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
              placeholder="Describe brevemente la historia"
              rows={3}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Géneros (separados por coma):</label>
            <input
              type="text"
              value={newStory.genres.join(', ')}
              onChange={(e) => setNewStory({ ...newStory, genres: e.target.value.split(',').map(g => g.trim()).filter(g => g) })}
              placeholder="Ej: Romance, Fantasía"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Etiquetas (separadas por coma):</label>
            <input
              type="text"
              value={newStory.tags.join(', ')}
              onChange={(e) => setNewStory({ ...newStory, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
              placeholder="Ej: aventura, magia"
            />
          </div>
          <div className={styles.formActions}>
            <button className={`${styles.btn} ${styles.save}`} onClick={handleCreate}>
              Crear Historia
            </button>
            <button className={`${styles.btn} ${styles.cancel}`} onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <section className={styles.grid}>
        {historias.map((historia, index) => (
          <motion.div
            key={historia.id}
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <div className={styles.cardHeader}>
              <h2>{historia.titulo}</h2>
              <span className={styles.badge}>{historia.estado}</span>
            </div>
            <p><strong>Género:</strong> {historia.genero}</p>
            <p><strong>Creado:</strong> {historia.fecha}</p>

            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.view}`} onClick={() => handleView(historia.id)}>
                <Eye size={18} /> Ver
              </button>
              <button className={`${styles.btn} ${styles.edit}`} onClick={() => handleEdit(historia.id)}>
                <Edit size={18} /> Editar
              </button>
              <button className={`${styles.btn} ${styles.delete}`}>
                <Trash size={18} /> Eliminar
              </button>
            </div>
          </motion.div>
        ))}
      </section>
    </main>
  );
};

export default MisHistorias;
