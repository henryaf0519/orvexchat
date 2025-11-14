import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import ReactFlow, { Controls, Background, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Servicios y Store
import { useChatStore } from "../../store/chatStore";
import { updateFlowJson, sendTestFlow } from "../../services/flowService";

// Componentes Refactorizados
import FlowSidebar from "./FlowSidebar";
import { useFlowGraph } from "../../hooks/useFlowGraph";
import { parseJsonToElements, generateMetaFlowJson } from "../../utils/flowTransformers";

// Modales y Nodos
import PreviewModal from "./PreviewModal";
import InputModal from "./InputModal";
import FlowInstructionsModal from "./FlowInstructionsModal";
import FlowScreenNode from "./FlowScreenNode";
import FlowCatalogNode from "./FlowCatalogNode";
import FlowFormNode from "./FlowFormNode";
import FlowConfirmationNode from "./FlowConfirmationNode";
import FlowAppointmentNode from "./FlowAppointmentNode";

const nodeTypes = {
  screenNode: FlowScreenNode,
  catalogNode: FlowCatalogNode,
  formNode: FlowFormNode,
  confirmationNode: FlowConfirmationNode,
  appointmentNode: FlowAppointmentNode,
};

const FlowBuilder = ({ flowData, flowId }) => {
  // 1. Usar el hook personalizado para la lógica del grafo
  const {
    nodes, edges, setNodes, setEdges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, injectNodeFunctions
  } = useFlowGraph();

  // 2. Estado UI local
  const [flowName, setFlowName] = useState(flowData?.name || "Mi Flujo");
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Estados de Modales
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewNodeData, setPreviewNodeData] = useState(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);

  const userData = useChatStore((state) => state.userData);
  const defaultPhoneNumber = userData && userData.PK ? userData.PK.replace("USER#", "") : "573001234567";

  // 3. Funciones para Modales (Preview)
  const openPreviewModal = useCallback((nodeData) => {
    setPreviewNodeData(nodeData);
    setIsPreviewModalOpen(true);
  }, []);
  
  const closePreviewModal = () => setIsPreviewModalOpen(false);

  // Inyector que agrega la función de abrir modal (que vive en este componente)
  const injectFunctionsWithModal = useCallback((node) => {
    const nodeWithBasicFuncs = injectNodeFunctions(node);
    return {
        ...nodeWithBasicFuncs,
        data: {
            ...nodeWithBasicFuncs.data,
            openPreviewModal: openPreviewModal
        }
    };
  }, [injectNodeFunctions, openPreviewModal]);


  // 4. Cargar Datos Iniciales
  useEffect(() => {
    if (flowData && flowData.flow_json && Object.keys(flowData.flow_json).length > 0) {
      console.log("Cargando flujo existente...");
      const { initialNodes, initialEdges } = parseJsonToElements(
        flowData.flow_json,
        flowData.navigation
      );
      // Al cargar, inyectamos las funciones
      setNodes(initialNodes.map(injectFunctionsWithModal));
      setEdges(initialEdges);
      if (flowData.name) setFlowName(flowData.name);
    }
  }, [flowData, setNodes, setEdges, injectFunctionsWithModal]);

  // Wrapper para addNode que inyecta el modal
  const handleAddNode = (type) => {
      addNode(type);
      // Nota: addNode en el hook usa injectNodeFunctions básico. 
      // ReactFlow actualizará los nodos, y si necesitamos el modal en los nuevos nodos,
      // el hook debería ser capaz de recibir 'extraFunctions'.
      // Por simplicidad en esta refactorización, podemos hacer un efecto secundario
      // o simplemente pasar el modal context. 
      // *Corrección rápida*: Como addNode del hook usa su propio inject, 
      // necesitamos actualizar los nodos con el openPreviewModal después de añadirlo
      // o modificar el hook. Para no complicar, dejaremos que el hook maneje la estructura
      // y luego usamos un useEffect o setNodes para asegurar que openPreviewModal esté.
      
      // MEJOR OPCIÓN: Actualizar los nodos inmediatamente después de añadir
      setTimeout(() => {
          setNodes((nds) => nds.map(n => ({
              ...n,
              data: { ...n.data, openPreviewModal }
          })));
      }, 0);
  };


  // 5. Manejadores de Acción (Guardar / Test)
  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Guardando flujo...");
    try {
      // Generación limpia usando el transformer
      const { metaFlowJson, navigationMapJson } = generateMetaFlowJson(nodes, edges);
      
      await updateFlowJson(
        flowId, 
        JSON.stringify(metaFlowJson), 
        JSON.stringify(navigationMapJson)
      );
      toast.success("¡Flujo guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestClick = () => setIsTestModalOpen(true);

  const handleConfirmSendTest = async (phoneNumber) => {
    setIsTestModalOpen(false);
    setIsSendingTest(true);
    try {
        const { metaFlowJson } = generateMetaFlowJson(nodes, edges);
        
        // Necesitamos el ID de la primera pantalla
        let firstScreenId = null;
        if (metaFlowJson.screens && metaFlowJson.screens.length > 0) {
            firstScreenId = metaFlowJson.screens[0].id;
        }

        if (!firstScreenId) {
            toast.error("El flujo no tiene pantallas para probar.");
            setIsSendingTest(false);
            return;
        }

        await sendTestFlow(flowId, phoneNumber, firstScreenId, flowName);
        toast.success(`Prueba enviada a ${phoneNumber}`);
    } catch (error) {
        console.error("Error al enviar prueba:", error);
        // Si el error es de permisos, abrimos modal de instrucciones
        if (error.message && (error.message.includes("permissions") || error.message.includes("Meta app"))) {
             setIsInstructionsModalOpen(true);
        } else {
             toast.error("Error al enviar prueba. Revisa la consola.");
        }
    } finally {
        setIsSendingTest(false);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
      <FlowSidebar
        isOpen={isPanelOpen}
        toggleOpen={() => setIsPanelOpen(!isPanelOpen)}
        flowName={flowName}
        setFlowName={setFlowName}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onTest={handleSendTestClick}
        isSaving={isSaving}
        isSendingTest={isSendingTest}
      />

      <div style={{ flex: 1, background: "#fcfcfc", position: "relative" }}>
        <ToastContainer position="top-right" autoClose={3000} />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        >
          <Controls />
          <Background color="#e2e8f0" gap={20} />
        </ReactFlow>
      </div>

      {/* PORTALES Y MODALES */}
      {isPreviewModalOpen && previewNodeData && ReactDOM.createPortal(
          <PreviewModal nodeData={previewNodeData} onClose={closePreviewModal} />,
          document.getElementById("modal-root")
      )}

      {isTestModalOpen && (
        <InputModal
          title="Enviar Flujo de Prueba"
          message="Ingresa el número de teléfono (con código de país) para recibir la prueba."
          inputLabel="Número de WhatsApp"
          inputPlaceholder={defaultPhoneNumber}
          confirmText="Enviar"
          onConfirm={handleConfirmSendTest}
          onCancel={() => setIsTestModalOpen(false)}
        />
      )}

      {isInstructionsModalOpen && (
        <FlowInstructionsModal
          flowName={flowId}
          onClose={() => setIsInstructionsModalOpen(false)}
          onConfirm={() => setIsInstructionsModalOpen(false)}
          test={true}
        />
      )}
    </div>
  );
};

export default function FlowBuilderProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}