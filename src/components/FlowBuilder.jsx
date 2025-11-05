// src/components/FlowBuilder.jsx

import React, { useState, useCallback, useEffect } from "react"; // Importar useEffect
import ReactDOM from "react-dom";
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType, // Para las flechas
} from "reactflow";
import "reactflow/dist/style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateFlowJson } from "../services/flowService";
import PreviewModal from "./PreviewModal";
import FlowScreenNode from "./FlowScreenNode";
import FlowCatalogNode from "./FlowCatalogNode";
import FlowFormNode from "./FlowFormNode";
import FlowConfirmationNode from "./FlowConfirmationNode";

const nodeTypes = {
  screenNode: FlowScreenNode,
  catalogNode: FlowCatalogNode,
  formNode: FlowFormNode,
  confirmationNode: FlowConfirmationNode,
};

// --- Función de Formato de ID ---
const formatTitleToID = (title, index) => {
  if (!title || title.trim() === "") {
    return `PANTALLA_SIN_TITULO_${index + 1}`;
  }
  return title
    .trim()
    .toUpperCase() // MAYUSCULAS
    .replace(/\s+/g, "_"); // espacios -> _
};

// --- LÓGICA DE RECONSTRUCCIÓN DE JSON A NODOS ---

// Ayudante para inferir el tipo de nodo basado en el contenido del JSON
const determineNodeType = (screen) => {
  const form = screen.layout.children.find((c) => c.type === "Form");
  if (!form || !form.children) return "screenNode"; // Default

  // 1. Signature de ConfirmationNode
  const hasCompleteAction = form.children.some(
    (c) => c.type === "Footer" && c["on-click-action"]?.name === "complete"
  );
  if (hasCompleteAction) return "confirmationNode";

  // 2. Signature de CatalogNode
  const hasCatalogSelection = form.children.some(
    (c) => c.type === "RadioButtonsGroup" && c.name === "catalog_selection"
  );
  if (hasCatalogSelection) return "catalogNode";

  // 3. Signature de FormNode
  const hasTextInput = form.children.some((c) => c.type === "TextInput");
  if (hasTextInput) return "formNode";

  // 4. Default a ScreenNode (Menu)
  return "screenNode";
};

// Ayudante para reconstruir el 'data' object que espera el nodo
const reconstructNodeData = (screen, nodeType) => {
  const form = screen.layout.children.find((c) => c.type === "Form");
  if (!form) return { title: screen.title || "" }; // Fallback

  const footer = form.children.find((c) => c.type === "Footer");
  const baseData = {
    title: screen.title || "",
    footer_label: footer?.label || "Continuar",
  };

  try {
    switch (nodeType) {
      case "confirmationNode":
        return {
          ...baseData,
          headingText:
            form.children.find((c) => c.type === "TextHeading")?.text || "",
          bodyText:
            form.children.find(
              (c) => c.type === "TextBody" && c.text !== "${data.details}"
            )?.text || "",
          footer_label: footer?.label || "Finalizar",
        };

      case "catalogNode":
        // Esto es una aproximación, ya que el JSON no guarda 'products'
        return {
          ...baseData,
          introText:
            form.children.find((c) => c.type === "TextBody")?.text || "",
          products: [], // Imposible reconstruir productos desde el JSON actual
          radioLabel:
            form.children.find((c) => c.type === "RadioButtonsGroup")?.label ||
            "",
          radioOptions:
            form.children
              .find((c) => c.type === "RadioButtonsGroup")
              ?.["data-source"].map((opt) => ({
                id: opt.id,
                title: opt.title,
              })) || [],
        };

      case "formNode":
        return {
          ...baseData,
          introText:
            form.children.find((c) => c.type === "TextBody")?.text || "",
          components:
            form.children
              .filter((c) => c.type === "TextInput")
              .map((c, i) => ({
                type: "TextInput",
                id: `input_${i}`,
                label: c.label,
                name: c.name,
                required: c.required,
              })) || [],
        };

      case "screenNode":
      default:
        return {
          ...baseData,
          components: form.children
            .filter((c) => c.type !== "Footer") // Filtramos el footer
            .map((c, i) => {
              // Reconstruir componentes
              if (c.type === "Image") {
                return {
                  type: "Image",
                  id: `image_${i}`,
                  src: c.src ? `data:image/png;base64,${c.src}` : null,
                };
              }
              if (c.type === "TextBody") {
                return { type: "TextBody", id: `textbody_${i}`, text: c.text };
              }
              if (c.type === "RadioButtonsGroup") {
                return {
                  type: "RadioButtonsGroup",
                  id: `radio_${i}`,
                  options:
                    c["data-source"].map((opt) => ({
                      id: opt.id,
                      title: opt.title,
                    })) || [],
                };
              }
              return null;
            })
            .filter(Boolean), // Eliminar nulos
        };
    }
  } catch (error) {
    console.error("Error reconstruyendo datos del nodo:", error, screen);
    return { ...baseData, title: screen.title || "ERROR AL CARGAR" };
  }
};

/**
 * Función principal de reconstrucción.
 * Toma el flow.json y lo convierte en nodos y ejes.
 */
const parseJsonToElements = (flowJson) => {
  if (!flowJson || !flowJson.screens || !flowJson.routing_model) {
    console.warn("JSON de flujo inválido o vacío. Empezando tablero limpio.");
    return { initialNodes: [], initialEdges: [] };
  }

  const { screens, routing_model } = flowJson;
  const screenMap = new Map(screens.map((s) => [s.id, s]));

  // 1. Crear Nodos
  const initialNodes = screens.map((screen, index) => {
    const nodeType = determineNodeType(screen);
    const nodeData = reconstructNodeData(screen, nodeType);

    return {
      id: screen.id, // Usamos el ID del JSON (ej: PANTALLA_INICIO)
      type: nodeType,
      position: { x: 250 + index * 400, y: 100 }, // Posición simple en fila
      data: {
        ...nodeData,
        // Inyectamos placeholders que se sobreescribirán
        updateNodeData: () => {},
        openPreviewModal: () => {},
        deleteNode: () => {},
      },
    };
  });

  // 2. Crear Ejes
  const initialEdges = [];
  for (const [sourceId, targets] of Object.entries(routing_model)) {

    const sourceNode = initialNodes.find(n => n.id === sourceId);
    if (!sourceNode || !screenMap.has(sourceId)) continue;
    
    let connectionsHandled = false;

    if (sourceNode.type === 'screenNode') {
      const radioCompIndex = sourceNode.data.components.findIndex(c => c.type === 'RadioButtonsGroup');
      
      if (radioCompIndex !== -1) {
        const radioComponent = sourceNode.data.components[radioCompIndex];
        
        targets.forEach((targetId) => {
          if (!screenMap.has(targetId)) return;
          const optionIndex = (radioComponent.options || []).findIndex(opt => opt.id === targetId);

          if (optionIndex !== -1) {
            // Found the option! Create an edge from its specific handle
            const handleId = `${sourceId}-component-${radioCompIndex}-option-${optionIndex}`;
            initialEdges.push({
              id: `edge_${sourceId}_${handleId}_${targetId}`,
              source: sourceId,
              target: targetId,
              sourceHandle: handleId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: 'smoothstep',
            });
          } else {
            // This target is not from a radio button, must be from the main footer
            initialEdges.push({
              id: `edge_${sourceId}_${targetId}`,
              source: sourceId, // Main node output
              target: targetId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: 'smoothstep',
            });
          }
        });
        connectionsHandled = true; // Mark as handled
      }
    }

    // --- Caso 2: Nodos de Catálogo ---
    if (sourceNode.type === 'catalogNode') {
      const catalogOptions = sourceNode.data.radioOptions || [];

      if (catalogOptions.length > 0) {
        targets.forEach((targetId) => {
          if (!screenMap.has(targetId)) return;

          // Find the corresponding option index
          const optionIndex = catalogOptions.findIndex(opt => opt.id === targetId);
          
          if (optionIndex !== -1) {
            // Found it! Create edge from the catalog option handle
            const handleId = `${sourceId}-catalog-option-${optionIndex}`;
            initialEdges.push({
              id: `edge_${sourceId}_${handleId}_${targetId}`,
              source: sourceId,
              target: targetId,
              sourceHandle: handleId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: 'smoothstep',
            });
          } else {
              // Fallback for the main footer button (if it exists)
            initialEdges.push({
              id: `edge_${sourceId}_${targetId}`,
              source: sourceId,
              target: targetId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: 'smoothstep',
            });
          }
        });
        connectionsHandled = true; // Mark as handled
      }
    }

    // --- Caso 3: Fallback (Formularios o Nodos sin opciones) ---
    if (!connectionsHandled) {
      targets.forEach((targetId) => {
        if (screenMap.has(targetId)) {
          initialEdges.push({
            id: `edge_${sourceId}_${targetId}`,
            source: sourceId,
            target: targetId,
            markerEnd: { type: MarkerType.ArrowClosed },
            type: 'smoothstep',
          });
        }
      });
    }
  }

  return { initialNodes, initialEdges };
};

// --- COMPONENTE PRINCIPAL DEL CONSTRUCTOR ---
const FlowBuilder = ({ flowData, flowId }) => {
  // Usamos el hook 'useNodesState' para inicializar.
  // El 'useEffect' de abajo se encargará de poblarlos.
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [flowName, setFlowName] = useState(flowData?.name || "Mi Flujo");
  const [isSaving, setIsSaving] = useState(false);
  // Inicializamos el JSON con el que viene de props (si existe)
  const [flowJson, setFlowJson] = useState(flowData?.flow_json || {});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewNodeData, setPreviewNodeData] = useState(null);

  // Callback para conectar nodos
  const onConnect = useCallback(
    (params) => {
      // 1. Crear la nueva conexión (edge)
      const newEdge = { ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } };
      setEdges((eds) => addEdge(newEdge, eds));

      // 2. Lógica para actualizar los datos del NODO DE ORIGEN
      
      if (
        params.sourceHandle &&
        params.sourceHandle.startsWith(`${params.source}-option`)
      ) {
        // Caso: Se está conectando un handle de opción *existente*
        // (Esto actualiza el 'targetScreen' si se reconecta un handle)
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source) {
              
              // Buscamos el RadioButtonsGroup
              const newComponents = node.data.components.map(comp => {
                if (comp.type === 'RadioButtonsGroup') {
                  // Actualizamos la opción específica
                  const updatedOptions = comp.options.map((opt) => {
                    // 'targetHandle' se define en FlowScreenNode, asegurémonos que exista
                    if (opt.targetHandle === params.sourceHandle) {
                      return { ...opt, targetScreen: params.target };
                    }
                    return opt;
                  });
                  return { ...comp, options: updatedOptions };
                }
                return comp;
              });

              return {
                ...node,
                data: {
                  ...node.data,
                  components: newComponents,
                },
              };
            }
            return node;
          }),
        );
      } else if (params.sourceHandle === `${params.source}-add-option-source`) {
        // --- ESTA ES LA LÓGICA QUE FALTABA ---
        // Caso: Se está conectando el handle "Añadir Menú" (crear nueva opción)
        setNodes((nds) =>
          nds.map((node) => {
            // Encontrar el nodo de origen
            if (node.id === params.source) {
              const newData = { ...node.data };
              
              // Encontrar el componente RadioButtonsGroup dentro del nodo
              const newComponents = newData.components.map(comp => {
                if (comp.type === 'RadioButtonsGroup') {
                  
                  // El ID de la opción es el ID de la pantalla de destino
                  const newOptionId = params.target; // ej: "DATOS"

                  const newOption = {
                    id: newOptionId, // ID de la pantalla de destino
                    title: `Ir a ${params.target}`, // Título por defecto
                  };

                  // Retornar el componente actualizado con la nueva opción
                  return {
                    ...comp,
                    options: [...(comp.options || []), newOption]
                  };
                }
                return comp;
              });

              // Retornamos el nodo actualizado con los nuevos componentes
              return {
                ...node,
                data: {
                  ...newData,
                  components: newComponents
                },
              };
            }
            return node;
          }),
        );
      }
    },
    [setEdges, setNodes], // ¡Importante añadir setNodes!
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

  // Helper para inyectar funciones en nodos (nuevos o cargados)
  const injectNodeFunctions = (node) => ({
    ...node,
    data: {
      ...node.data,
      updateNodeData: updateNodeData,
      openPreviewModal: openPreviewModal,
      deleteNode: deleteNode,
    },
  });

 const addScreenNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: "screenNode",
      position: getNewNodePosition(),
      data: {
        title: ``,
        components: [
          { type: "Image", id: "image_1", src: null },
          {
            type: "TextBody",
            id: "textbody_1",
            text: "¡Hola! 👋 Escribe aquí tu mensaje de bienvenida.",
          },
          {
            type: "RadioButtonsGroup",
            id: "radiobuttonsgroup_1",
            // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
            options: [], // ¡Debe empezar vacío!
          },
        ],
        footer_label: "Continuar",
      },
    };
    setNodes((nds) => nds.concat(injectNodeFunctions(newNode)));
  };

  const addCatalogNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: "catalogNode",
      position: getNewNodePosition(),
      data: {
        title: "",
        introText: "Mira nuestros productos destacados:",
        products: [],
        radioLabel: "¿Cuál producto te interesa más?",
        radioOptions: [],
        footer_label: "Seleccionar",
      },
    };
    setNodes((nds) => nds.concat(injectNodeFunctions(newNode)));
  };

  const addFormNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: "formNode",
      position: getNewNodePosition(),
      data: {
        title: "",
        introText: "Por favor, completa los siguientes datos:",
        components: [],
        footer_label: "Continuar",
      },
    };
    setNodes((nds) => nds.concat(injectNodeFunctions(newNode)));
  };

  const addConfirmationNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: "confirmationNode",
      position: getNewNodePosition(),
      data: {
        title: "",
        headingText: "✅ ¡Todo listo!",
        bodyText:
          "Oprime el boton y un agente se comunicará contigo para finalizar el proceso.",
        footer_label: "Finalizar",
      },
    };
    setNodes((nds) => nds.concat(injectNodeFunctions(newNode)));
  };

  /**
   * Este hook se ejecuta cuando el componente carga
   * o cuando 'flowData' (del store) cambia.
   */
  useEffect(() => {
    // Verificamos que flowData exista y tenga un flow_json
    if (
      flowData &&
      flowData.flow_json &&
      Object.keys(flowData.flow_json).length > 0
    ) {
      console.log("Cargando flujo existente desde JSON...");

      // 1. Reconstruir nodos y ejes desde el JSON
      const { initialNodes, initialEdges } = parseJsonToElements(
        flowData.flow_json
      );

      // 2. Inyectar las funciones (update, delete, etc.) en los nodos cargados
      const nodesWithFunctions = initialNodes.map(injectNodeFunctions);

      // 3. Setear el estado de React Flow
      setNodes(nodesWithFunctions);
      setEdges(initialEdges);

      // 4. Setear el JSON en el panel derecho
      setFlowJson(flowData.flow_json);

      // 5. Actualizar el nombre del flujo en el panel izquierdo
      if (flowData.name) {
        setFlowName(flowData.name);
      }
    } else if (flowData) {
      // Existe el flowData pero no el flow_json (es nuevo)
      console.log("Iniciando nuevo flujo (tablero limpio).");
      setNodes([]);
      setEdges([]);
      setFlowJson({});
      if (flowData.name) {
        setFlowName(flowData.name);
      }
    }
    // 'setNodes' y 'setEdges' no deben ir en las dependencias si usamos 'useNodesState'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowData]); // Solo se ejecuta cuando flowData cambia

  // --- Lógica para Generar JSON ---
  const generateFlowJson = () => {
    const routing_model = {};

    // Usamos 'nodes' (el estado actual) para asegurar que los IDs
    // (ej: PANTALLA_INICIO) se preserven al guardar.
    const idLookup = new Map();
    nodes.forEach((n, index) => {
      // Si el nodo ya tiene un ID (cargado de JSON), usarlo.
      // Si es un nodo nuevo (id: node_12345), generar uno.
      const jsonScreenID = n.id.startsWith("node_")
        ? formatTitleToID(n.data.title, index)
        : n.id;
      idLookup.set(n.id, jsonScreenID);
    });

    const screens = nodes.map((node, index) => {
      const jsonScreenID = idLookup.get(node.id); // Usamos el ID del lookup

      const outgoingEdges = edges.filter((e) => e.source === node.id);
      const nodeRoutes = outgoingEdges
        .map((edge) => idLookup.get(edge.target))
        .filter(Boolean);

      routing_model[jsonScreenID] = [...new Set(nodeRoutes)];

      // ... (El resto de la lógica de serialización es idéntica) ...
      let screenChildren = [];
      let screenTerminal = false;

      if (node.type === "catalogNode") {
        const catalogFormChildren = [];
        if (node.data.introText) {
          catalogFormChildren.push({
            type: "TextBody",
            text: node.data.introText,
          });
        }
        (node.data.products || []).forEach((product) => {
          if (product.imageBase64) {
            catalogFormChildren.push({
              type: "Image",
              src: product.imageBase64.split(",")[1],
              height: 150,
              "scale-type": "cover",
            });
          }
          let productText = "";
          if (product.title) productText += `**${product.title}**\n`;
          if (product.description) productText += `${product.description}\n`;
          if (product.price) productText += `Precio: ${product.price}`;
          if (productText) {
            catalogFormChildren.push({
              type: "TextBody",
              text: productText.trim(),
            });
          }
        });
        const radioDataSource = (node.data.radioOptions || []).map(
          (opt, index) => ({
            id: opt.id || `cat_opt_${index + 1}`,
            title: opt.title || `Opción ${index + 1}`,
          })
        );
        if (radioDataSource.length > 0) {
          catalogFormChildren.push({
            type: "RadioButtonsGroup",
            label: node.data.radioLabel || "Selecciona:",
            name: "catalog_selection",
            "data-source": radioDataSource,
            required: true,
          });
        }
        catalogFormChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          "on-click-action": {
            name: "data_exchange",
            payload: { catalog_selection: `\${form.catalog_selection}` },
          },
        });
        screenChildren.push({
          type: "Form",
          name: `${jsonScreenID.toLowerCase()}_catalog_form`,
          children: catalogFormChildren,
        });
        screenTerminal = !(radioDataSource.length > 0 && nodeRoutes.length > 0);
      } else if (node.type === "formNode") {
        const formPayload = {};
        const formChildren = [];

        if (node.data.introText) {
          formChildren.push({
            type: "TextBody",
            text: node.data.introText,
          });
        }

        (node.data.components || []).forEach((component) => {
          if (component.type === "TextInput" && component.name) {
            formPayload[component.name] = `\${form.${component.name}}`;
            let inputType = "text";
            if (
              component.name.includes("phone") ||
              component.name.includes("celular")
            )
              inputType = "phone";
            if (
              component.name.includes("email") ||
              component.name.includes("correo")
            )
              inputType = "email";
            formChildren.push({
              type: "TextInput",
              label: component.label,
              name: component.name,
              "input-type": inputType,
              required:
                component.required === undefined ? true : component.required,
            });
          }
        });
        formChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          "on-click-action": { name: "data_exchange", payload: formPayload },
        });
        screenChildren.push({
          type: "Form",
          name: `${jsonScreenID.toLowerCase()}_form`,
          children: formChildren,
        });
        screenTerminal = nodeRoutes.length === 0;
      } else if (node.type === "confirmationNode") {
        routing_model[jsonScreenID] = [];
        screenTerminal = true;
        screenChildren.push({
          type: "Form",
          name: `${jsonScreenID.toLowerCase()}_form`,
          children: [
            {
              type: "TextHeading",
              text: node.data.headingText || "✅ ¡Todo listo!",
            },
            { type: "TextBody", text: "${data.details}" },
            {
              type: "TextBody",
              text:
                node.data.bodyText ||
                "Oprime el boton y un agente se comunicará contigo para finalizar el proceso.",
            },
            {
              type: "Footer",
              label: node.data.footer_label || "Finalizar",
              "on-click-action": { name: "complete" },
            },
          ],
        });
      } else {
        // screenNode
        const formPayload = {};
        const formChildren = [];
        (node.data.components || []).forEach((component, compIndex) => {
          let jsonComponent = null;
          switch (component.type) {
            case "TextBody":
              jsonComponent = { type: "TextBody", text: component.text || "" };
              break;
            case "Image":
              jsonComponent = {
                type: "Image",
                src: component.src ? component.src.split(",")[1] : null,
                height: 250,
                "scale-type": "cover",
              };
              if (!jsonComponent.src) jsonComponent = null;
              break;
            case "TextInput":
              if (component.name) {
                formPayload[component.name] = `\${form.${component.name}}`;
              }
              jsonComponent = {
                type: "TextInput",
                name: component.name || `input_${compIndex}`,
                label: component.label || "",
                required: true,
              };
              break;
            case "RadioButtonsGroup": { // <-- (Línea 514)
              formPayload["selection"] = `\${form.selection}`;

              // --- INICIO DE LA CORRECCIÓN ---
              
              // 1. Obtener las conexiones (flechas) que salen de este nodo
              const optionEdges = outgoingEdges.filter(edge => 
                edge.sourceHandle && edge.sourceHandle.startsWith(`${node.id}-option-`)
              );

              // 2. Mapear las opciones del componente (las que tienen 'title')
              const dataSource = (component.options || []).map((option, optIndex) => {
                
                // 3. Buscar la conexión (flecha) correspondiente a esta opción
                // (Asumimos que el 'targetHandle' se guardó en onConnect)
                // OJO: Si 'targetHandle' no está, necesitamos otra estrategia.
                //
                // ¡Vamos a hacerlo más simple!
                // El `routing_model` ya nos dice los destinos: ["DATOS", "SERVICIOS"]
                // Asumimos que el orden es el mismo.
                
                // El ID de la pantalla de destino (ej: "DATOS")
                const targetScreenId = nodeRoutes[optIndex]; // <-- Obtenemos el ID desde las rutas
                
                return {
                  id: targetScreenId || `ERROR_ID_${optIndex + 1}`, // Usamos el ID de la ruta
                  title: option.title,
                };
              });
              // --- FIN DE LA CORRECCIÓN ---

              jsonComponent = {
                type: "RadioButtonsGroup",
                label: "Selecciona una opción:",
                name: "selection",
                "data-source": dataSource,
                required: true,
              };
              break;
            }
          }
          if (jsonComponent) {
            formChildren.push(jsonComponent);
          }
        });
        formChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          "on-click-action": { name: "data_exchange", payload: formPayload },
        });
        screenChildren.push({
          type: "Form",
          name: `${jsonScreenID.toLowerCase()}_form`,
          children: formChildren,
        });
        screenTerminal = nodeRoutes.length === 0;
      }

      const finalDataBlock =
        node.type === "confirmationNode"
          ? {
              details: {
                type: "string",
                __example__:
                  "Name: John Doe\nEmail: john@example.com\nPhone: 123456789\n\nA free skin care consultation, please",
              },
            }
          : undefined;

      return {
        id: jsonScreenID,
        title: node.data.title || "Pantalla sin Título",
        terminal: screenTerminal,
        data: finalDataBlock,
        layout: {
          type: "SingleColumnLayout",
          children: screenChildren,
        },
      };
    });

    const finalJson = {
      version: "7.2",
      data_api_version: "3.0",
      routing_model,
      screens,
    };

    return finalJson;
  };

  // --- Lógica para Guardar ---
  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Guardando flujo...");

    try {
      const newFlowJson = generateFlowJson();
      setFlowJson(newFlowJson); // Actualizar vista previa

      if (!flowId) {
        toast.error("No se ha podido identificar el ID del flujo.");
        setIsSaving(false);
        return;
      }

      const jsonString = JSON.stringify(newFlowJson);
      await updateFlowJson(flowId, jsonString);
      toast.success("¡Flujo guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar el flujo:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
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
export default function FlowBuilderProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}
