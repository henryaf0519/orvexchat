// src/components/FlowBuilder.jsx

// 1. Imports actualizados
import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useChatStore } from "../store/chatStore";
// Iconos para la pestaña
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { updateFlowJson, sendTestFlow } from "../services/flowService";
import PreviewModal from "./PreviewModal";
import FlowScreenNode from "./FlowScreenNode";
import FlowCatalogNode from "./FlowCatalogNode";
import FlowFormNode from "./FlowFormNode";
import FlowConfirmationNode from "./FlowConfirmationNode";
import InputModal from "./InputModal";
import FlowInstructionsModal from "./FlowInstructionsModal";
import FlowAppointmentNode from "./FlowAppointmentNode"; // <-- IMPORTADO

const nodeTypes = {
  screenNode: FlowScreenNode,
  catalogNode: FlowCatalogNode,
  formNode: FlowFormNode,
  confirmationNode: FlowConfirmationNode,
  appointmentNode: FlowAppointmentNode // <-- REGISTRADO
};

// --- (La lógica de formatTitleToID no cambia) ---

const formatTitleToID = (title, index) => {
  if (!title || title.trim() === "") {
    return `PANTALLA_SIN_TITULO_${index + 1}`;
  }
  return title
    .trim()
    .toUpperCase() // MAYUSCULAS
    .replace(/\s+/g, "_"); // espacios -> _
};

// --- 'determineNodeType' ACTUALIZADO ---
const determineNodeType = (screen) => {
  const form = screen.layout.children.find((c) => c.type === "Form");
  if (!form || !form.children) return "screenNode"; // Default

  // REGLA 1 (NUEVA): Detectar AppointmentNode
  const hasDropdown = form.children.some((c) => c.type === "Dropdown");
  if (hasDropdown) return "appointmentNode";

  // REGLA 2: ConfirmationNode
  const hasDynamicDetails = form.children.some(
    (c) => c.type === "TextBody" && c.text === "${data.details}"
  );
  if (hasDynamicDetails) return "confirmationNode";

  // REGLA 3: CatalogNode
  const hasCatalogSelection = form.children.some(
    (c) => c.type === "RadioButtonsGroup" && c.name === "catalog_selection"
  );
  if (hasCatalogSelection) return "catalogNode";

  // REGLA 4: FormNode
  const hasTextInput = form.children.some((c) => c.type === "TextInput");
  if (hasTextInput) return "formNode";

  // REGLA 5: Default
  return "screenNode";
};

// --- 'reconstructNodeData' ACTUALIZADO ---
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
      // ✅ CASO AÑADIDO
      case "appointmentNode":
        const dropdown = form.children.find((c) => c.type === "Dropdown");
        return {
          ...baseData,
          // 'config' se cargará desde el navMap en parseJsonToElements
          config: {
            labelDate: dropdown?.label || "Selecciona la fecha",
          }
        };

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
        return {
          ...baseData,
          introText:
            form.children.find((c) => c.type === "TextBody")?.text || "",
          products: [],
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
            .filter((c) => c.type !== "Footer")
            .map((c, i) => {
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
            .filter(Boolean),
        };
    }
  } catch (error) {
    console.error("Error reconstruyendo datos del nodo:", error, screen);
    return { ...baseData, title: screen.title || "ERROR AL CARGAR" };
  }
};

const parseJsonToElements = (flowJson, navMap) => {
  if (!flowJson || !flowJson.screens || !flowJson.routing_model) {
    console.warn("JSON de flujo inválido o vacío. Empezando tablero limpio.");
    return { initialNodes: [], initialEdges: [] };
  }

  const { screens, routing_model } = flowJson;
  const screenMap = new Map(screens.map((s) => [s.id, s]));

  // ✅ 1. LEER EL MAPA DE CONFIGURACIÓN
  const screenConfig = navMap ? navMap.__SCREEN_CONFIG__?.SCREENS : {};
  console.log("Usando Screen Config:", screenConfig);

  // 1. Crear Nodos
  const initialNodes = screens.map((screen, index) => {
    
    // ✅ 2. LÓGICA DE TIPO MEJORADA
    let nodeType;
    if (screenConfig && screenConfig[screen.id] && screenConfig[screen.id].type) {
        // Usar el tipo guardado en el navigationMap (preferido)
        nodeType = screenConfig[screen.id].type;
        console.log(`Tipo para '${screen.id}' cargado desde navMap: ${nodeType}`);
    } else {
        // Fallback a la detección de contenido (para flujos antiguos sin __SCREEN_CONFIG__)
        nodeType = determineNodeType(screen);
        console.warn(`Tipo para '${screen.id}' no encontrado en navMap. Detectando por contenido: ${nodeType}`);
    }
    // ✅ FIN DE LA LÓGICA MEJORADA

    let nodeData = reconstructNodeData(screen, nodeType); // 'nodeType' ahora es correcto

    // Fusionar la configuración (para appointmentNode)
    if (screenConfig && screenConfig[screen.id] && screenConfig[screen.id].config) {
      nodeData.config = { 
        ...nodeData.config, 
        ...screenConfig[screen.id].config 
      };
      console.log(`Configuración cargada para ${screen.id}:`, nodeData.config);
    }

    return {
      id: screen.id,
      type: nodeType, // Usar el tipo correcto
      position: { x: 250 + index * 400, y: 100 },
      data: {
        ...nodeData,
        updateNodeData: () => {},
        openPreviewModal: () => {},
        deleteNode: () => {},
      },
    };
  });

  // 2. Crear Ejes (Edges)
  const initialEdges = [];

  // --- Parte 1: Procesar Opciones desde el navMap plano ---
  if (navMap && typeof navMap === "object") {
    console.log("Generando conexiones de OPCIONES desde navMap plano:", navMap);

    for (const [optionId, navData] of Object.entries(navMap)) {
      
      // ✅ 3. ASEGURARSE DE SALTAR LA CLAVE DE CONFIGURACIÓN
      if (optionId === '__SCREEN_CONFIG__') continue; 
      
      const targetScreenId = navData.pantalla; 

      if (!targetScreenId || !screenMap.has(targetScreenId)) {
        console.warn(
          `(navMap) Destino '${targetScreenId}' no encontrado para la opción '${optionId}'`
        );
        continue;
      }

      // ... (El resto de la lógica de búsqueda de handle no cambia) ...
      let sourceNodeId = null;
      let sourceHandleId = null;
      for (const node of initialNodes) {
        // Buscar en screenNode
        if (node.type === "screenNode" && node.data.components) {
          node.data.components.forEach((comp, compIndex) => {
            if (comp.type === "RadioButtonsGroup" && comp.options) {
              const optIndex = comp.options.findIndex(
                (opt) => opt.id === optionId
              );
              if (optIndex !== -1) {
                sourceNodeId = node.id;
                sourceHandleId = `${node.id}-component-${compIndex}-option-${optIndex}`;
              }
            }
          });
        }
        // Buscar en catalogNode
        else if (node.type === "catalogNode" && node.data.radioOptions) {
          const optIndex = node.data.radioOptions.findIndex(
            (opt) => opt.id === optionId
          );
          if (optIndex !== -1) {
            sourceNodeId = node.id;
            sourceHandleId = `${node.id}-catalog-option-${optIndex}`;
          }
        }
        if (sourceNodeId) break; 
      }
      
      if (sourceNodeId && sourceHandleId) {
        // ... (código para crear el edge)
        initialEdges.push({
          id: `edge_${sourceHandleId}_${targetScreenId}`,
          source: sourceNodeId,
          target: targetScreenId,
          sourceHandle: sourceHandleId, 
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",
        });
      } else {
        // ... (warning)
      }
    }
  } else {
    // ... (warning)
  }

  // --- Parte 2: Procesar Footers (formNode, appointmentNode) ---
  console.log(
    "Generando conexiones de FOOTER desde routing_model:",
    routing_model
  );

  for (const [sourceScreenId, targetScreenIds] of Object.entries(
    routing_model
  )) {
    const sourceNode = initialNodes.find((n) => n.id === sourceScreenId);

    // Omitir nodos que ya maneja el navMap (screen/catalog)
    if (
      !sourceNode ||
      sourceNode.type === "screenNode" ||
      sourceNode.type === "catalogNode"
    ) {
      continue;
    }

    // Nodos con 1 sola salida de Footer (formNode, appointmentNode)
    // ✅ 4. ASEGURARSE DE INCLUIR 'appointmentNode' AQUÍ
    if (sourceNode.type === "formNode" || sourceNode.type === "appointmentNode") {
      const targetId = targetScreenIds[0]; 

      if (targetId && screenMap.has(targetId)) {
        console.log(
          `(routing_model) Creando Edge de Footer: Nodo '${sourceScreenId}' -> Target '${targetId}'`
        );
        initialEdges.push({
          id: `edge_${sourceScreenId}_footer_${targetId}`,
          source: sourceScreenId,
          target: targetId,
          sourceHandle: `${sourceScreenId}-source`, // Handle genérico del footer
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",
        });
      }
    }
    // (ConfirmationNode no tiene salidas)
  }

  console.log("Edges finales creados:", initialEdges);
  return { initialNodes, initialEdges };
};


const FlowBuilder = ({ flowData, flowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [flowName, setFlowName] = useState(flowData?.name || "Mi Flujo");
  const [isSaving, setIsSaving] = useState(false);
  const [flowJson, setFlowJson] = useState(flowData?.flow_json || {});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewNodeData, setPreviewNodeData] = useState(null);

  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const userData = useChatStore((state) => state.userData);
  const defaultPhoneNumber =
    userData && userData.PK ? userData.PK.replace("USER#", "") : "573001234567";
    

  // --- (Lógica de onConnect, updateNodeData, deleteNode, etc. NO cambia) ---
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      if (
        params.sourceHandle &&
        params.sourceHandle.startsWith(`${params.source}-option`)
      ) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source) {
              const newComponents = node.data.components.map((comp) => {
                if (comp.type === "RadioButtonsGroup") {
                  const updatedOptions = comp.options.map((opt) => {
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
          })
        );
      } else if (params.sourceHandle === `${params.source}-add-option-source`) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source) {
              const newData = { ...node.data };
              const newComponents = newData.components.map((comp) => {
                if (comp.type === "RadioButtonsGroup") {
                  const newOptionId = params.target;
                  const newOption = {
                    id: newOptionId,
                    title: `Ir a ${params.target}`,
                  };
                  return {
                    ...comp,
                    options: [...(comp.options || []), newOption],
                  };
                }
                return comp;
              });
              return {
                ...node,
                data: {
                  ...newData,
                  components: newComponents,
                },
              };
            }
            return node;
          })
        );
      }
    },
    [setEdges, setNodes]
  );

  const  removeEdge = useCallback((sourceNodeId, sourceHandleId) => {
    setEdges((eds) => eds.filter((edge) => 
        !(edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId)
    ));
    toast.success('Conexión eliminada');
  }, [setEdges]);




  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  };

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

  const openPreviewModal = (nodeData) => {
    setPreviewNodeData(nodeData);
    setIsPreviewModalOpen(true);
  };
  const closePreviewModal = () => setIsPreviewModalOpen(false);

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

  // --- 'injectNodeFunctions' (NO cambia) ---
  const injectNodeFunctions = (node) => ({
    ...node,
    data: {
      ...node.data,
      updateNodeData: updateNodeData,
      openPreviewModal: openPreviewModal,
      deleteNode: deleteNode,
      removeEdge: removeEdge, 
    },
  });

  // --- FUNCIONES 'add...' ---
  
  // ✅ NUEVA FUNCIÓN
  const addAppointmentNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: "appointmentNode",
      position: getNewNodePosition(),
      data: {
        title: "Agendar Cita",
        footer_label: "Continuar",
        config: { // Configuración por defecto
          labelDate: "Selecciona la fecha",
          daysAvailable: [1, 2, 3, 4, 5],
          intervalMinutes: 60,
          daysToShow: 30,
        },
      },
    };
    setNodes((nds) => nds.concat(injectNodeFunctions(newNode)));
  };

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

  // --- 'useEffect' (Carga de datos) ACTUALIZADO ---
  useEffect(() => {
    if (
      flowData &&
      flowData.flow_json &&
      Object.keys(flowData.flow_json).length > 0
    ) {
      console.log("Cargando flujo existente desde JSON...");

      // ✅ 'navigation' ahora es el JSON Híbrido
      const { initialNodes, initialEdges } = parseJsonToElements(
        flowData.flow_json, 
        flowData.navigation 
      );
      const nodesWithFunctions = initialNodes.map(injectNodeFunctions);
      setNodes(nodesWithFunctions);
      setEdges(initialEdges);
      setFlowJson(flowData.flow_json);
      if (flowData.name) {
        setFlowName(flowData.name);
      }
    } else if (flowData) {
      // ... (código existente)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowData]);


  // --- 'generateFlows' ACTUALIZADO ---
  const generateFlows = () => {
    console.log("--- [INICIO] generateFlows (V2 Híbrido) ---");

    const metaFlow = {
      version: "7.2",
      data_api_version: "3.0",
      routing_model: {},
      screens: [],
    };
    
    // 1. Mapa plano para navegación (como lo lee tu backend)
    const navigationMap = {};
    // 2. Mapa de configuración de pantallas (la nueva parte)
    const screenConfigMap = {
      __SCREEN_CONFIG__: {
        SCREENS: {}
      }
    };

    const idLookup = new Map();
    nodes.forEach((n, index) => {
      const jsonScreenID = formatTitleToID(n.data.title, index);
      idLookup.set(n.id, jsonScreenID);
    });

    console.log("Nodos (nodes):", nodes);
    console.log("Conexiones (edges):", edges);
    console.log("Mapa de IDs (idLookup):", idLookup);

    const screens = nodes.map((node, index) => {
      const jsonScreenID = idLookup.get(node.id);
      const outgoingEdges = edges.filter((e) => e.source === node.id);

      console.log(
        `\n[Procesando Pantalla]: ${jsonScreenID} (Tipo: ${node.type})`
      );
      
      // Poblar el screenConfigMap
      screenConfigMap.__SCREEN_CONFIG__.SCREENS[jsonScreenID] = {
          type: node.type,
          dataSourceTrigger: null // Default
      };

      let screenChildren = [];
      let screenTerminal = false;
      const allDestinations = new Set();
      const dynamicName = jsonScreenID.toLowerCase();

      if (node.type === "screenNode") {
        console.log(` -> [screenNode] Procesando componentes...`);
        const formPayload = {};
        const formChildren = [];

        (node.data.components || []).forEach((component, compIndex) => {
          if (component.type === "RadioButtonsGroup") {
            // ... (código existente de RadioButtonsGroup)
            formPayload[dynamicName] = `\${form.${dynamicName}}`;

            const dataSource = (component.options || []).map(
              (option, optIndex) => {
                const handleId = `${node.id}-component-${compIndex}-option-${optIndex}`;
                // ... (código existente para buscar connectedEdge)
                const connectedEdge = outgoingEdges.find(
                  (e) => e.sourceHandle === handleId
                );
                if (connectedEdge) {
                  const targetScreenId = idLookup.get(connectedEdge.target);
                  if (targetScreenId) {
                    // ✅ ESTO SE MANTIENE: Poblar el mapa plano
                    navigationMap[option.id] = {
                      pantalla: targetScreenId,
                      valor: option.title || "",
                    };
                    allDestinations.add(targetScreenId);
                  } 
                  // ... (else/warn)
                } 
                // ... (else)
                return { id: option.id, title: option.title };
              }
            );
            // ... (código existente para añadir RadioButtonsGroup a formChildren)
            formChildren.push({
              type: "RadioButtonsGroup",
              label: component.label || "Selecciona una opción:",
              name: dynamicName,
              "data-source": dataSource,
              required: true,
            });
          } 
          // ... (resto de 'else if' para TextBody, Image, TextInput)
          else if (component.type === "TextBody") { /* ... */ }
          else if (component.type === "Image") { /* ... */ }
          else if (component.type === "TextInput") { /* ... */ }
        });
        
        // ... (código existente para footerEdge)

        formChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          "on-click-action": { name: "data_exchange", payload: formPayload },
        });
        screenChildren.push({
          type: "Form",
          name: `${dynamicName}_form`,
          children: formChildren,
        });

      } else if (node.type === "catalogNode") {
        console.log(` -> [catalogNode] Procesando...`);
        // ... (código existente para catalogNode,
        //      incluyendo su lógica de 'navigationMap[opt.id] = ...')
        
      // ✅ CASO AÑADIDO
      } else if (node.type === "appointmentNode") {
        console.log(` -> [appointmentNode] Procesando...`);
        
        // 1. Poblar el screenConfigMap
        screenConfigMap.__SCREEN_CONFIG__.SCREENS[jsonScreenID] = {
            type: node.type,
            dataSourceTrigger: "fetch_available_dates", // Disparador
            config: node.data.config || {} // La config de la UI
        };
        
        // 2. Construir el JSON de Meta
        const footerEdge = outgoingEdges.find((e) => e.sourceHandle === `${node.id}-source`);
        // Usar un fallback por si no se conecta, aunque debería estarlo
        const nextScreenId = footerEdge ? idLookup.get(footerEdge.target) : jsonScreenID; 
        if(footerEdge) allDestinations.add(idLookup.get(footerEdge.target));

        screenChildren.push({
            type: "Form",
            name: "appointment_form",
            children: [
                {
                    type: "Dropdown",
                    label: node.data.config?.labelDate || "Date", // Usar el label del nodo
                    name: "date",
                    "data-source": "${data.date}",
                    required: true, // Asumimos true
                    enabled: true,  // Asumimos true
                    "on-select-action": {
                        "name": "data_exchange",
                        "payload": {
                            "trigger": "date_selected",
                            "date": "${form.date}"
                        }
                    }
                },
                {
                    type: "Footer",
                    label: node.data.footer_label || "Continue",
                    "on-click-action": {
                        "name": "navigate", // Ojo: Este nodo usa 'navigate' no 'data_exchange' en el footer
                        "next": {
                            "type": "screen",
                            "name": nextScreenId 
                        },
                        "payload": {
                            "date": "${form.date}"
                        }
                    }
                }
            ]
        });
        
        // El 'data' block para el JSON de Meta
        metaFlow.screens.push({
          id: jsonScreenID,
          title: node.data.title || "Appointment",
          terminal: screenTerminal,
          // ✅ AÑADIDO: El bloque 'data' que Meta espera
          data: {
            "date": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": { "type": "string" },
                        "title": { "type": "string" }
                    }
                },
                "__example__": [
                    { "id": "2024-01-01", "title": "Mon Jan 01 2024" }
                ]
            },
            "is_date_enabled": {
                "type": "boolean",
                "__example__": true
            }
          },
          layout: {
            type: "SingleColumnLayout",
            children: screenChildren,
          },
        });
        
        // Continuar al siguiente 'map' (saltar el 'return' de abajo)
        metaFlow.routing_model[jsonScreenID] = Array.from(allDestinations);
        console.log(
          ` -> [FIN Pantalla ${jsonScreenID}] Routing Model (Meta):`,
          Array.from(allDestinations)
        );
        return null; // Devolver null para filtrar este resultado del 'map' de 'screens'

      } else if (node.type === "formNode") {
        console.log(` -> [formNode] Procesando...`);
        // ... (código existente de formNode)
      } else if (node.type === "confirmationNode") {
        console.log(` -> [confirmationNode] Procesando. (Terminal)`);
        // ... (código existente de confirmationNode)
      }

      // --- ASIGNACIÓN FINAL DE RUTAS ---
      metaFlow.routing_model[jsonScreenID] = Array.from(allDestinations);
      screenTerminal = allDestinations.size === 0;
      if (node.type === "confirmationNode") {
        screenTerminal = true;
        metaFlow.routing_model[jsonScreenID] = [];
      }
      console.log(
        ` -> [FIN Pantalla ${jsonScreenID}] Routing Model (Meta):`,
        Array.from(allDestinations)
      );
      // --- FIN DE LA LÓGICA DE NODOS ---

      const finalDataBlock =
        node.type === "confirmationNode"
          ? { /* ... (código existente) ... */ }
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
    }).filter(Boolean); // <-- Filtrar los 'null' (del appointmentNode)

    metaFlow.screens = screens.concat(metaFlow.screens); // Añadir las pantallas procesadas

    // ✅ CAMBIO FINAL: Fusionar ambos mapas
    const finalNavigationMap = {
        ...navigationMap,           // El mapa plano
        ...screenConfigMap          // El mapa de configuración
    };

    console.log("\n--- [FINAL] generateFlows ---");
    console.log(
      "JSON Final para Meta (metaFlowJson):",
      JSON.stringify(metaFlow, null, 2)
    );
    console.log(
      "JSON Final para Backend (navigationMapJson Híbrido):",
      JSON.stringify(finalNavigationMap, null, 2)
    );

    return {
      metaFlowJson: metaFlow,
      navigationMapJson: finalNavigationMap, // ✅ Devuelve el NUEVO mapa híbrido
    };
  };

  // --- 'handleSave' ACTUALIZADO ---
  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Guardando flujo...");

    try {
      // 1. Genera ambos JSONs
      const { metaFlowJson, navigationMapJson } = generateFlows();

      setFlowJson(metaFlowJson); 

      if (!flowId) {
        // ... (error)
      }

      // 2. Convierte ambos a string
      const jsonString = JSON.stringify(metaFlowJson);
      // ✅ USA EL NUEVO MAPA HÍBRIDO
      const navMapString = JSON.stringify(navigationMapJson); 

      // 3. Envía AMBOS al servicio
      await updateFlowJson(flowId, jsonString, navMapString);

      toast.success("¡Flujo guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar el flujo:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- (handleSendTest y resto de handlers NO cambian) ---
  const handleSendTest = async () => { /* ... (código existente) ... */ };
  const handleInstructionsConfirm = () => { /* ... (código existente) ... */ };
  const handleConfirmSendTest = async (to) => { /* ... (código existente) ... */ };


  // --- 3. Variables dinámicas para el estilo del panel ---
  const panelWidth = isPanelOpen ? "250px" : "0px";
  const panelPadding = isPanelOpen ? "10px" : "0px";
  const panelOpacity = isPanelOpen ? 1 : 0;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
      }}
    >
      {/* --- Panel Izquierdo (Controles) --- */}
   <div
        style={{
          width: panelWidth,
          padding: panelPadding,
          opacity: panelOpacity, // <-- Opacidad en el panel padre
          background: "#f8fafc",
          borderRight: isPanelOpen ? "1px solid #ddd" : "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden", // <-- Clave para ocultar
          transition: "all 0.3s ease-in-out", // <-- Transición simple
          flexShrink: 0,
        }}
      >
        <div>
          <input
            disabled={true}
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
          
          {/* --- BOTONES CON ESTILOS COMPLETOS RESTAURADOS --- */}
          
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
            + Añadir Menú
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
            + Añadir Catálogo
          </button>
          
          <button
            onClick={addFormNode}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "5px",
              width: "100%",
              cursor: "pointer",
            }}
          >
            + Añadir Formulario
          </button>

          {/* --- BOTÓN NUEVO (AÑADIDO CORRECTAMENTE) --- */}
          <button
            onClick={addAppointmentNode}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#9F7AEA", // Color Púrpura
              color: "white",
              border: "none",
              borderRadius: "5px",
              width: "100%",
              cursor: "pointer",
            }}
          >
            + Añadir Cita
          </button>

          <button
            onClick={addConfirmationNode}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#ef4444",
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

        <div style={{ marginTop: "20px" }}>
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
            {isSaving ? "Guardando..." : "Guardar Flujo"}
          </button>

          <button
            onClick={handleSendTest} // <-- 1. Conectado al handler que abre el modal
            disabled={isSaving || isSendingTest} // <-- 2. Deshabilitado mientras se guarda o envía
            style={{
              padding: "10px",
              width: "100%",
              backgroundColor:
                isSaving || isSendingTest ? "#9ca3af" : "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isSaving || isSendingTest ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {isSendingTest ? "Enviando..." : "Enviar Flujo Prueba"}
          </button>
        </div>
      </div>

      {/* --- Botón de Ocultar/Mostrar (NO cambia) --- */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        // ... (estilos existentes)
      >
        {isPanelOpen ? (
          <FaChevronLeft size={14} />
        ) : (
          <FaChevronRight size={14} />
        )}
      </button>

      {/* --- Área Central: Canvas (NO cambia) --- */}
      <div style={{ flex: 1, background: "#fcfcfc", position: "relative" }}>
        <ToastContainer
          // ... (props existentes)
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          // ... (props existentes)
        >
          <Controls />
          <Background color="#e2e8f0" gap={20} />
        </ReactFlow>
      </div>

      {/* --- Panel Derecho (JSON) (NO cambia) --- */}
      <div
        style={{
          // ... (estilos existentes)
          display: "none",
        }}
      >
        <h3>JSON del Flujo</h3>
        <pre
          // ... (estilos existentes)
        >
          {JSON.stringify(flowJson, null, 2)}
        </pre>
      </div>

      {/* --- Modales (NO cambian) --- */}
      {isPreviewModalOpen &&
        previewNodeData &&
        ReactDOM.createPortal(
          <PreviewModal
            nodeData={previewNodeData}
            onClose={closePreviewModal}
          />,
          document.getElementById("modal-root")
        )}
      {isTestModalOpen && (
        <InputModal
          // ... (props existentes)
        />
      )}
      {isInstructionsModalOpen && (
        <FlowInstructionsModal
          // ... (props existentes)
        />
      )}
    </div>
  );
};

// --- Proveedor de React Flow (Sin cambios) ---
export default function FlowBuilderProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}