// src/components/FlowAppointmentNode.jsx

import React, { useEffect, useMemo } from "react";
import { Handle, Position, useReactFlow, useNodes, useEdges } from "reactflow";
import {
  FaTrash, FaPen, FaTimes, FaCalendarAlt, FaEye, FaPlus, 
  FaCheckCircle, FaLink, FaToggleOn, FaToggleOff, FaUserTie,
  FaLock, FaGlobeAmericas, FaUser, FaExchangeAlt
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useChatStore } from "../../store/chatStore";
import { apiFetch } from "../../services/api";

// --- Estilos ---
const nodeClasses = "relative bg-white border border-purple-400 rounded-xl w-[350px] shadow-lg font-sans";
const headerClasses = "flex items-center justify-between bg-purple-50 border-b border-purple-300 py-2.5 px-4 rounded-t-xl font-semibold relative";
const bodyClasses = "p-4 space-y-4 max-h-[600px] overflow-y-auto";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-green-500 text-white border-2 border-green-600 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-green-400";
const textAreaClasses = "w-full border border-gray-300 rounded p-1.5 text-sm min-h-[100px] max-h-[500px] overflow-y-auto resize-none bg-white";
const clickableIconClasses = "clickable-icon p-1 text-gray-500 hover:text-black cursor-pointer";
const componentHeaderClasses = "text-sm font-semibold text-gray-700 mb-1 block";
const textInputClasses = "w-full border border-gray-300 rounded p-1.5 text-sm bg-white";
const smallInputClasses = "w-full border border-gray-300 rounded p-1 text-sm bg-white";

// ID CONSTANTE PARA CUANDO NO IMPORTA EL PROFESIONAL
const OPEN_ID_VALUE = "any_professional";

const daysOfWeek = [
  { label: "D", value: 0 }, { label: "L", value: 1 }, { label: "M", value: 2 },
  { label: "X", value: 3 }, { label: "J", value: 4 }, { label: "V", value: 5 }, { label: "S", value: 6 },
];

// Helper para generar slugs (Ej: "Henry Arévalo" -> "henry_arevalo")
const generateSafeId = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/__+/g, "_");
};

const transformDataForPreview = (nodeData) => {
  const { config, ...rest } = nodeData;
  return {
    ...rest,
    type: "formNode",
    introText: config?.introText || "",
    components: [
      {
        type: "Dropdown",
        label: config?.labelDate || "Selecciona la fecha",
      },
    ],
  };
};

export default function FlowAppointmentNode({ data, id }) {
  const edges = useEdges();
  const nodes = useNodes();
  
  const googleAuthStatus = useChatStore((state) => state.googleAuthStatus);
  const setGoogleAuthStatus = useChatStore((state) => state.setGoogleAuthStatus);

  const config = {
    daysAvailable: [1, 2, 3, 4, 5],
    intervalMinutes: 60,
    daysToShow: 30,
    labelDate: "Selecciona la fecha",
    introText: "",
    startTime: "08:00",
    endTime: "17:00",
    breakTimes: [],
    appointmentDescription: "Cita agendada",
    tool: "none",
    useResourceMapping: false, 
    resourceMapping: {}, // Estructura: { "opcion_id": { nombre: "Titulo", id: "slug" } }
    ...data.config,
  };

  // 1. Detectar nodo padre (Menú)
  const connectedSourceNode = useMemo(() => {
    const connection = edges.find(edge => edge.target === id);
    if (!connection) return null;
    return nodes.find(n => n.id === connection.source);
  }, [edges, nodes, id]); 

  // 2. Filtrar opciones relevantes conectadas a este nodo
  const relevantOptions = useMemo(() => {
    if (!connectedSourceNode || !connectedSourceNode.data.components) return [];
    
    // IDs de los handles que entran a este nodo
    const incomingHandleIds = edges
      .filter(edge => edge.target === id && edge.source === connectedSourceNode.id)
      .map(edge => edge.sourceHandle);

    const validOptions = [];
    connectedSourceNode.data.components.forEach((comp, compIndex) => {
      if (comp.type === 'RadioButtonsGroup' && comp.options) {
        comp.options.forEach((opt, optIndex) => {
          // Reconstruir ID del handle del padre
          const handleId = `${connectedSourceNode.id}-component-${compIndex}-option-${optIndex}`;
          if (incomingHandleIds.includes(handleId)) {
            // Pasamos la opción completa (importante: opt.id es el ID del botón ej: opcion_123)
            validOptions.push(opt);
          }
        });
      }
    });
    return validOptions;
  }, [connectedSourceNode, edges, id]);


  // 3. Sincronización Inteligente (useEffect)
  useEffect(() => {
    if (!config.useResourceMapping || relevantOptions.length === 0) return;

    const newMapping = { ...config.resourceMapping };
    let hasChanges = false;
    const currentOptionIds = relevantOptions.map(o => o.id);

    relevantOptions.forEach(opt => {
        // Usamos el ID del botón como llave (O(1) lookup)
        const existingData = newMapping[opt.id];

        // Caso 1: Nueva opción conectada
        if (!existingData) {
             const safeId = generateSafeId(opt.title);
             newMapping[opt.id] = {
                 nombre: opt.title,
                 id: safeId // Slug por defecto
             };
             hasChanges = true;
        } 
        // Caso 2: El título cambió en el menú anterior
        else if (existingData.nombre !== opt.title) {
             // Solo regeneramos el slug si NO es 'any_professional'
             // Si era 'any_professional', mantenemos la configuración del usuario
             const newSlug = existingData.id === OPEN_ID_VALUE ? OPEN_ID_VALUE : generateSafeId(opt.title);
             
             newMapping[opt.id] = {
                 ...existingData,
                 nombre: opt.title,
                 id: newSlug
             };
             hasChanges = true;
        }
    });

    // Caso 3: Limpieza (opciones desconectadas)
    Object.keys(newMapping).forEach(key => {
        if (!currentOptionIds.includes(key)) {
            delete newMapping[key];
            hasChanges = true;
        }
    });

    if (hasChanges) {
        data.updateNodeData(id, {
            ...data,
            config: { ...config, resourceMapping: newMapping },
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantOptions, config.useResourceMapping]); 


  // 4. Toggle: Específico <-> Cualquiera
  const toggleOptionType = (optId, optTitle) => {
      const currentMapping = { ...config.resourceMapping };
      const currentData = currentMapping[optId];

      if (!currentData) return;

      if (currentData.id === OPEN_ID_VALUE) {
          // Cambiar a ESPECÍFICO (usar slug del nombre)
          currentMapping[optId] = {
              nombre: optTitle,
              id: generateSafeId(optTitle)
          };
      } else {
          // Cambiar a CUALQUIERA
          currentMapping[optId] = {
              nombre: "Cualquiera", 
              id: OPEN_ID_VALUE
          };
      }

      data.updateNodeData(id, {
        ...data,
        config: { ...config, resourceMapping: currentMapping },
    });
  };


  // --- Funciones Standard (Change, Google Auth, etc.) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    data.updateNodeData(id, { ...data, [name]: value });
  };

  const updateConfig = (key, value) => {
    const numericValue = ["intervalMinutes", "daysToShow"].includes(key)
      ? parseInt(value, 10)
      : value;

    data.updateNodeData(id, {
      ...data,
      config: { ...config, [key]: numericValue },
    });
  };

  const toggleResourceMapping = () => {
      updateConfig("useResourceMapping", !config.useResourceMapping);
  };

  const handleGoogleConnect = async (e) => {
    e.preventDefault();
    toast.info("Generando URL de conexión con Google...");
    try {
      const response = await apiFetch("/auth/google/url", { method: "GET" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "No se pudo obtener la URL de Google.");
      }
      const { authUrl } = await response.json();
      const popup = window.open(authUrl, "google-auth", "width=600,height=700");
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setGoogleAuthStatus("connected");
          data.updateNodeData(id, {
            ...data,
            config: { ...config, tool: "google_calendar" },
          });
          toast.success("¡Google Calendar conectado!");
        }
      }, 1000);
    } catch (error) {
      console.error("Error al conectar con Google:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    const isConnected = googleAuthStatus === "connected";
    const toolIsSet = config.tool === "google_calendar";
    if (isConnected && !toolIsSet) {
      data.updateNodeData(id, {
        ...data,
        config: { ...config, tool: "google_calendar" },
      });
    }
  }, [googleAuthStatus, config.tool, data, id]);

  const isGoogleConnected = googleAuthStatus === "connected";
  const isToolSelected = config.tool === "google_calendar";

  const toggleDay = (dayValue) => {
    const currentDays = config.daysAvailable || [];
    let newDays;
    if (currentDays.includes(dayValue)) {
      newDays = currentDays.filter((d) => d !== dayValue);
    } else {
      newDays = [...currentDays, dayValue].sort();
    }
    updateConfig("daysAvailable", newDays);
  };
  const addBreakTime = () => {
    const newBreak = { id: Date.now(), start: "12:00", end: "13:00" };
    const newBreaks = [...(config.breakTimes || []), newBreak];
    updateConfig("breakTimes", newBreaks);
  };
  const updateBreakTime = (index, field, value) => {
    const newBreaks = [...config.breakTimes];
    if (newBreaks[index]) {
      newBreaks[index] = { ...newBreaks[index], [field]: value };
      updateConfig("breakTimes", newBreaks);
    }
  };
  const removeBreakTime = (index) => {
    const newBreaks = config.breakTimes.filter((_, i) => i !== index);
    updateConfig("breakTimes", newBreaks);
  };


  return (
    <div className={nodeClasses}>
      <Handle
        type="target"
        position={Position.Left}
        className="custom-handle"
        style={{ left: "-32px" }}
        id={`${id}-target`}
      />
      
      <div className={headerClasses}>
        <div className="editable-container flex-1 relative flex items-center">
            <FaCalendarAlt className="mr-2 text-purple-600" />
            <input
              name="title"
              value={data.title || ""}
              onChange={handleChange}
              placeholder="Título de Cita..."
              className="editable-field flex-grow bg-transparent focus:outline-none font-semibold text-gray-800"
            />
            <FaPen className="edit-icon" size={12} />
        </div>
        <button onClick={() => data.deleteNode(id)} className={clickableIconClasses}>
            <FaTimes size={14} />
        </button>
      </div>

      <div className={bodyClasses}>
        
        {/* GOOGLE CALENDAR */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <label className={componentHeaderClasses}>Herramienta de Calendario</label>
            {!isGoogleConnected && (
              <button onClick={handleGoogleConnect} className="w-full flex items-center justify-center gap-2 p-2 bg-white border border-gray-400 rounded-md hover:bg-gray-50 transition-colors">
                <img width="20" height="20" alt="Google Calendar logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"/>
                <span className="font-medium text-gray-800">Conectar con Google Calendar</span>
              </button>
            )}
            {(isGoogleConnected || isToolSelected) && (
              <div className="flex items-center gap-2 p-2 bg-green-100 border border-green-300 rounded-md">
                <FaCheckCircle className="text-green-600" />
                <span className="font-medium text-green-800">Google Calendar Vinculado</span>
              </div>
            )}
        </div>

        {/* SWITCH MODO PROFESIONAL */}
        <div className="flex items-center justify-between p-2 mb-2 bg-white border border-gray-200 rounded-lg">
             <div className="flex items-center gap-2">
                <FaUserTie className={config.useResourceMapping ? "text-purple-600" : "text-gray-400"} />
                <span className="text-xs font-semibold text-gray-700">Asignar por Profesional</span>
             </div>
             <button 
                onClick={toggleResourceMapping}
                className="text-2xl focus:outline-none transition-colors"
             >
                {config.useResourceMapping ? (
                    <FaToggleOn className="text-purple-600" />
                ) : (
                    <FaToggleOff className="text-gray-400" />
                )}
             </button>
        </div>

        {/* LISTADO DE PROFESIONALES (RENDERIZADO) */}
        {config.useResourceMapping ? (
            relevantOptions.length > 0 ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in-down">
                    <div className="flex items-center gap-2 mb-3 border-b border-blue-200 pb-2">
                      <FaLink className="text-blue-600" />
                      <span className="text-xs font-bold text-blue-800 uppercase">
                          Configurar Botones Conectados
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                    {relevantOptions.map((opt, idx) => {
                        // Accedemos directamente por ID del botón
                        const mappingData = config.resourceMapping?.[opt.id] || {};
                        const currentSlug = mappingData.id;
                        const isOpen = currentSlug === OPEN_ID_VALUE;

                        return (
                        <div key={idx} className="flex flex-col relative bg-white p-2 rounded-lg border shadow-sm border-gray-100">
                           <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-bold text-gray-800 ml-1 truncate max-w-[120px]" title={opt.title}>
                                   {opt.title}
                               </span>
                               
                               <button 
                                  onClick={() => toggleOptionType(opt.id, opt.title)}
                                  className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm border
                                    ${isOpen 
                                        ? 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200' 
                                        : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'}
                                  `}
                               >
                                  {isOpen ? <FaGlobeAmericas size={11}/> : <FaUser size={11}/>}
                                  {isOpen ? "Cualquiera" : "Específico"}
                                  <FaExchangeAlt className="ml-1 opacity-50" size={8}/>
                               </button>
                           </div>

                           <div className="relative">
                               <input 
                                   type="text"
                                   value={isOpen ? "Asignación Automática (Abierto)" : (currentSlug || '')}
                                   readOnly 
                                   className={`
                                     w-full border rounded p-2 pl-8 text-xs font-mono transition-colors
                                     ${isOpen 
                                        ? 'bg-teal-50 text-teal-700 border-teal-100 italic cursor-not-allowed' 
                                        : 'bg-gray-50 text-gray-600 border-gray-200 select-all'}
                                   `}
                               />
                               <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                                  {isOpen 
                                    ? <FaGlobeAmericas className="text-teal-400" size={12}/> 
                                    : <FaLock className="text-gray-400" size={10}/>
                                  }
                               </div>
                           </div>
                           <div className="text-[9px] text-gray-300 font-mono text-right mt-1">
                               Ref: {opt.id}
                           </div>
                        </div>
                    )})}
                    </div>
                </div>
            ) : (
                <div className="mb-4 p-2 border border-dashed border-red-300 rounded bg-red-50 text-xs text-red-600 text-center">
                     {connectedSourceNode 
                        ? "El nodo conectado no tiene botones ENLAZADOS a esta cita." 
                        : "Modo profesional activo. Conecta opciones específicas a este nodo."}
                </div>
            )
        ) : (
            <div className="mb-4 p-2 border border-gray-200 rounded bg-gray-50 text-xs text-gray-500 text-center">
                Modo Agenda General: Todas las citas se crearán en el calendario principal.
            </div>
        )}

        {/* RESTO DE INPUTS (Texto, Días, Horarios) */}
        <div>
            <label className={componentHeaderClasses}>Texto Introductorio</label>
            <textarea
              name="introText"
              value={config.introText || ""}
              onChange={(e) => updateConfig("introText", e.target.value)}
              className={textAreaClasses}
              rows={2}
            />
        </div>
        <div>
            <label className={componentHeaderClasses}>Descripción de la Cita</label>
            <textarea
              name="appointmentDescription"
              value={config.appointmentDescription || ""}
              onChange={(e) => updateConfig("appointmentDescription", e.target.value)}
              placeholder="Ej: Cita de demostración"
              className={textAreaClasses}
              rows={2}
            />
        </div>
        <div>
            <label className={componentHeaderClasses}>Etiqueta del Selector</label>
            <input
              name="labelDate"
              value={config.labelDate}
              onChange={(e) => updateConfig("labelDate", e.target.value)}
              className={textInputClasses}
            />
        </div>

        <div>
            <label className={componentHeaderClasses}>Días Disponibles</label>
            <div className="flex justify-between gap-1 p-2 bg-gray-100 rounded-lg">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`font-bold w-9 h-9 rounded-full text-sm transition-colors ${
                    config.daysAvailable.includes(day.value)
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={componentHeaderClasses}>Intervalo (min)</label>
              <input type="number" step="15" value={config.intervalMinutes} onChange={(e) => updateConfig("intervalMinutes", e.target.value)} className={textInputClasses}/>
            </div>
            <div>
              <label className={componentHeaderClasses}>Rango (días)</label>
              <input type="number" step="1" value={config.daysToShow} onChange={(e) => updateConfig("daysToShow", e.target.value)} className={textInputClasses}/>
            </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className={componentHeaderClasses}>Horario General</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Inicio</label>
                <input type="time" value={config.startTime} onChange={(e) => updateConfig("startTime", e.target.value)} className={smallInputClasses}/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Fin</label>
                <input type="time" value={config.endTime} onChange={(e) => updateConfig("endTime", e.target.value)} className={smallInputClasses}/>
              </div>
            </div>
        </div>

        <div>
            <label className={componentHeaderClasses}>Tiempos Muertos</label>
            <div className="space-y-2">
              {(config.breakTimes || []).map((breakTime, index) => (
                <div key={breakTime.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500">Inicio</label>
                    <input type="time" value={breakTime.start} onChange={(e) => updateBreakTime(index, "start", e.target.value)} className={smallInputClasses}/>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500">Fin</label>
                    <input type="time" value={breakTime.end} onChange={(e) => updateBreakTime(index, "end", e.target.value)} className={smallInputClasses}/>
                  </div>
                  <button onClick={() => removeBreakTime(index)} className="text-red-500 hover:text-red-700 self-end p-2">
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addBreakTime} className="text-xs text-blue-600 mt-2 cursor-pointer flex items-center gap-1 hover:text-blue-800">
              <FaPlus size={10} /> Añadir tiempo muerto
            </button>
        </div>

      </div>

      <div className={footerClasses}>
         <div className="editable-container relative">
            <input
              name="footer_label"
              value={data.footer_label || "Continuar"}
              onChange={handleChange}
              className={footerInputClasses}
            />
            <FaPen className="edit-icon" size={12} style={{ color: "white", opacity: 0.7, right: "15px" }} />
          </div>
          <button
            onClick={() => data.openPreviewModal(transformDataForPreview(data))}
            className="w-full bg-white text-blue-600 border border-blue-400 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <FaEye size={16} /> Vista Previa
          </button>
      </div>
      
      <Handle type="source" position={Position.Right} className="custom-handle" id={`${id}-source`} />
    </div>
  );
}