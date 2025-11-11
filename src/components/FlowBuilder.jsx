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

const nodeTypes = {
  screenNode: FlowScreenNode,
  catalogNode: FlowCatalogNode,
  formNode: FlowFormNode,
  confirmationNode: FlowConfirmationNode,
};

// --- (La lógica de formatTitleToID, determineNodeType, reconstructNodeData, y parseJsonToElements no cambia) ---

const formatTitleToID = (title, index) => {
  if (!title || title.trim() === "") {
    return `PANTALLA_SIN_TITULO_${index + 1}`;
  }
  return title
    .trim()
    .toUpperCase() // MAYUSCULAS
    .replace(/\s+/g, "_"); // espacios -> _
};

const determineNodeType = (screen) => {
  const form = screen.layout.children.find((c) => c.type === "Form");
  if (!form || !form.children) return "screenNode"; // Default

  // 1. Signature de ConfirmationNode: Buscar el TextBody con el dato dinámico único
  const hasDynamicDetails = form.children.some(
    (c) => c.type === "TextBody" && c.text === "${data.details}" // <-- FIX CLAVE
  );
  if (hasDynamicDetails) return "confirmationNode";

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

  // Imprime el navMap para depurar
  console.log(
    "parseJsonToElements está usando este navigationMap (plano):",
    navMap
  );

  const { screens, routing_model } = flowJson;
  const screenMap = new Map(screens.map((s) => [s.id, s]));

  // 1. Crear Nodos (Esto no cambia)
  const initialNodes = screens.map((screen, index) => {
    const nodeType = determineNodeType(screen);
    const nodeData = reconstructNodeData(screen, nodeType);

    return {
      id: screen.id,
      type: nodeType,
      position: { x: 250 + index * 400, y: 100 },
      data: {
        ...nodeData,
        updateNodeData: () => {},
        openPreviewModal: () => {},
        deleteNode: () => {},
      },
    };
  });

  // 2. Crear Ejes (Edges) - ✅ LÓGICA CORREGIDA PARA EL NAVMAP PLANO
  const initialEdges = [];

  // --- Parte 1: Procesar Opciones desde el navMap plano ---
  if (navMap && typeof navMap === "object") {
    console.log("Generando conexiones de OPCIONES desde navMap plano:", navMap);

    for (const [optionId, navData] of Object.entries(navMap)) {
      const targetScreenId = navData.pantalla; // ej: "UBICACION"

      if (!targetScreenId || !screenMap.has(targetScreenId)) {
        console.warn(
          `(navMap) Destino '${targetScreenId}' no encontrado para la opción '${optionId}'`
        );
        continue;
      }

      // Buscar el nodo y handle de origen para esta 'optionId'
      let sourceNodeId = null;
      let sourceHandleId = null;

      // Iterar sobre todos los nodos para encontrar el origen de esta opción
      for (const node of initialNodes) {
        // Buscar en screenNode (RadioButtonsGroup)
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
        if (sourceNodeId) break; // Dejar de buscar si ya lo encontramos
      }

      // Si se encontró, crear la 'edge' con handle
      if (sourceNodeId && sourceHandleId) {
        console.log(
          `(navMap) Creando Edge: Handle '${sourceHandleId}' -> Target '${targetScreenId}'`
        );
        initialEdges.push({
          id: `edge_${sourceHandleId}_${targetScreenId}`,
          source: sourceNodeId,
          target: targetScreenId,
          sourceHandle: sourceHandleId, // <-- El handle de la opción
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",
        });
      } else {
        console.warn(
          `(navMap) No se pudo encontrar el nodo/handle de origen para la opción '${optionId}'`
        );
      }
    }
  } else {
    console.warn(
      "navigationMap no está definido o no es un objeto. Saltando conexiones de opciones."
    );
  }

  // --- Parte 2: Procesar Footers desde el routing_model (de Meta) ---
  console.log(
    "Generando conexiones de FOOTER desde routing_model:",
    routing_model
  );

  for (const [sourceScreenId, targetScreenIds] of Object.entries(
    routing_model
  )) {
    const sourceNode = initialNodes.find((n) => n.id === sourceScreenId);

    // Si no se encuentra el nodo, o es un tipo que ya manejamos con navMap, saltarlo.
    if (
      !sourceNode ||
      sourceNode.type === "screenNode" ||
      sourceNode.type === "catalogNode"
    ) {
      continue;
    }

    // Si estamos aquí, es un nodo tipo 'formNode' (o 'confirmationNode' sin salidas)
    if (sourceNode.type === "formNode") {
      const targetId = targetScreenIds[0]; // formNode solo tiene una salida

      if (targetId && screenMap.has(targetId)) {
        console.log(
          `(routing_model) Creando Edge de Footer: Nodo '${sourceScreenId}' -> Target '${targetId}'`
        );
        initialEdges.push({
          id: `edge_${sourceScreenId}_footer_${targetId}`,
          source: sourceScreenId,
          target: targetId,
          sourceHandle: `${sourceScreenId}-source`, // Handle genérico del footer de formNode
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",
        });
      }
    }
    // (ConfirmationNode no tiene salidas, así que no se hace nada)
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
    

  // --- (Lógica de onConnect, updateNodeData, deleteNode, etc. sin cambios) ---
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

  const   removeEdge = useCallback((sourceNodeId, sourceHandleId) => {
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

  useEffect(() => {
    if (
      flowData &&
      flowData.flow_json &&
      Object.keys(flowData.flow_json).length > 0
    ) {
      console.log("Cargando flujo existente desde JSON...");

      const { initialNodes, initialEdges } = parseJsonToElements(
        flowData.flow_json, // El JSON de Meta
        flowData.navigation // El JSON de tu Backend (DEBE VENIR DEL BACKEND)
      );
      const nodesWithFunctions = initialNodes.map(injectNodeFunctions);
      setNodes(nodesWithFunctions);
      setEdges(initialEdges);
      setFlowJson(flowData.flow_json);
      if (flowData.name) {
        setFlowName(flowData.name);
      }
    } else if (flowData) {
      console.log("Iniciando nuevo flujo (tablero limpio).");
      setNodes([]);
      setEdges([]);
      setFlowJson({});
      if (flowData.name) {
        setFlowName(flowData.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowData]);

  const generateFlows = () => {
    console.log("--- [INICIO] generateFlows ---");

    const metaFlow = {
      version: "7.2",
      data_api_version: "3.0",
      routing_model: {},
      screens: [],
    };
    const navigationMap = {};

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
      console.log(
        ` -> Conexiones salientes (edges) encontradas:`,
        outgoingEdges
      );

      let screenChildren = [];
      let screenTerminal = false;

      const allDestinations = new Set();

      // ✅ CAMBIO 1: Definir el nombre dinámico para el payload
      // Usará el ID de la pantalla en minúsculas, ej: "menu"
      const dynamicName = jsonScreenID.toLowerCase();

      if (node.type === "screenNode") {
        console.log(` -> [screenNode] Procesando componentes...`);
        const formPayload = {};
        const formChildren = [];

        (node.data.components || []).forEach((component, compIndex) => {
          if (component.type === "RadioButtonsGroup") {
            console.log(
              `   -> [RadioButtonsGroup] Encontrado en índice ${compIndex}. Procesando ${
                component.options?.length || 0
              } opciones.`
            );

            // ✅ CAMBIO 2: Usar el nombre dinámico en el payload
            // Ej: formPayload["menu"] = "${form.menu}";
            formPayload[dynamicName] = `\${form.${dynamicName}}`;

            const dataSource = (component.options || []).map(
              (option, optIndex) => {
                const handleId = `${node.id}-component-${compIndex}-option-${optIndex}`;
                console.log(
                  `     -> Buscando conexión para Handle: ${handleId} (Opción ID: ${option.id})`
                );

                const connectedEdge = outgoingEdges.find(
                  (e) => e.sourceHandle === handleId
                );

                if (connectedEdge) {
                  const targetScreenId = idLookup.get(connectedEdge.target);
                  if (targetScreenId) {
                    console.log(
                      `       -> ¡CONEXIÓN ENCONTRADA! ID: ${option.id} -> Destino: ${targetScreenId}`
                    );
                    // Llenamos el navigationMap plano (esto ya estaba bien)
                    navigationMap[option.id] = {
                      pantalla: targetScreenId,
                      valor: option.title || "",
                    };
                    allDestinations.add(targetScreenId);
                  } else {
                    console.warn(
                      `       -> ADVERTENCIA: Conexión encontrada pero 'target' no está en idLookup. Target: ${connectedEdge.target}`
                    );
                  }
                } else {
                  console.log(`       -> (Sin conexión para esta opción)`);
                }
                return { id: option.id, title: option.title };
              }
            );

            formChildren.push({
              type: "RadioButtonsGroup",
              label: component.label || "Selecciona una opción:",

              // ✅ CAMBIO 3: Usar el nombre dinámico en el componente
              // Ej: name: "menu"
              name: dynamicName,

              "data-source": dataSource,
              required: true,
            });
          } else if (component.type === "TextBody") {
            formChildren.push({ type: "TextBody", text: component.text || "" });
          } else if (component.type === "Image") {
            const imgComp = {
              type: "Image",
              src: component.src ? component.src.split(",")[1] : null,
              height: 250,
              "scale-type": "cover",
            };
            if (imgComp.src) formChildren.push(imgComp);
          } else if (component.type === "TextInput") {
            if (component.name) {
              formPayload[component.name] = `\${form.${component.name}}`;
            }
            formChildren.push({
              type: "TextInput",
              name: component.name || `input_${compIndex}`,
              label: component.label || "",
              required: true,
            });
          }
        });

        const footerEdge = outgoingEdges.find(
          (edge) => edge.sourceHandle === `${node.id}-footer-source`
        );
        if (footerEdge) {
          const footerTargetId = idLookup.get(footerEdge.target);
          if (footerTargetId) {
            console.log(
              `   -> [Footer] Conexión encontrada. __DEFAULT__ -> ${footerTargetId}`
            );
            allDestinations.add(footerTargetId);
            // (El 'navigationMap' plano no soporta __DEFAULT__, lo cual está bien)
          }
        }

        formChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          // El 'formPayload' ya contiene la clave dinámica (ej: "menu")
          "on-click-action": { name: "data_exchange", payload: formPayload },
        });
        screenChildren.push({
          type: "Form",
          name: `${dynamicName}_form`, // Ej: "menu_form"
          children: formChildren,
        });
      } else if (node.type === "catalogNode") {
        console.log(` -> [catalogNode] Procesando...`);
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
          (opt, optIndex) => {
            const handleId = `${node.id}-catalog-option-${optIndex}`;
            console.log(
              `     -> Buscando conexión para Handle: ${handleId} (Opción ID: ${opt.id})`
            );

            const connectedEdge = outgoingEdges.find(
              (e) => e.sourceHandle === handleId
            );
            if (connectedEdge) {
              const targetScreenId = idLookup.get(connectedEdge.target);
              if (targetScreenId) {
                console.log(
                  `       -> ¡CONEXIÓN ENCONTRADA! ID: ${opt.id} -> Destino: ${targetScreenId}`
                );
                // Llenamos el navigationMap plano (esto ya estaba bien)
                navigationMap[opt.id] = {
                  pantalla: targetScreenId,
                  valor: opt.title || "",
                };
                allDestinations.add(targetScreenId);
              }
            } else {
              console.log(`       -> (Sin conexión para esta opción)`);
            }
            return {
              id: opt.id || `cat_opt_${optIndex + 1}`,
              title: opt.title || `Opción ${optIndex + 1}`,
            };
          }
        );

        if (radioDataSource.length > 0) {
          catalogFormChildren.push({
            type: "RadioButtonsGroup",
            label: node.data.radioLabel || "Selecciona:",
            // ✅ CAMBIO 3 (bis): Usar nombre dinámico en Catalog
            name: dynamicName, // Ej: "catalogo_productos"
            "data-source": radioDataSource,
            required: true,
          });
        }

        catalogFormChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          // ✅ CAMBIO 4: Usar nombre dinámico en el payload del Footer de Catalog
          "on-click-action": {
            name: "data_exchange",
            // Ej: "payload": { "catalogo_productos": "${form.catalogo_productos}" }
            payload: { [dynamicName]: `\${form.${dynamicName}}` },
          },
        });
        screenChildren.push({
          type: "Form",
          name: `${dynamicName}_catalog_form`,
          children: catalogFormChildren,
        });
      } else if (node.type === "formNode") {
        console.log(` -> [formNode] Procesando...`);
        const formPayload = {};
        const formChildren = [];
        if (node.data.introText) {
          formChildren.push({ type: "TextBody", text: node.data.introText });
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

        const footerEdge = outgoingEdges.find(
          (e) => e.sourceHandle === `${node.id}-source`
        );
        if (footerEdge) {
          const targetScreenId = idLookup.get(footerEdge.target);
          if (targetScreenId) {
            console.log(
              `   -> [Footer] Conexión encontrada. -> ${targetScreenId}`
            );
            allDestinations.add(targetScreenId);
          }
        }

        // El 'formPayload' aquí solo contiene los TextInputs, lo cual es correcto.
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
      } else if (node.type === "confirmationNode") {
        console.log(` -> [confirmationNode] Procesando. (Terminal)`);
        screenTerminal = true;
        metaFlow.routing_model[jsonScreenID] = [];
        screenChildren.push({
          type: "Form",
          name: `${dynamicName}_form`,
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
              "on-click-action": {
                name: "data_exchange", // <-- ACUERDO: Usar data_exchange
                payload: {
                  // CLAVE: El payload que activa tu lógica de guardado
                  flow_completed: "true",
                  screen: jsonScreenID,
                },
              },
            },
          ],
        });
      }

      // --- ASIGNACIÓN FINAL DE RUTAS ---

      metaFlow.routing_model[jsonScreenID] = Array.from(allDestinations);

      // (Esta asignación al 'navigationMap' plano ya no es anidada, está bien)

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
          ? {
              details: {
                type: "string",
                __example__: "Name: John Doe\nEmail: john@example.com...",
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

    metaFlow.screens = screens;

    console.log("\n--- [FINAL] generateFlows ---");
    console.log(
      "JSON Final para Meta (metaFlowJson):",
      JSON.stringify(metaFlow, null, 2)
    );
    console.log(
      "JSON Final para Backend (navigationMapJson):",
      JSON.stringify(navigationMap, null, 2)
    );

    return {
      metaFlowJson: metaFlow,
      navigationMapJson: navigationMap, // Este es el mapa plano
    };
  };

  // ✅ 'handleSave' AHORA ENVÍA AMBOS JSONS
  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Guardando flujo...");

    try {
      // 1. Genera ambos JSONs
      const { metaFlowJson, navigationMapJson } = generateFlows();

      setFlowJson(metaFlowJson); // Actualiza la vista previa del JSON en el UI (el de Meta)

      if (!flowId) {
        toast.error("No se ha podido identificar el ID del flujo.");
        setIsSaving(false);
        return;
      }

      // 2. Convierte ambos a string
      const jsonString = JSON.stringify(metaFlowJson);
      const navMapString = JSON.stringify(navigationMapJson);

      // 3. Envía AMBOS al servicio
      // (Asegúrate de que tu servicio 'updateFlowJson' acepte el tercer argumento)
      await updateFlowJson(flowId, jsonString, navMapString);

      toast.success("¡Flujo guardado con éxito!");
    } catch (error) {
      console.error("Error al guardar el flujo:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    await handleSave();
    let startScreenId;
    try {
      const currentFlowJson = generateFlowJson();
      startScreenId = Object.keys(currentFlowJson.routing_model)[0];
    } catch (e) {
      toast.error(
        "Error al leer el JSON del flujo. ¿Tiene pantalla de inicio?"
      );
      return;
    }
    console.log("Start Screen ID:", startScreenId);
    console.log("Flow ID:", flowId);

    if (!startScreenId || !flowId) {
      toast.error(
        "Faltan datos para enviar la prueba (pantalla de inicio no encontrados)."
      );
      return;
    }
    setIsInstructionsModalOpen(true);
  };

  const handleInstructionsConfirm = () => {
    setIsInstructionsModalOpen(false);
    setIsTestModalOpen(true);
  };

  const handleConfirmSendTest = async (to) => {
    if (!to || !/^\d+$/.test(to)) {
      toast.error(
        "Por favor, ingresa un número de teléfono válido (solo dígitos)."
      );
      return;
    }

    const internalFlowId = flowId;
    const flow_name = flowData?.name;
    const currentFlowJson = generateFlowJson();
    const startScreenId = Object.keys(currentFlowJson.routing_model)[0];

    console.log("Enviando prueba del flujo:", {
      internalFlowId,
      to,
      startScreenId,
      flow_name,
    });

    setIsSendingTest(true);
    toast.info(`Enviando prueba a ${to}...`);

    try {
      await sendTestFlow(internalFlowId, to, startScreenId, flow_name);

      toast.success("¡Prueba de flujo enviada con éxito!");
      setIsTestModalOpen(false);
    } catch (error) {
      console.error("Error al enviar prueba:", error);
      toast.error(`Error al enviar prueba: ${error.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // --- 3. Variables dinámicas para el estilo del panel ---
  const panelWidth = isPanelOpen ? "250px" : "0px";
  const panelPadding = isPanelOpen ? "10px" : "0px";
  const panelOpacity = isPanelOpen ? 1 : 0;
  // ---------------------------------------------------

  return (
    // --- 4. DIV principal ahora es relativo ---
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
      }}
    >
      {/* ================================================================
        Panel Izquierdo (Controles) 
        --- 5. Estilos actualizados para animar width, padding y opacity ---
        ================================================================
      */}
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
        {/* --- 6. CORRECCIÓN: Eliminados los estilos de los hijos ---
          Los hijos ya no necesitan 'opacity' o 'white-space'
        */}
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

      {/* ================================================================
        --- 7. NUEVA Pestaña/Botón para Ocultar/Mostrar ---
        ================================================================
      */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        title={isPanelOpen ? "Ocultar panel" : "Mostrar panel"}
        style={{
          position: "absolute",
          top: "50%",
          left: panelWidth, // Se adhiere al borde del panel
          transform: "translateY(-50%)",
          background: "#1e293b",
          color: "white",
          border: "none",
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
          padding: "10px 4px",
          cursor: "pointer",
          zIndex: 20,
          transition: "left 0.3s ease-in-out", // Anima su posición
        }}
      >
        {isPanelOpen ? (
          <FaChevronLeft size={14} />
        ) : (
          <FaChevronRight size={14} />
        )}
      </button>

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

      {/* Panel Derecho (JSON) - Sigue oculto */}
      <div
        style={{
          width: "400px",
          padding: "10px",
          borderLeft: "1px solid #ddd",
          background: "#f8fafc",
          display: "none",
        }}
      >
        <h3>JSON del Flujo</h3>
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

      {/* Renderizado del Modal (Sin cambios) */}
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
          title="Enviar Prueba de Flujo"
          message="Ingresa el número de teléfono de destino (con código de país, sin el +). Ejemplo: 573001234567"
          inputLabel="Número de Teléfono"
          inputPlaceholder={defaultPhoneNumber}
          confirmText={isSendingTest ? "Enviando..." : "Enviar"}
          isLoading={isSendingTest}
          onConfirm={handleConfirmSendTest} // <-- Llama a la nueva función
          onCancel={() => {
            if (!isSendingTest) {
              setIsTestModalOpen(false);
            }
          }}
        />
      )}
      {isInstructionsModalOpen && (
        <FlowInstructionsModal
          flowName={flowId}
          onClose={() => setIsInstructionsModalOpen(false)}
          onConfirm={handleInstructionsConfirm}
          test={true}
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
