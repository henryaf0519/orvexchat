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

// Tipos de nodo personalizados
const nodeTypes = { screenNode: FlowScreenNode, catalogNode: FlowCatalogNode };

// Función para generar IDs únicos para las pantallas
let screenId = 1;
const getScreenId = () => `SCREEN_${screenId++}`;

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

  // Función para añadir un nuevo nodo de pantalla
  const addScreenNode = () => {
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

    const newNode = {
      id: getScreenId(),
      type: "screenNode", // Usa el tipo de nodo personalizado
      position: newPosition,
      data: {
        // Datos que se pasarán como props al componente FlowScreenNode
        title: ``, // Título inicial
        components: [], // Lista inicial de componentes vacía
        footer_label: "", // Texto inicial del botón
        updateNodeData: updateNodeData, // Pasa la función para actualizar datos
        openPreviewModal: openPreviewModal, // *** ¡IMPORTANTE! Pasa la función para abrir el modal ***
        deleteNode: deleteNode, // Pasa la función para eliminar el nodo
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addCatalogNode = () => {
    let newPosition = { x: 100, y: 100 };
    if (nodes.length > 0) {
        const rightMostNode = nodes.reduce((rightmost, node) => (node.position.x > rightmost.position.x ? node : rightmost), nodes[0]);
        newPosition = { x: rightMostNode.position.x + 400, y: rightMostNode.position.y };
    }

    const newNode = {
      id: getScreenId(),
      type: 'catalogNode', // Tipo específico
      position: newPosition,
      data: { // Datos iniciales
        title: '',
        introText: 'Mira nuestros productos destacados:',
        products: [],
        radioLabel: '¿Cuál producto te interesa más?',
        radioOptions: [],
        footer_label: 'Seleccionar',
        // Funciones pasadas
        updateNodeData: updateNodeData,
        openPreviewModal: openPreviewModal,
        deleteNode: deleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Función para generar el JSON del flujo
  const generateFlowJson = () => {
    const routing_model = {};
    const screens = nodes.map(node => {
        const outgoingEdges = edges.filter(e => e.source === node.id);
        const nodeRoutes = [...new Set(outgoingEdges.map(e => e.target))];
        routing_model[node.id] = nodeRoutes; // Asigna rutas al routing_model

        let screenChildren = []; // Array para los hijos del layout
        let screenTerminal = false; // Por defecto no es terminal

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
                    name: "data_exchange", // Asume data_exchange, necesita ajuste si se conecta
                    payload: {
                         catalog_selection: `\${form.catalog_selection}` // Payload depende del nombre del RadioButtonsGroup
                    }
                }
            });

             // El formulario es el hijo del layout
             screenChildren.push({
                 type: "Form",
                 name: `${node.id.toLowerCase()}_catalog_form`,
                 children: catalogFormChildren
             });

            // Un nodo de catálogo es terminal si NO tiene opciones de radio O si ninguna opción está conectada
             screenTerminal = !(radioDataSource.length > 0 && nodeRoutes.length > 0);


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
                         // Quitar componente si no tiene src
                        if (!jsonComponent.src) jsonComponent = null;
                        break;
                    case 'TextInput':
                        if(component.name) {
                            formPayload[component.name] = `\${form.${component.name}}`;
                        }
                        jsonComponent = { type: 'TextInput', name: component.name || `input_${compIndex}`, label: component.label || '', required: true };
                        break;
                    case 'RadioButtonsGroup':
                        formPayload['selection'] = `\${form.selection}`; // Asume 'selection' como name
                        const dataSource = (component.options || []).map((option, optIndex) => {
                            const edgeForOption = outgoingEdges.find(e => e.sourceHandle === `${node.id}-component-${compIndex}-option-${optIndex}`);
                            return {
                                id: option.id || `option_${optIndex + 1}`, // ID de la opción
                                title: option.title
                            };
                        });
                        jsonComponent = {
                             type: 'RadioButtonsGroup',
                             label: 'Selecciona una opción:', // Hacer editable si es necesario
                             name: 'selection', // Asegurar que sea único si hay varios
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
                 name: `${node.id.toLowerCase()}_form`,
                 children: formChildren
             });

             screenTerminal = nodeRoutes.length === 0; // Terminal si no hay rutas salientes
        }

        // --- Construcción final del objeto Screen ---
        return {
            id: node.id,
            title: node.data.title || (node.type === 'catalogNode' ? 'Catálogo' : 'Pantalla sin Título'),
            terminal: screenTerminal,
            layout: {
                type: "SingleColumnLayout",
                children: screenChildren // Usa los hijos construidos arriba
            },
        };
    }); // Fin del nodes.map

    const finalJson = {
        name: flowName.toLowerCase().replace(/\s+/g, '_'), // Reemplaza espacios con guiones bajos
        version: "7.2",
        data_api_version: "3.0",
        routing_model,
        screens
    };
    setFlowJson(finalJson);
  };

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
            background: "#3b82f6",
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
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "5px",
            width: "100%",
            cursor: "pointer",
          }}
        >
          + + Añadir Catálogo +{" "}
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
