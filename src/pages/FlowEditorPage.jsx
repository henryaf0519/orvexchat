import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import MainHeader from '../components/MainHeader';
import MainSidebar from '../components/MainSidebar';
import  FlowBuilder from '../components/FlowBuilder/index';

function FlowEditorPage() {
  const { flowId } = useParams();
  const navigate = useNavigate();

  const flow = useChatStore((state) => state.currentEditingFlow);
  const loading = useChatStore((state) => state.loadingCurrentFlow);
  const fetchFlowById = useChatStore((state) => state.fetchFlowById);
  const clearCurrentEditingFlow = useChatStore((state) => state.clearCurrentEditingFlow);
  // --- FIN DE LA CORRECCIÓN ---

  useEffect(() => {
    if (flowId) {
      fetchFlowById(flowId);
    }
    
    return () => {
      clearCurrentEditingFlow();
    };
  }, [flowId, fetchFlowById, clearCurrentEditingFlow]); // Estas dependencias ahora son estables

  const handleBack = () => {
    navigate('/flows');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        

        <div className="p-4 border-b flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-md hover:bg-gray-200"
            title="Volver a la lista"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">
            {loading && 'Cargando flujo...'}
            {flow && `Editando Flujo: ${flow.name}`}
          </h1>
        </div>

        <div className="flex-grow relative">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <p>Cargando editor...</p>
            </div>
          )}
          
          {flow && (
            <FlowBuilder
              flowData={flow}
              flowId={flowId} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FlowEditorPage;