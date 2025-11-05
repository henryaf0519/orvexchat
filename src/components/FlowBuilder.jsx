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

  // 2. Crear Ejes (Con la lógica de handles que implementamos)
  const initialEdges = [];
  for (const [sourceId, targets] of Object.entries(routing_model)) {
    const sourceNode = initialNodes.find((n) => n.id === sourceId);
    if (!sourceNode || !screenMap.has(sourceId)) continue;

    let connectionsHandled = false;

    if (sourceNode.type === "screenNode") {
      const radioCompIndex = sourceNode.data.components.findIndex(
        (c) => c.type === "RadioButtonsGroup"
      );

      if (radioCompIndex !== -1) {
        const radioComponent = sourceNode.data.components[radioCompIndex];

        targets.forEach((targetId) => {
          if (!screenMap.has(targetId)) return;
          const optionIndex = (radioComponent.options || []).findIndex(
            (opt) => opt.id === targetId
          );

          if (optionIndex !== -1) {
            const handleId = `${sourceId}-component-${radioCompIndex}-option-${optionIndex}`;
            initialEdges.push({
              id: `edge_${sourceId}_${handleId}_${targetId}`,
              source: sourceId,
              target: targetId,
              sourceHandle: handleId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: "smoothstep",
            });
          } else {
            initialEdges.push({
              id: `edge_${sourceId}_${targetId}`,
              source: sourceId,
              target: targetId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: "smoothstep",
            });
          }
        });
        connectionsHandled = true;
      }
    }

    if (sourceNode.type === "catalogNode") {
      const catalogOptions = sourceNode.data.radioOptions || [];

      if (catalogOptions.length > 0) {
        targets.forEach((targetId) => {
          if (!screenMap.has(targetId)) return;
          const optionIndex = catalogOptions.findIndex(
            (opt) => opt.id === targetId
          );

          if (optionIndex !== -1) {
            const handleId = `${sourceId}-catalog-option-${optionIndex}`;
            initialEdges.push({
              id: `edge_${sourceId}_${handleId}_${targetId}`,
              source: sourceId,
              target: targetId,
              sourceHandle: handleId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: "smoothstep",
            });
          } else {
            initialEdges.push({
              id: `edge_${sourceId}_${targetId}`,
              source: sourceId,
              target: targetId,
              markerEnd: { type: MarkerType.ArrowClosed },
              type: "smoothstep",
            });
          }
        });
        connectionsHandled = true;
      }
    }

    if (!connectionsHandled) {
      targets.forEach((targetId) => {
        if (screenMap.has(targetId)) {
          initialEdges.push({
            id: `edge_${sourceId}_${targetId}`,
            source: sourceId,
            target: targetId,
            markerEnd: { type: MarkerType.ArrowClosed },
            type: "smoothstep",
          });
        }
      });
    }
  }

  return { initialNodes, initialEdges };
};

const FlowBuilder = ({ flowData, flowId }) => {
  console.log("FlowBuilder renderizado con flowId:", flowId, "y flowData:",  flowData);
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
            options: [],
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
        flowData.flow_json
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

  const generateFlowJson = () => {
    const routing_model = {};

    const idLookup = new Map();
    nodes.forEach((n, index) => {
      const jsonScreenID = n.id.startsWith("node_")
        ? formatTitleToID(n.data.title, index)
        : n.id;
      idLookup.set(n.id, jsonScreenID);
    });

    const screens = nodes.map((node, index) => {
      const jsonScreenID = idLookup.get(node.id);
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      const nodeRoutes = outgoingEdges
        .map((edge) => idLookup.get(edge.target))
        .filter(Boolean);

      routing_model[jsonScreenID] = [...new Set(nodeRoutes)];

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
            id: opt.id || `cat_opt_${index + 1}`, // Usamos el ID de la opción (que es el ID de destino)
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
            case "RadioButtonsGroup": {
              formPayload["selection"] = `\${form.selection}`;

              
              const optionEdges = outgoingEdges.filter(edge => 
                edge.sourceHandle && edge.sourceHandle.startsWith(`${node.id}-option-`)
              );

              
              const dataSource = (component.options || []).map((option, optIndex) => {
                
               
                const targetScreenId = nodeRoutes[optIndex]; 
                
                return {
                  id: targetScreenId || `ERROR_ID_${optIndex + 1}`, 
                  title: option.title,
                };
              });
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

  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Guardando flujo...");

    try {
      const newFlowJson = generateFlowJson();
      setFlowJson(newFlowJson);
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
