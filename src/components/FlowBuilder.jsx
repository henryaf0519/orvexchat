// src/components/FlowBuilder.jsx

import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { updateFlowJson } from "../services/flowService"; 
import PreviewModal from "./PreviewModal";
import FlowScreenNode from "./FlowScreenNode";
import FlowCatalogNode from "./FlowCatalogNode";
import FlowFormNode from "./FlowFormNode";
import FlowConfirmationNode from "./FlowConfirmationNode"; 

// ... (nodeTypes y formatTitleToID se mantienen igual) ...
const nodeTypes = {
  screenNode: FlowScreenNode,
  catalogNode: FlowCatalogNode,
  formNode: FlowFormNode,
  confirmationNode: FlowConfirmationNode, 
};

const formatTitleToID = (title, index) => {
    if (!title || title.trim() === "") {
        return `PANTALLA_SIN_TITULO_${index + 1}`;
    }
    return title
        .trim()
        .toUpperCase() // MAYUSCULAS
        .replace(/\s+/g, '_'); // espacios -> _
};


// --- COMPONENTE PRINCIPAL DEL CONSTRUCTOR ---
const FlowBuilder = ({ flowData, flowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState(flowData?.name || "Mi Flujo");
  const [isSaving, setIsSaving] = useState(false); 
  const [flowJson, setFlowJson] = useState({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewNodeData, setPreviewNodeData] = useState(null);

  // ... (onConnect, updateNodeData, deleteNode, open/close modals, getNewNodePosition, add*Node se mantienen igual) ...
  // Callback para conectar nodos
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Función para actualizar los datos internos de un nodo (pasada al nodo)
  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  };

  // Función para eliminar un nodo (pasada al nodo)
  const deleteNode = useCallback(
    (nodeIdToDelete) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
        )
      );
    },
    [setNodes, setEdges]
  );

  // --- Funciones para controlar el modal ---
  const openPreviewModal = (nodeData) => {
    setPreviewNodeData(nodeData);
    setIsPreviewModalOpen(true);
  };
  const closePreviewModal = () => setIsPreviewModalOpen(false);

  // --- Lógica de añadir nodos ---

  // Función genérica para obtener la posición del nuevo nodo
  const getNewNodePosition = () => {
    let newPosition = { x: 100, y: 100 };
    if (nodes.length > 0) {
      const rightMostNode = nodes.reduce(
        (rightmost, node) =>
          node.position.x > rightmost.position.x ? node : rightmost,
        nodes[0]
      );
      newPosition = {
        x: rightMostNode.position.x + 400,
        y: rightMostNode.position.y,
      };
    }
    return newPosition;
  };

  const addScreenNode = () => {
    const newNode = {
      id: `node_${Date.now()}`, 
      type: "screenNode", 
      position: getNewNodePosition(),
      data: {
        title: ``,
        components: [
          { type: 'Image', id: 'image_1', src: null },
          { type: 'TextBody', id: 'textbody_1', text: '¡Hola! 👋 Escribe aquí tu mensaje de bienvenida. ¿En qué podemos ayudarte?' },
          {
            type: 'RadioButtonsGroup', id: 'radiobuttonsgroup_1',
            options: [ { id: 'option_1', title: 'Hablar con un Agente' }, { id: 'option_2', title: 'Ver Servicios' } ]
          }
        ], 
        footer_label: "Continuar", 
        updateNodeData: updateNodeData, 
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode, 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addCatalogNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'catalogNode', 
      position: getNewNodePosition(),
      data: { 
        title: '',
        introText: 'Mira nuestros productos destacados:',
        products: [],
        radioLabel: '¿Cuál producto te interesa más?',
        radioOptions: [],
        footer_label: 'Seleccionar',
        updateNodeData: updateNodeData,
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addFormNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'formNode', 
      position: getNewNodePosition(),
      data: { 
        title: '',
        introText: 'Por favor, completa los siguientes datos:',
        components: [], 
        footer_label: 'Continuar',
        updateNodeData: updateNodeData,
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addConfirmationNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'confirmationNode', 
      position: getNewNodePosition(),
      data: { 
        title: '',
        headingText: '✅ ¡Todo listo!',
        bodyText: 'Oprime el boton y un agente se comunicará contigo para finalizar el proceso.',
        footer_label: 'Finalizar',
        updateNodeData: updateNodeData,
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };
  
  // --- Lógica para Generar JSON ---
  // ✅ --- INICIO DE LA MODIFICACIÓN ---
  // Esta función ahora solo retorna el JSON.
  // Ya no llama a setFlowJson.
  const generateFlowJson = () => {
  // ✅ --- FIN DE LA MODIFICACIÓN ---
    const routing_model = {};
    
    // ... (toda la lógica interna de generateFlowJson se mantiene igual) ...
    
    const idLookup = new Map();
    nodes.forEach((n, index) => {
        const jsonScreenID = formatTitleToID(n.data.title, index);
        idLookup.set(n.id, jsonScreenID);
    });

    const screens = nodes.map((node, index) => {
        const jsonScreenID = idLookup.get(node.id);
        const outgoingEdges = edges.filter(e => e.source === node.id);
        const nodeRoutes = outgoingEdges
            .map(edge => idLookup.get(edge.target))
            .filter(Boolean);
        
        routing_model[jsonScreenID] = [...new Set(nodeRoutes)];

        let screenChildren = []; 
        let screenTerminal = false; 

        if (node.type === 'catalogNode') {
            const catalogFormChildren = [];
            if (node.data.introText) {
                catalogFormChildren.push({ type: 'TextBody', text: node.data.introText });
            }
            (node.data.products || []).forEach(product => {
                if (product.imageBase64) {
                    catalogFormChildren.push({ type: 'Image', src: product.imageBase64.split(',')[1], height: 150, "scale-type": "cover" });
                }
                let productText = '';
                if (product.title) productText += `**${product.title}**\n`;
                if (product.description) productText += `${product.description}\n`;
                if (product.price) productText += `Precio: ${product.price}`;
                if (productText) {
                    catalogFormChildren.push({ type: 'TextBody', text: productText.trim() });
                }
            });
            const radioDataSource = (node.data.radioOptions || []).map((opt, index) => ({
                 id: opt.id || `cat_opt_${index + 1}`,
                 title: opt.title || `Opción ${index + 1}`
            }));
            if (radioDataSource.length > 0) {
                 catalogFormChildren.push({
                    type: 'RadioButtonsGroup', label: node.data.radioLabel || 'Selecciona:', name: 'catalog_selection',
                    "data-source": radioDataSource, required: true
                });
            }
            catalogFormChildren.push({
                type: "Footer", label: node.data.footer_label || 'Continuar',
                "on-click-action": { name: "data_exchange", payload: { catalog_selection: `\${form.catalog_selection}` } }
            });
             screenChildren.push({
                 type: "Form", name: `${jsonScreenID.toLowerCase()}_catalog_form`, children: catalogFormChildren
             });
             screenTerminal = !(radioDataSource.length > 0 && nodeRoutes.length > 0);
        
        } else if (node.type === 'formNode') {
            const formPayload = {};
            const formChildren = [];

            if (node.data.introText) {
                formChildren.push({
                    type: 'TextBody',
                    text: node.data.introText
                });
            }

            (node.data.components || []).forEach((component) => {
                if (component.type === 'TextInput' && component.name) {
                    formPayload[component.name] = `\${form.${component.name}}`;
                    let inputType = "text"; 
                    if (component.name.includes('phone') || component.name.includes('celular')) inputType = "phone";
                    if (component.name.includes('email') || component.name.includes('correo')) inputType = "email";
                    formChildren.push({
                        type: 'TextInput', label: component.label, name: component.name, "input-type": inputType, 
                        required: component.required === undefined ? true : component.required
                    });
                }
            });
            formChildren.push({
                type: "Footer", label: node.data.footer_label || 'Continuar',
                "on-click-action": { name: "data_exchange", payload: formPayload }
            });
            screenChildren.push({
                 type: "Form", name: `${jsonScreenID.toLowerCase()}_form`, children: formChildren
            });
            screenTerminal = nodeRoutes.length === 0;

        } else if (node.type === 'confirmationNode') {
            routing_model[jsonScreenID] = [];
            screenTerminal = true; 
            screenChildren.push({
                type: "Form", name: `${jsonScreenID.toLowerCase()}_form`,
                children: [
                    { type: "TextHeading", text: node.data.headingText || "✅ ¡Todo listo!" },
                    { type: "TextBody", text: "${data.details}" },
                    { type: "TextBody", text: node.data.bodyText || "Oprime el boton y un agente se comunicará contigo para finalizar el proceso." },
                    { type: "Footer", label: node.data.footer_label || 'Finalizar', "on-click-action": { name: "complete" } }
                ]
            });

        } else { // screenNode
             const formPayload = {};
             const formChildren = [];
             (node.data.components || []).forEach((component, compIndex) => {
                 let jsonComponent = null;
                 switch(component.type) {
                    case 'TextBody':
                        jsonComponent = { type: 'TextBody', text: component.text || '' };
                        break;
                    case 'Image':
                        jsonComponent = {
                            type: 'Image', 
                            src: component.src ? component.src.split(',')[1] : null,
                            height: 250, "scale-type": "cover"
                        };
                        if (!jsonComponent.src) jsonComponent = null; 
                        break;
                    case 'TextInput':
                        if(component.name) {
                            formPayload[component.name] = `\${form.${component.name}}`;
                        }
                        jsonComponent = { type: 'TextInput', name: component.name || `input_${compIndex}`, label: component.label || '', required: true };
                        break;
                    case 'RadioButtonsGroup':
                        formPayload['selection'] = `\${form.selection}`; 
                        const dataSource = (component.options || []).map((option, optIndex) => {
                            return {
                                id: option.id || `option_${optIndex + 1}`, 
                                title: option.title
                            };
                        });
                        jsonComponent = {
                             type: 'RadioButtonsGroup', label: 'Selecciona una opción:', name: 'selection', 
                             "data-source": dataSource, required: true
                        };
                        break;
                 }
                 if (jsonComponent) {
                    formChildren.push(jsonComponent);
                 }
             });
             formChildren.push({
                type: "Footer", label: node.data.footer_label || 'Continuar',
                "on-click-action": { name: "data_exchange", payload: formPayload }
            });
             screenChildren.push({
                 type: "Form", name: `${jsonScreenID.toLowerCase()}_form`, children: formChildren
             });
             screenTerminal = nodeRoutes.length === 0; 
        }

        const finalDataBlock = (node.type === 'confirmationNode') ? {
            details: {
                type: "string",
                __example__: "Name: John Doe\nEmail: john@example.com\nPhone: 123456789\n\nA free skin care consultation, please"
            }
        } : undefined;

        return {
            id: jsonScreenID,
            title: node.data.title || 'Pantalla sin Título',
            terminal: screenTerminal,
            data: finalDataBlock,
            layout: {
                type: "SingleColumnLayout",
                children: screenChildren 
            },
        };
    }); 

    const finalJson = {
        version: "7.2",
        data_api_version: "3.0",
        routing_model,
        screens
    };

    // ✅ --- INICIO DE LA MODIFICACIÓN ---
    // Quitamos setFlowJson(finalJson) de aquí...
    return finalJson; // Y solo retornamos el JSON
    // ✅ --- FIN DE LA MODIFICACIÓN ---
  };

  // ✅ --- INICIO DE LA MODIFICACIÓN ---
  // Nueva función para guardar
  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Guardando flujo...");

    try {
      // 1. Generar el JSON
      const newFlowJson = generateFlowJson();
      
      // 2. ACTUALIZAR LA VISTA PREVIA (Esto arregla el Bug 1)
      setFlowJson(newFlowJson);

      // 3. Comprobar el flowId (Esto arregla el Bug 2)
      if (!flowId) {
        toast.error("No se ha podido identificar el ID del flujo.");
        setIsSaving(false);
        return;
      }
      
      // 4. Convertir a string para enviar
      const jsonString = JSON.stringify(newFlowJson);

      // 5. Llamar al servicio de actualización
      await updateFlowJson(flowId, jsonString);

      toast.success("¡Flujo guardado con éxito!");

    } catch (error) {
      console.error("Error al guardar el flujo:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  // ✅ --- FIN DE LA MODIFICACIÓN ---


  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      {/* Panel Izquierdo: Controles del Constructor */}
      <div
        style={{
          width: "250px",
          padding: "10px",
          borderRight: "1px solid #ddd",
          background: "#f8fafc",
        }}
      >
        {/* ... (Input de flowName y botones de añadir nodos se mantienen igual) ... */}
        <h3>Constructor</h3>
        <input
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          placeholder="Nombre del Flujo"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        />
        <button
          onClick={addScreenNode}
          style={{
            padding: "10px",
            background: "#3b82f6", // Azul
            color: "white",
            border: "none",
            borderRadius: "5px",
            width: "100%",
            cursor: "pointer",
          }}
        >
          + Añadir Menú
        </button>
        <button
          onClick={addCatalogNode}
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#10b981", // Verde
            color: "white",
            border: "none",
            borderRadius: "5px",
            width: "100%",
            cursor: "pointer",
          }}
        >
          + Añadir Catálogo
        </button>
        <button
          onClick={addFormNode}
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#f59e0b", // Ámbar/Amarillo
            color: "white",
            border: "none",
            borderRadius: "5px",
            width: "100%",
            cursor: "pointer",
          }}
        >
          + Añadir Formulario
        </button>
         <button
          onClick={addConfirmationNode} 
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#ef4444", // Rojo
            color: "white",
            border: "none",
            borderRadius: "5px",
            width: "100%",
            cursor: "pointer",
          }}
        >
          + Añadir Confirmación
        </button>
      </div>

      {/* Área Central: Canvas de React Flow */}
      <div style={{ flex: 1, background: "#fcfcfc", position: "relative" }}>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          fitViewOptions={{ maxZoom: 1 }}
        >
          <Controls />
          <Background color="#e2e8f0" gap={20} />
        </ReactFlow>
      </div>

      {/* Panel Derecho: JSON */}
      <div
        style={{
          width: "400px",
          padding: "10px",
          borderLeft: "1px solid #ddd",
          background: "#f8fafc",
        }}
      >
        <h3>JSON del Flujo</h3>
        <button
          onClick={handleSave} 
          disabled={isSaving} 
          style={{
            marginBottom: "10px",
            padding: "10px",
            width: "100%",
            backgroundColor: isSaving ? "#9ca3af" : "#16a34a", 
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isSaving ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            background: "white",
            padding: "10px",
            borderRadius: "5px",
            height: "85%",
            overflowY: "auto",
            fontSize: "12px",
          }}
        >
          {JSON.stringify(flowJson, null, 2)}
        </pre>
      </div>

      {/* Renderizado del Modal */}
      {isPreviewModalOpen &&
        previewNodeData &&
        ReactDOM.createPortal(
          <PreviewModal
            nodeData={previewNodeData}
            onClose={closePreviewModal}
          />,
          document.getElementById("modal-root")
        )}
    </div>
  );
};

// --- Proveedor de React Flow ---
// ✅ --- INICIO DE LA MODIFICACIÓN ---
// Aquí estaba el error. Debemos aceptar 'props' y pasarlas
// al componente FlowBuilder.
export default function FlowBuilderProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}
// ✅ --- FIN DE LA MODIFICACIÓN ---