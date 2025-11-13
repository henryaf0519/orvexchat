// src/utils/flowTransformers.js
import { MarkerType } from "reactflow";

// --- Funciones Auxiliares ---

export const formatTitleToID = (title, index) => {
  if (!title || title.trim() === "") {
    return `PANTALLA_SIN_TITULO_${index + 1}`;
  }
  return title
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};

export const determineNodeType = (screen) => {
  const form = screen.layout.children.find((c) => c.type === "Form");
  if (!form || !form.children) return "screenNode";

  const hasDropdown = form.children.some((c) => c.type === "Dropdown");
  if (hasDropdown) return "appointmentNode";

  const hasDynamicDetails = form.children.some(
    (c) => c.type === "TextBody" && c.text === "${data.details}"
  );
  if (hasDynamicDetails) return "confirmationNode";

  const hasCatalogSelection = form.children.some(
    (c) => c.type === "RadioButtonsGroup" && c.name === "catalog_selection"
  );
  if (hasCatalogSelection) return "catalogNode";

  const hasTextInput = form.children.some((c) => c.type === "TextInput");
  if (hasTextInput) return "formNode";

  return "screenNode";
};

export const reconstructNodeData = (screen, nodeType) => {
  const form = screen.layout.children.find((c) => c.type === "Form");
  if (!form) return { title: screen.title || "" };

  const footer = form.children.find((c) => c.type === "Footer");
  const baseData = {
    title: screen.title || "",
    footer_label: footer?.label || "Continuar",
  };

  try {
    switch (nodeType) {
      case "appointmentNode":
        const dropdown = form.children.find((c) => c.type === "Dropdown");
        const introText = form.children.find((c) => c.type === "TextBody")?.text;
        return {
          ...baseData,
          config: {
            labelDate: dropdown?.label || "Selecciona la fecha",
            introText: introText || "",
          },
        };

      case "confirmationNode":
        return {
          ...baseData,
          headingText: form.children.find((c) => c.type === "TextHeading")?.text || "",
          bodyText: form.children.find((c) => c.type === "TextBody" && c.text !== "${data.details}")?.text || "",
          footer_label: footer?.label || "Finalizar",
        };

      case "catalogNode":
        return {
          ...baseData,
          introText: form.children.find((c) => c.type === "TextBody")?.text || "",
          products: [],
          radioLabel: form.children.find((c) => c.type === "RadioButtonsGroup")?.label || "",
          radioOptions: form.children.find((c) => c.type === "RadioButtonsGroup")?.["data-source"].map((opt) => ({
            id: opt.id,
            title: opt.title,
          })) || [],
        };

      case "formNode":
        return {
          ...baseData,
          introText: form.children.find((c) => c.type === "TextBody")?.text || "",
          components: form.children.filter((c) => c.type === "TextInput").map((c, i) => ({
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
          components: form.children.filter((c) => c.type !== "Footer").map((c, i) => {
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
                options: c["data-source"].map((opt) => ({
                  id: opt.id,
                  title: opt.title,
                })) || [],
              };
            }
            return null;
          }).filter(Boolean),
        };
    }
  } catch (error) {
    console.error("Error reconstruyendo datos del nodo:", error, screen);
    return { ...baseData, title: screen.title || "ERROR AL CARGAR" };
  }
};

// --- PARSER (JSON -> ReactFlow) ---

export const parseJsonToElements = (flowJson, navMap) => {
  if (!flowJson || !flowJson.screens || !flowJson.routing_model) {
    console.warn("JSON de flujo inválido o vacío. Empezando tablero limpio.");
    return { initialNodes: [], initialEdges: [] };
  }

  const { screens, routing_model } = flowJson;
  const screenMap = new Map(screens.map((s) => [s.id, s]));
  const screenConfig = navMap ? navMap.__SCREEN_CONFIG__?.SCREENS : {};

  const initialNodes = screens.map((screen, index) => {
    let nodeType;
    if (screenConfig && screenConfig[screen.id] && screenConfig[screen.id].type) {
      nodeType = screenConfig[screen.id].type;
    } else {
      nodeType = determineNodeType(screen);
    }

    let nodeData = reconstructNodeData(screen, nodeType);

    if (screenConfig && screenConfig[screen.id] && screenConfig[screen.id].config) {
      nodeData.config = {
        ...nodeData.config,
        ...screenConfig[screen.id].config,
      };
    }

    return {
      id: screen.id,
      type: nodeType,
      position: { x: 250 + index * 400, y: 100 },
      data: {
        ...nodeData,
        // Estas funciones vacías se reemplazarán en el componente con injectNodeFunctions
        updateNodeData: () => {},
        openPreviewModal: () => {},
        deleteNode: () => {},
      },
    };
  });

  const initialEdges = [];

  if (navMap && typeof navMap === "object") {
    for (const [optionId, navData] of Object.entries(navMap)) {
      if (optionId === "__SCREEN_CONFIG__") continue;

      const targetScreenId = navData.pantalla;
      if (!targetScreenId || !screenMap.has(targetScreenId)) continue;

      let sourceNodeId = null;
      let sourceHandleId = null;

      for (const node of initialNodes) {
        if (node.type === "screenNode" && node.data.components) {
          node.data.components.forEach((comp, compIndex) => {
            if (comp.type === "RadioButtonsGroup" && comp.options) {
              const optIndex = comp.options.findIndex((opt) => opt.id === optionId);
              if (optIndex !== -1) {
                sourceNodeId = node.id;
                sourceHandleId = `${node.id}-component-${compIndex}-option-${optIndex}`;
              }
            }
          });
        } else if (node.type === "catalogNode" && node.data.radioOptions) {
          const optIndex = node.data.radioOptions.findIndex((opt) => opt.id === optionId);
          if (optIndex !== -1) {
            sourceNodeId = node.id;
            sourceHandleId = `${node.id}-catalog-option-${optIndex}`;
          }
        }
        if (sourceNodeId) break;
      }

      if (sourceNodeId && sourceHandleId) {
        initialEdges.push({
          id: `edge_${sourceHandleId}_${targetScreenId}`,
          source: sourceNodeId,
          target: targetScreenId,
          sourceHandle: sourceHandleId,
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",
        });
      }
    }
  }

  for (const [sourceScreenId, targetScreenIds] of Object.entries(routing_model)) {
    const sourceNode = initialNodes.find((n) => n.id === sourceScreenId);
    if (!sourceNode || sourceNode.type === "screenNode" || sourceNode.type === "catalogNode") continue;

    if (sourceNode.type === "formNode" || sourceNode.type === "appointmentNode") {
      const targetId = targetScreenIds[0];
      if (targetId && screenMap.has(targetId)) {
        initialEdges.push({
          id: `edge_${sourceScreenId}_footer_${targetId}`,
          source: sourceScreenId,
          target: targetId,
          sourceHandle: `${sourceScreenId}-source`,
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",
        });
      }
    }
  }

  return { initialNodes, initialEdges };
};

// --- GENERADOR (ReactFlow -> JSON) ---

export const generateMetaFlowJson = (nodes, edges) => {
  const metaFlow = {
    version: "7.2",
    data_api_version: "3.0",
    routing_model: {},
    screens: [],
  };

  const navigationMap = {};
  const screenConfigMap = {
    __SCREEN_CONFIG__: { SCREENS: {} },
  };

  const idLookup = new Map();
  nodes.forEach((n, index) => {
    const jsonScreenID = formatTitleToID(n.data.title, index);
    idLookup.set(n.id, jsonScreenID);
  });

  const screens = nodes.map((node, index) => {
      const jsonScreenID = idLookup.get(node.id);
      const outgoingEdges = edges.filter((e) => e.source === node.id);

      screenConfigMap.__SCREEN_CONFIG__.SCREENS[jsonScreenID] = {
        type: node.type,
        dataSourceTrigger: null,
      };

      let screenChildren = [];
      let screenTerminal = false;
      const allDestinations = new Set();
      const dynamicName = jsonScreenID.toLowerCase();

      if (node.type === "screenNode") {
        const formPayload = {};
        const formChildren = [];

        (node.data.components || []).forEach((component, compIndex) => {
          if (component.type === "RadioButtonsGroup") {
            formPayload[dynamicName] = `\${form.${dynamicName}}`;
            const dataSource = (component.options || []).map((option, optIndex) => {
              const handleId = `${node.id}-component-${compIndex}-option-${optIndex}`;
              const connectedEdge = outgoingEdges.find((e) => e.sourceHandle === handleId);
              if (connectedEdge) {
                const targetScreenId = idLookup.get(connectedEdge.target);
                if (targetScreenId) {
                  navigationMap[option.id] = { pantalla: targetScreenId, valor: option.title || "" };
                  allDestinations.add(targetScreenId);
                }
              }
              return { id: option.id, title: option.title };
            });
            formChildren.push({
              type: "RadioButtonsGroup",
              label: component.label || "Selecciona una opción:",
              name: dynamicName,
              "data-source": dataSource,
              required: true,
            });
          } else if (component.type === "TextBody") {
            formChildren.push({ type: "TextBody", text: component.text });
          } else if (component.type === "Image") {
            if (component.src) {
              const base64Content = component.src.split(",")[1];
              formChildren.push({ type: "Image", src: base64Content });
            }
          } else if (component.type === "TextInput") {
             // Opcional: Manejar inputs simples si los añades a screenNode
          }
        });

        formChildren.push({
          type: "Footer",
          label: node.data.footer_label || "Continuar",
          "on-click-action": { name: "data_exchange", payload: formPayload },
        });
        screenChildren.push({ type: "Form", name: `${dynamicName}_form`, children: formChildren });

      } else if (node.type === "catalogNode") {
          // Lógica de Catálogo
          screenChildren.push({ type: "TextBody", text: node.data.introText || "" });
          // ... Lógica simplificada para catálogo (similar a screenNode para opciones)
          const dataSource = (node.data.radioOptions || []).map((opt, optIndex) => {
              const handleId = `${node.id}-catalog-option-${optIndex}`;
              const connectedEdge = outgoingEdges.find((e) => e.sourceHandle === handleId);
              if (connectedEdge) {
                  const targetScreenId = idLookup.get(connectedEdge.target);
                  if (targetScreenId) {
                      navigationMap[opt.id] = { pantalla: targetScreenId, valor: opt.title || "" };
                      allDestinations.add(targetScreenId);
                  }
              }
              return { id: opt.id, title: opt.title };
          });
          screenChildren.push({
              type: "RadioButtonsGroup",
              label: node.data.radioLabel || "Selecciona:",
              name: "catalog_selection",
              "data-source": dataSource,
              required: true
          });
          screenChildren.push({
              type: "Footer",
              label: node.data.footer_label || "Seleccionar",
              "on-click-action": { name: "data_exchange", payload: { selected: "${form.catalog_selection}" } }
          });
          screenChildren = [{ type: "Form", name: `${dynamicName}_catalog_form`, children: screenChildren }];

      } else if (node.type === "appointmentNode") {
        screenConfigMap.__SCREEN_CONFIG__.SCREENS[jsonScreenID] = {
          type: node.type,
          dataSourceTrigger: "fetch_available_dates",
          config: node.data.config || {},
        };

        const footerEdge = outgoingEdges.find((e) => e.sourceHandle === `${node.id}-source`);
        const nextScreenId = footerEdge ? idLookup.get(footerEdge.target) : jsonScreenID;
        if (footerEdge) allDestinations.add(idLookup.get(footerEdge.target));

        screenChildren.push({
          type: "Form",
          name: "appointment_form",
          children: [
            { type: "TextBody", text: node.data.config?.introText || "Selecciona una fecha." },
            {
              type: "Dropdown",
              label: node.data.config?.labelDate || "Date",
              name: "date",
              "data-source": "${data.date}",
              required: true,
              "on-select-action": {
                name: "data_exchange",
                payload: { trigger: "date_selected", date: "${form.date}" },
              },
            },
            {
              type: "Footer",
              label: node.data.footer_label || "Continue",
              "on-click-action": {
                name: "navigate",
                next: { type: "screen", name: nextScreenId },
                payload: { date: "${form.date}" },
              },
            },
          ],
        });
        
        // Retornamos estructura especial para appointment con el bloque 'data'
        metaFlow.routing_model[jsonScreenID] = Array.from(allDestinations);
        return {
            id: jsonScreenID,
            title: node.data.title || "Appointment",
            terminal: screenTerminal,
            data: {
                date: { type: "array", items: { type: "object", properties: { id: { type: "string" }, title: { type: "string" } } }, __example__: [] },
                is_date_enabled: { type: "boolean", __example__: true }
            },
            layout: { type: "SingleColumnLayout", children: screenChildren }
        };

      } else if (node.type === "formNode") {
        const formChildren = [];
        if(node.data.introText) formChildren.push({ type: "TextBody", text: node.data.introText });
        
        (node.data.components || []).forEach((comp) => {
             formChildren.push({ type: "TextInput", label: comp.label, name: comp.name, required: comp.required, "input-type": "text" });
        });

        const footerEdge = outgoingEdges.find((e) => e.sourceHandle === `${node.id}-source`);
        const nextScreenId = footerEdge ? idLookup.get(footerEdge.target) : null;
        if (nextScreenId) allDestinations.add(nextScreenId);

        // Los Forms suelen usar 'navigate' si no intercambian datos, o data_exchange si validan
        // Simplificaremos usando navigate si hay destino
        const action = nextScreenId 
            ? { name: "navigate", next: { type: "screen", name: nextScreenId }, payload: formChildren.reduce((acc, curr) => ({...acc, [curr.name]: `\${form.${curr.name}}`}), {}) }
            : { name: "data_exchange", payload: {} };

        formChildren.push({
            type: "Footer",
            label: node.data.footer_label || "Enviar",
            "on-click-action": action
        });
        screenChildren.push({ type: "Form", name: `${dynamicName}_form`, children: formChildren });

      } else if (node.type === "confirmationNode") {
        screenTerminal = true;
        screenChildren.push({ type: "TextHeading", text: node.data.headingText || "" });
        screenChildren.push({ type: "TextBody", text: "${data.details}" }); // Dato fijo
        screenChildren.push({ type: "TextBody", text: node.data.bodyText || "" });
        screenChildren.push({
            type: "Footer",
            label: node.data.footer_label || "Finalizar",
            "on-click-action": { name: "complete", payload: {} }
        });
        screenChildren = [{ type: "Form", name: "confirmation_form", children: screenChildren }];
      }

      metaFlow.routing_model[jsonScreenID] = Array.from(allDestinations);
      if (node.type === "confirmationNode") metaFlow.routing_model[jsonScreenID] = [];

      return {
        id: jsonScreenID,
        title: node.data.title || "Screen",
        terminal: screenTerminal,
        layout: { type: "SingleColumnLayout", children: screenChildren },
      };
    }).filter(Boolean);

  metaFlow.screens = screens;

  const finalNavigationMap = {
    ...navigationMap,
    ...screenConfigMap,
  };

  return { metaFlowJson: metaFlow, navigationMapJson: finalNavigationMap };
};