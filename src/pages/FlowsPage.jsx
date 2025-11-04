import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import ConfirmationModal from '../components/ConfirmationModal';
import InputModal from '../components/InputModal'; // Importar modal
import MainHeader from '../components/MainHeader';
import MainSidebar from '../components/MainSidebar';

// Objeto para traducir los estados de la API a español
const statusTranslations = {
  PUBLISHED: 'Publicado',
  DEPRECATED: 'Obsoleto',
  DRAFT: 'Borrador',
};

function FlowsPage() {
  const navigate = useNavigate();
  const [flowToDelete, setFlowToDelete] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // --- 1. NUEVO ESTADO PARA EL SPINNER ---
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);

  // ... (tus selecciones del store están perfectas)
  const flows = useChatStore((state) => state.flows);
  const loadingFlows = useChatStore((state) => state.loadingFlows);
  const fetchFlows = useChatStore((state) => state.fetchFlows);
  const createNewFlow = useChatStore((state) => state.createNewFlow);
  const deleteFlow = useChatStore((state) => state.deleteFlow);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // --- 2. LÓGICA DE CREACIÓN ACTUALIZADA ---
  const handleConfirmCreate = async (flowName) => {
    const trimmedName = flowName.trim();
    if (!trimmedName) {
      toast.error('El nombre no puede estar vacío.');
      return; // No cierra el modal, permite al usuario corregir
    }

    setIsCreatingFlow(true); // <-- Activa el spinner

    try {
      // Llama a la API
      const newFlow = await createNewFlow(trimmedName);
      
      // Éxito: Cierra modal, muestra toast, y navega
      setIsCreateModalOpen(false);
      toast.success('Flujo creado con éxito 👌');
      navigate(`/flows/${newFlow.id}`);

    } catch (error) {
      // Error: Muestra toast de error (el modal sigue abierto para reintentar)
      toast.error(`Error al crear el flujo: ${error.message || 'Error desconocido'}`);
    } finally {
      // Al final, quita el spinner
      setIsCreatingFlow(false);
    }
  };
  
  // ... (El resto de tus funciones: handleEditClick, handleDeleteClick, confirmDelete)
  const handleEditClick = (flowId) => {
    navigate(`/flows/${flowId}`);
  };

  const handleDeleteClick = (flow) => {
    setFlowToDelete(flow);
  };

  const confirmDelete = () => {
    if (flowToDelete) {
      toast.promise(
        deleteFlow(flowToDelete.id),
        {
          pending: 'Eliminando flujo...',
          success: 'Flujo eliminado con éxito 👋',
          error: 'Error al eliminar el flujo 🤯'
        }
      );
      setFlowToDelete(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <MainHeader />
        
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">Gestor de Flujos</h1>
            <button
              onClick={() => setIsCreateModalOpen(true)} // Solo abre el modal
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Crear flujo
            </button>
          </div>

          {/* ... (Tu tabla de flujos está perfecta) ... */}
          {loadingFlows ? (
            <p>Cargando flujos...</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flows.length > 0 ? (
                    flows.map((flow) => (
                      <tr key={flow.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{flow.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            flow.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                            flow.status === 'DEPRECATED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusTranslations[flow.status] || flow.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flow.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(flow.id)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(flow)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No se encontraron flujos. ¡Crea uno nuevo!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Confirmación para Borrar */}
      {flowToDelete && (
        <ConfirmationModal
          title="Eliminar Flujo"
          message={`¿Estás seguro de que deseas eliminar el flujo "${flowToDelete.name}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={() => setFlowToDelete(null)}
          confirmText="Eliminar"
          confirmColor="red"
        />
      )}

      {/* --- 3. MODAL DE CREACIÓN CON EL ESTADO DE CARGA --- */}
      {isCreateModalOpen && (
        <InputModal
          title="Crear Nuevo Flujo"
          message="Por favor, introduce un nombre para tu nuevo flujo. Podrás editarlo más tarde."
          inputLabel="Nombre del flujo"
          inputPlaceholder="Ej: Bienvenida y Ventas"
          confirmText="Crear"
          isLoading={isCreatingFlow} // <-- Pasa el estado de carga
          onConfirm={handleConfirmCreate}
          // Cierra el modal solo si no está cargando
          onCancel={() => !isCreatingFlow && setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

export default FlowsPage;