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
import PreviewModal from "./PreviewModal";
import FlowScreenNode from "./FlowScreenNode";
import FlowCatalogNode from "./FlowCatalogNode";
import FlowFormNode from "./FlowFormNode";
import FlowConfirmationNode from "./FlowConfirmationNode"; // ✅ 1. Importado

// Tipos de nodo personalizados
const nodeTypes = {
  screenNode: FlowScreenNode,
  catalogNode: FlowCatalogNode,
  formNode: FlowFormNode,
  confirmationNode: FlowConfirmationNode, // ✅ 2. Registrado
};

// ✅ --- INICIO DEL CAMBIO: Nueva Función de Formato de ID ---
/**
 * Convierte un título de nodo (ej: "Pantalla Bienvenida")
 * en un ID compatible con WhatsApp (ej: "PANTALLA_BIENVENIDA").
 * @param {string} title - El título del nodo.
 * @param {number} index - Un índice de respaldo para IDs únicos.
 * @returns {string} - El ID formateado.
 */
const formatTitleToID = (title, index) => {
    if (!title || title.trim() === "") {
        // Fallback si el título está vacío para evitar IDs duplicados
        return `PANTALLA_SIN_TITULO_${index + 1}`;
    }
    return title
        .trim()
        .toUpperCase() // MAYUSCULAS
        .replace(/\s+/g, '_'); // espacios -> _
};
// ✅ --- FIN DEL CAMBIO ---


// --- COMPONENTE PRINCIPAL DEL CONSTRUCTOR ---
const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState("Mi Flujo de Bienvenida");
  const [flowJson, setFlowJson] = useState({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewNodeData, setPreviewNodeData] = useState(null);

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

  // ✅ --- INICIO DEL CAMBIO: Lógica de añadir nodos actualizada ---

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

  // Función para añadir un nuevo nodo de pantalla
  const addScreenNode = () => {
    const newNode = {
      // ID interno estable para React Flow
      id: `node_${Date.now()}`, 
      type: "screenNode", 
      position: getNewNodePosition(),
      data: {
        title: ``,
        components: [], 
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
      id: `node_${Date.now()}`, // ID interno estable
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

  // --- FUNCIÓN PARA AÑADIR EL NODO DE FORMULARIO ---
  const addFormNode = () => {
    const newNode = {
      id: `node_${Date.now()}`, // ID interno estable
      type: 'formNode', 
      position: getNewNodePosition(),
      data: { 
        title: '',
        components: [], 
        footer_label: 'Continuar',
        updateNodeData: updateNodeData,
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // ✅ 3. FUNCIÓN PARA AÑADIR EL NODO DE CONFIRMACIÓN
  const addConfirmationNode = () => {
    const newNode = {
      id: `node_${Date.now()}`, // ID interno estable
      type: 'confirmationNode', 
      position: getNewNodePosition(),
      data: { 
        title: '', // El usuario lo llenará (ej: 'CONFIRM')
        headingText: '✅ ¡Todo listo!', // Valor por defecto
        bodyText: 'Oprime el boton y un agente se comunicará contigo para finalizar el proceso.', // Valor por defecto
        footer_label: 'Finalizar', // Valor por defecto
        updateNodeData: updateNodeData,
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };
  // ✅ --- FIN DEL CAMBIO ---


  // ✅ --- INICIO DEL CAMBIO: `generateFlowJson` reestructurado ---
  const generateFlowJson = () => {
    const routing_model = {};
    
    // 1. Crear un mapa de búsqueda (Lookup Map)
    //    Mapea el ID interno (ej: 'node_123') al ID de JSON (ej: 'NUEVA_PANTALLA')
    const idLookup = new Map();
    nodes.forEach((n, index) => {
        const jsonScreenID = formatTitleToID(n.data.title, index);
        idLookup.set(n.id, jsonScreenID);
    });

    // 2. Mapear Nodos y Rutas usando el mapa de búsqueda
    const screens = nodes.map((node, index) => {
        // Obtener el ID de JSON para este nodo
        const jsonScreenID = idLookup.get(node.id);

        // Encontrar todas las rutas salientes (edges)
        const outgoingEdges = edges.filter(e => e.source === node.id);
        
        // Mapear los IDs de destino al formato de JSON
        const nodeRoutes = outgoingEdges
            .map(edge => idLookup.get(edge.target)) // Traduce 'node_456' a 'PANTALLA_SIGUIENTE'
            .filter(Boolean); // Filtrar por si acaso hay un enlace roto
        
        // Asignar al routing_model
        routing_model[jsonScreenID] = [...new Set(nodeRoutes)]; // Usar Set para evitar duplicados

        let screenChildren = []; 
        let screenTerminal = false; 

        // --- MANEJO PARA NODO DE CATÁLOGO ---
        if (node.type === 'catalogNode') {
            const catalogFormChildren = [];

            if (node.data.introText) {
                catalogFormChildren.push({ type: 'TextBody', text: node.data.introText });
            }

            (node.data.products || []).forEach(product => {
                if (product.imageBase64) {
                    catalogFormChildren.push({
                        type: 'Image',
                        src: product.imageBase64.split(',')[1],
                        height: 150,
                        "scale-type": "cover"
                    });
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
                    type: 'RadioButtonsGroup',
                    label: node.data.radioLabel || 'Selecciona:',
                    name: 'catalog_selection',
                    "data-source": radioDataSource,
                    required: true
                });
            }

            catalogFormChildren.push({
                type: "Footer",
                label: node.data.footer_label || 'Continuar',
                "on-click-action": {
                    name: "data_exchange", 
                    payload: {
                         catalog_selection: `\${form.catalog_selection}` 
                    }
                }
            });

             screenChildren.push({
                 type: "Form",
                 name: `${jsonScreenID.toLowerCase()}_catalog_form`, // Usar ID de JSON
                 children: catalogFormChildren
             });

             screenTerminal = !(radioDataSource.length > 0 && nodeRoutes.length > 0);
        
        // --- NUEVO MANEJO PARA NODO DE FORMULARIO ---
        } else if (node.type === 'formNode') {
            const formPayload = {};
            const formChildren = [];

            (node.data.components || []).forEach((component) => {
                if (component.type === 'TextInput' && component.name) {
                    formPayload[component.name] = `\${form.${component.name}}`;
                    
                    let inputType = "text"; 
                    if (component.name.includes('phone') || component.name.includes('celular')) inputType = "phone";
                    if (component.name.includes('email') || component.name.includes('correo')) inputType = "email";

                    formChildren.push({
                        type: 'TextInput',
                        label: component.label,
                        name: component.name,
                        "input-type": inputType, 
                        required: component.required === undefined ? true : component.required
                    });
                }
            });

            formChildren.push({
                type: "Footer",
                label: node.data.footer_label || 'Continuar',
                "on-click-action": {
                    name: "data_exchange",
                    payload: formPayload 
                }
            });

            screenChildren.push({
                 type: "Form",
                 name: `${jsonScreenID.toLowerCase()}_form`, // Usar ID de JSON
                 children: formChildren
            });
            
            screenTerminal = nodeRoutes.length === 0;

        // ✅ 4. NUEVO MANEJO PARA NODO DE CONFIRMACIÓN
        } else if (node.type === 'confirmationNode') {
            // Este nodo es terminal
            routing_model[jsonScreenID] = []; // Sin rutas de salida
            screenTerminal = true; // Marcar como terminal

            screenChildren.push({
                type: "Form",
                name: `${jsonScreenID.toLowerCase()}_form`,
                children: [
                    {
                        type: "TextHeading",
                        text: node.data.headingText || "✅ ¡Todo listo!"
                    },
                    {
                        type: "TextBody",
                        text: "${data.details}" // Variable dinámica
                    },
                    {
                        type: "TextBody",
                        text: node.data.bodyText || "Oprime el boton y un agente se comunicará contigo para finalizar el proceso."
                    },
                    {
                        type: "Footer",
                        label: node.data.footer_label || 'Finalizar',
                        "on-click-action": {
                            name: "complete" // Acción de finalización
                        }
                    }
                ]
            });

        // --- MANEJO PARA NODO NORMAL (screenNode) ---
        } else {
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
                            height: 250,
                            "scale-type": "cover"
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
                            const edgeForOption = outgoingEdges.find(e => e.sourceHandle === `${node.id}-component-${compIndex}-option-${optIndex}`);
                            return {
                                id: option.id || `option_${optIndex + 1}`, 
                                title: option.title
                            };
                        });
                        jsonComponent = {
                             type: 'RadioButtonsGroup',
                             label: 'Selecciona una opción:', 
                             name: 'selection', 
                             "data-source": dataSource,
                             required: true
                        };
                        break;
                 }
                 if (jsonComponent) {
                    formChildren.push(jsonComponent);
                 }
             });

             formChildren.push({
                type: "Footer",
                label: node.data.footer_label || 'Continuar',
                "on-click-action": {
                    name: "data_exchange",
                    payload: formPayload
                }
            });

             screenChildren.push({
                 type: "Form",
                 name: `${jsonScreenID.toLowerCase()}_form`, // Usar ID de JSON
                 children: formChildren
             });

             screenTerminal = nodeRoutes.length === 0; 
        }

        // --- Construcción final del objeto Screen ---
        return {
            id: jsonScreenID, // ID del JSON (ej: "PANTALLA_NUEVA")
            title: node.data.title || 'Pantalla sin Título', // Título para WA
            terminal: screenTerminal,
            // ✅ 5. AÑADIDO 'data' para el nodo de confirmación
            data: (node.type === 'confirmationNode') ? { details: {} } : undefined,
            layout: {
                type: "SingleColumnLayout",
                children: screenChildren 
            },
        };
    }); // Fin del nodes.map

    const finalJson = {
        version: "7.2",
        data_api_version: "3.0",
        routing_model,
        screens
    };
    setFlowJson(finalJson);
  };
  // ✅ --- FIN DEL CAMBIO ---


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
          + Añadir Pantalla
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
        {/* --- Botón de Formulario --- */}
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
        {/* ✅ 6. BOTÓN DE CONFIRMACIÓN */}
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
        {" "}
        {/* Añade position: relative aquí */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes} // Asegúrate de registrar tus tipos de nodo
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          fitViewOptions={{ maxZoom: 1 }}
        >
          <Controls />
          <Background color="#e2e8f0" gap={20} />
          {/* El modal ya NO se renderiza aquí directamente */}
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
          onClick={generateFlowJson}
          style={{
            marginBottom: "10px",
            padding: "10px",
            width: "100%",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Generar/Actualizar JSON
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

      {/* --- Renderizado del Modal usando Portal ---
            Esto renderizará el modal en <div id="modal-root"> en tu index.html,
            permitiéndole ocupar toda la pantalla sin ser restringido por los contenedores de React Flow.
        */}
      {isPreviewModalOpen &&
        previewNodeData &&
        ReactDOM.createPortal(
          <PreviewModal
            nodeData={previewNodeData}
            onClose={closePreviewModal}
          />,
          document.getElementById("modal-root") // El elemento DOM destino fuera de #root
        )}
    </div>
  );
};

// --- Proveedor de React Flow ---
export default function FlowBuilderProvider() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}