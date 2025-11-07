// src/pages/TriggersPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Edit2, Copy, Loader2, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import ConfirmationModal from '../components/ConfirmationModal';
import MainHeader from '../components/MainHeader';
import MainSidebar from '../components/MainSidebar';
import TriggerFormModal from '../components/TriggerFormModal'; 

function TriggersPage() {
  const navigate = useNavigate();

  // --- 1. Obtener estado de Zustand ---
  const triggers = useChatStore((state) => state.triggers);
  const loadingTriggers = useChatStore((state) => state.loadingTriggers);
  const fetchTriggers = useChatStore((state) => state.fetchTriggers);
  const flows = useChatStore((state) => state.flows);
  const fetchFlows = useChatStore((state) => state.fetchFlows); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);

  // --- 2. Cargar datos al montar ---
  useEffect(() => {
    fetchTriggers();
    if (flows.length === 0) {
      fetchFlows(); 
    }
  }, [fetchTriggers, fetchFlows, flows.length]);

  const handleOpenCreateModal = () => {
    setEditingTrigger(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trigger) => {
    setEditingTrigger(trigger);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrigger(null);
  };

  const copyTriggerUrl = (triggerId) => {
    // Esta URL es solo un ejemplo, ajústala a tu necesidad real
    const url = `https://tudominio.com/w/trigger/${triggerId}`; 
    navigator.clipboard.writeText(url);
    toast.success('URL del Trigger copiada al portapapeles');
  };

  // --- 3. Lógica para deshabilitar el botón de crear ---
  const hasExistingTrigger = triggers.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <MainHeader />

        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">Gestor de Triggers</h1>
            <button
              onClick={handleOpenCreateModal}
              // --- 4. APLICAR CAMBIOS AL BOTÓN ---
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={hasExistingTrigger} // <-- Se deshabilita si ya existe uno
              title={hasExistingTrigger ? "De momento, solo se permite un trigger." : "Crear un nuevo trigger"}
              // --- FIN DE CAMBIOS ---
            >
              <Plus size={20} />
              Crear Trigger
            </button>
          </div>

          {/* ... (resto del JSX de la página, sin cambios) ... */}
          
          {loadingTriggers ? (
            <p>Cargando triggers...</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {/* ... (thead sin cambios) ... */}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {triggers.length > 0 ? (
                    triggers.map((trigger) => (
                      <tr key={trigger.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trigger.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{trigger.flow_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{trigger.screen_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trigger.flow_cta}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          <button
                            onClick={() => copyTriggerUrl(trigger.id)}
                            className="text-gray-500 hover:text-blue-600"
                            title="Copiar URL de Trigger"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(trigger)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No se encontraron triggers. ¡Crea uno nuevo!
                      </td>
                    </tr>
                   )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <TriggerFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          trigger={editingTrigger} 
        />
      )}
    </div>
  );
}

export default TriggersPage;