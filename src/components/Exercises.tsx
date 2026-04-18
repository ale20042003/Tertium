import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X } from 'lucide-react';
import { useAppContext } from '../store';
import { Exercise } from '../types';

export const Exercises: React.FC = () => {
  const { exercises, addExercise, updateExercise, deleteExercise } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({ name: '', muscleGroup: '', description: '', videoUrl: '' });
  const [isUploading, setIsUploading] = useState(false);

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExercise) {
      if (editingExercise.videoUrl !== formData.videoUrl && editingExercise.videoUrl?.startsWith('localforage:')) {
        import('localforage').then(localforage => {
          localforage.default.removeItem(editingExercise.videoUrl!).catch(err => {
            console.error('Error removing old video:', err);
          });
        });
      }
      updateExercise({ ...editingExercise, ...formData });
    } else {
      addExercise(formData);
    }
    // Reset state without removing the video we just saved
    setIsModalOpen(false);
    setEditingExercise(null);
    setFormData({ name: '', muscleGroup: '', description: '', videoUrl: '' });
  };

  const openModal = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({ name: exercise.name, muscleGroup: exercise.muscleGroup, description: exercise.description || '', videoUrl: exercise.videoUrl || '' });
    } else {
      setEditingExercise(null);
      setFormData({ name: '', muscleGroup: '', description: '', videoUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    if (formData.videoUrl?.startsWith('localforage:') && formData.videoUrl !== editingExercise?.videoUrl) {
      import('localforage').then(localforage => {
        localforage.default.removeItem(formData.videoUrl!).catch(err => {
          console.error('Error removing orphaned video:', err);
        });
      });
    }
    setIsModalOpen(false);
    setEditingExercise(null);
    setFormData({ name: '', muscleGroup: '', description: '', videoUrl: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Esercizi</h1>
          <p className="text-neutral-500">Gestisci il database degli esercizi</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Esercizio
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cerca esercizio o gruppo muscolare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Nome Esercizio</th>
                <th className="p-4 font-medium border-b border-neutral-200">Gruppo Muscolare</th>
                <th className="p-4 font-medium border-b border-neutral-200">Descrizione</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <tr key={exercise.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900">{exercise.name}</td>
                    <td className="p-4 text-neutral-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {exercise.muscleGroup}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500 text-sm truncate max-w-xs">
                      {exercise.description || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(exercise)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Sei sicuro di voler eliminare questo esercizio?')) {
                              deleteExercise(exercise.id);
                            }
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    Nessun esercizio trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingExercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
              </h2>
              <button onClick={handleCancel} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Esercizio</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. Panca Piana"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Gruppo Muscolare</label>
                <input
                  type="text"
                  required
                  value={formData.muscleGroup}
                  onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. Petto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Video Esercizio (.mp4, facoltativo)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           try {
                             setIsUploading(true);
                             const localforage = (await import('localforage')).default;
                             if (formData.videoUrl?.startsWith('localforage:') && formData.videoUrl !== editingExercise?.videoUrl) {
                               await localforage.removeItem(formData.videoUrl);
                             }
                             
                             const reader = new FileReader();
                             reader.onload = async (event) => {
                               try {
                                 const arrayBuffer = event.target?.result as ArrayBuffer;
                                 const blob = new Blob([arrayBuffer], { type: file.type || 'video/mp4' });
                                 
                                 const id = `localforage:video-${crypto.randomUUID()}`;
                                 await localforage.setItem(id, blob);
                                 setFormData({ ...formData, videoUrl: id });
                                 setIsUploading(false);
                               } catch (err) {
                                 console.error('Error saving video inside onload:', err);
                                 alert('Errore: impossibile salvare il video. Il file potrebbe essere troppo grande per la memoria del browser.');
                                 setIsUploading(false);
                               }
                             };
                             reader.onerror = () => {
                               console.error('Error reading file');
                               alert('Errore durante la lettura del file video.');
                               setIsUploading(false);
                             };
                             reader.readAsArrayBuffer(file);
                           } catch (err) {
                             console.error('Error saving video:', err);
                             alert('Errore durante il salvataggio del video.');
                             setIsUploading(false);
                           }
                        }
                      }}
                      className="text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {formData.videoUrl?.startsWith('localforage:') && (
                    <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 font-medium">✓ File video caricato correttamente</p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (formData.videoUrl !== editingExercise?.videoUrl) {
                              const localforage = (await import('localforage')).default;
                              await localforage.removeItem(formData.videoUrl!);
                            }
                            setFormData({ ...formData, videoUrl: '' });
                          } catch (err) {
                            console.error('Error removing video:', err);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Rimuovi
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Descrizione (Opzionale)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                  placeholder="Note sull'esecuzione..."
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Caricamento...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
