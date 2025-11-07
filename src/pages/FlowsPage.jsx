import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, UploadCloud, Loader2, Zap } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { publishFlow } from '../services/flowService';
import ConfirmationModal from '../components/ConfirmationModal';
import InputModal from '../components/InputModal';
import MainHeader from '../components/MainHeader';
import MainSidebar from '../components/MainSidebar';
import FlowInstructionsModal from '../components/FlowInstructionsModal';

const statusTranslations = {
  PUBLISHED: 'Publicado',
  DEPRECATED: 'Obsoleto',
  DRAFT: 'Borrador',
};

function FlowsPage() {
  const navigate = useNavigate();

  // Estados para CREAR
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);

  // Estados para ELIMINAR
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState(null);
  const [isDeletingFlow, setIsDeletingFlow] = useState(false);
  const [publishingFlowId, setPublishingFlowId] = useState(null); 
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false); 
  const [currentFlowForModal, setCurrentFlowForModal] = useState(null);

  // Seleccionamos individualmente para evitar bucles de renderizado
  const flows = useChatStore((state) => state.flows);
  const loadingFlows = useChatStore((state) => state.loadingFlows);
  const fetchFlows = useChatStore((state) => state.fetchFlows);
  const createNewFlow = useChatStore((state) => state.createNewFlow);
  const deleteFlow = useChatStore((state) => state.deleteFlow);
  

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // Lógica para CREAR
  const handleConfirmCreate = async (flowName) => {
    const trimmedName = flowName.trim();
    if (!trimmedName) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }
    setIsCreatingFlow(true);
    try {
      const newFlow = await createNewFlow(trimmedName);
      setIsCreateModalOpen(false);
      toast.success('Flujo creado con éxito 👌');
      navigate(`/flows/${newFlow.id}`);
    } catch (error) {
      toast.error(`Error al crear el flujo: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsCreatingFlow(false);
    }
  };

  const handleEditClick = (flowId) => {
    navigate(`/flows/${flowId}`);
  };


  // --- LÓGICA DE ELIMINAR ---

  const handleDeleteClick = (flow) => {
    setFlowToDelete(flow);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingFlow) return;
    setIsDeleteModalOpen(false);
    setFlowToDelete(null);
  };

  const confirmDelete = async () => {
    if (flowToDelete) {
      setIsDeletingFlow(true);

      try {
        await deleteFlow(flowToDelete.id);
        toast.success('Flujo eliminado con éxito 👋');
        handleCloseDeleteModal();
      } catch (error) {
        toast.error(`Error al eliminar el flujo: ${error.message || 'Error desconocido'}`);
      } finally {
        setIsDeletingFlow(false);
      }
    }
  };

const handlePublish = async (flow) => {
    if (!flow.id || !flow.name) {
      toast.error("Datos del flujo incompletos (falta ID o nombre).");
      return;
    }

    setPublishingFlowId(flow.id);
    setCurrentFlowForModal(flow); 
    toast.info(`Publicando flujo "${flow.name}"...`);

    try {
      await publishFlow(flow.id, flow.name);
      toast.success(`¡Flujo "${flow.name}" publicado con éxito!`);
      fetchFlows(); 
    } catch (error) {
      
      const userMsg = error?.metaError?.error_user_msg;
      if (userMsg && userMsg.includes("You need to connect a Meta app")) {
        
        toast.dismiss();
        setIsInstructionsModalOpen(true);
      } else {
        // Otro tipo de error
        toast.error(`Error al publicar: ${error.message || 'Error desconocido'}`);
      }
      console.error("Error al publicar:", error);
    } finally {
      setPublishingFlowId(null); 
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
            <div className='flex justify-between items-center gap-3'>
               <button
                onClick={() => navigate('/triggers')}
                className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                title="Gestionar Triggers"
              >
                <Zap size={18} />
                Triggers
              </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Crear flujo
            </button>

            </div>
           
          </div>

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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${flow.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                              flow.status === 'DEPRECATED' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {statusTranslations[flow.status] || flow.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flow.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">

                          {/* 1. Botón PUBLICAR (Solo si es DRAFT) */}
                          {flow.status === 'DRAFT' && (
                            <button
                              onClick={() => handlePublish(flow)}
                              className="text-green-600 hover:text-green-900"
                              title="Publicar Flujo"
                              disabled={publishingFlowId === flow.id || isDeletingFlow}
                            >
                              {publishingFlowId === flow.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <UploadCloud size={18} />
                              )}
                            </button>
                          )}

                          {/* 2. Botones EDITAR y ELIMINAR (Solo si es DRAFT) */}
                          {flow.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => handleEditClick(flow.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar"
                                disabled={publishingFlowId === flow.id || isDeletingFlow} 
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(flow)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                                disabled={publishingFlowId === flow.id || isDeletingFlow}
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                          
                          {/* 3. Mensaje si es PUBLISHED o DEPRECATED */}
                          {(flow.status === 'PUBLISHED' || flow.status === 'DEPRECATED') && (
                             <span className="text-xs text-gray-400 italic">No editable</span>
                          )}

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

      <ConfirmationModal
        title="Eliminar Flujo"
        message={`¿Estás seguro de que deseas eliminar el flujo "${flowToDelete?.name}"? Esta acción no se puede deshacer.`}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        confirmColor="red"
        isLoading={isDeletingFlow}
      />

      {isCreateModalOpen && (
        <InputModal
          title="Crear Nuevo Flujo"
          message="Por favor, introduce un nombre para tu nuevo flujo. Podrás editarlo más tarde."
          inputLabel="Nombre del flujo"
          inputPlaceholder="Ej: Bienvenida y Ventas"
          confirmText="Crear"
          isLoading={isCreatingFlow}
          onConfirm={handleConfirmCreate}
          onCancel={() => !isCreatingFlow && setIsCreateModalOpen(false)}
        />
      )}
      {isInstructionsModalOpen && (
        <FlowInstructionsModal
          flowName={currentFlowForModal?.id} 
          onClose={() => setIsInstructionsModalOpen(false)}
          onConfirm={() => setIsInstructionsModalOpen(false)}
          test={false}
        />
      )}
    </div>
  );
}

export default FlowsPage;