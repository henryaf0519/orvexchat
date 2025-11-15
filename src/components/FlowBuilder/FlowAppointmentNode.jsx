// src/components/FlowBuilder/FlowAppointmentNode.jsx

import React, { useEffect } from "react"; // <-- 1. IMPORTAR useEffect
import { Handle, Position } from "reactflow";
import {
  FaTrash,
  FaPen,
  FaTimes,
  FaCalendarAlt,
  FaEye,
  FaPlus,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useChatStore } from "../../store/chatStore";
import { apiFetch } from "../../services/api";

// ... (Estilos: nodeClasses, headerClasses, etc. No cambian)
const nodeClasses =
  "relative bg-white border border-purple-400 rounded-xl w-[350px] shadow-lg font-sans";
const headerClasses =
  "flex items-center justify-between bg-purple-50 border-b border-purple-300 py-2.5 px-4 rounded-t-xl font-semibold relative";
const bodyClasses = "p-4 space-y-4 max-h-[600px] overflow-y-auto";
const footerClasses =
  "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses =
  "editable-field footer-input w-full bg-green-500 text-white border-2 border-green-600 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-green-400";
const textInputClasses =
  "w-full border border-gray-300 rounded p-1.5 text-sm bg-white";
const textAreaClasses =
  "w-full border border-gray-300 rounded p-1.5 text-sm min-h-[100px] max-h-[500px] overflow-y-auto resize-none bg-white";
const clickableIconClasses =
  "clickable-icon p-1 text-gray-500 hover:text-black cursor-pointer";
const componentHeaderClasses = "text-sm font-semibold text-gray-700 mb-1 block";
const smallInputClasses =
  "w-full border border-gray-300 rounded p-1 text-sm bg-white";
const daysOfWeek = [
  { label: "D", value: 0 },
  { label: "L", value: 1 },
  { label: "M", value: 2 },
  { label: "X", value: 3 },
  { label: "J", value: 4 },
  { label: "V", value: 5 },
  { label: "S", value: 6 },
];
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
// ... (Fin de estilos y helpers)

export default function FlowAppointmentNode({ data, id }) {
  const googleAuthStatus = useChatStore((state) => state.googleAuthStatus);
  const setGoogleAuthStatus = useChatStore(
    (state) => state.setGoogleAuthStatus
  );

  const config = {
    daysAvailable: [1, 2, 3, 4, 5],
    intervalMinutes: 60,
    daysToShow: 30,
    labelDate: "Selecciona la fecha",
    introText: "",
    startTime: "08:00",
    endTime: "17:00",
    breakTimes: [],
    tool: "none",
    ...data.config,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    data.updateNodeData(id, { ...data, [name]: value });
  };

  // updateConfig ahora depende de 'data' e 'id', necesitamos memoizarla
  // o ser cuidadosos en el useEffect. Por simpleza, la redefinimos pero
  // el useEffect se protegerá con la condición interna.
  const updateConfig = (key, value) => {
    const numericValue = ["intervalMinutes", "daysToShow"].includes(key)
      ? parseInt(value, 10)
      : value;
    data.updateNodeData(id, {
      ...data,
      config: {
        ...config,
        [key]: numericValue,
      },
    });
  }; // ... (toggleDay, addBreakTime, updateBreakTime, removeBreakTime no cambian)

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
  // ... (Fin de funciones de estado)

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
          // VAMOS A FORZAR LA ACTUALIZACIÓN DEL NODO AQUÍ
          data.updateNodeData(id, {
            ...data,
            config: {
              ...config,
              tool: "google_calendar",
            },
          });
          toast.success(
            "¡Google Calendar conectado y herramienta seleccionada!"
          );
        }
      }, 1000);
    } catch (error) {
      console.error("Error al conectar con Google:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // --- 2. LÓGICA DE SINCRONIZACIÓN AÑADIDA ---
  // Este efecto se asegura de que si el estado global es 'conectado',
  // el estado de este nodo también se marque como 'google_calendar'
  // sin necesidad de intervención del usuario.
  useEffect(() => {
    const isConnected = googleAuthStatus === "connected";
    const toolIsSet = config.tool === "google_calendar";

    if (isConnected && !toolIsSet) {
      // Usamos data.updateNodeData directamente para evitar
      // problemas de dependencias con `updateConfig`
      data.updateNodeData(id, {
        ...data,
        config: {
          ...config,
          tool: "google_calendar",
        },
      });
    }
  }, [googleAuthStatus, config.tool, data, id]); // Depende del estado global y local // --- Variables de estado para la UI ---

  const isGoogleConnected = googleAuthStatus === "connected";
  // Gracias al useEffect, 'isToolSelected' se sincronizará con 'isGoogleConnected'
  const isToolSelected = config.tool === "google_calendar";

  return (
    <>
      {" "}
      <style>{`
    .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
    .custom-handle:hover { transform: scale(1.15); background: #48bb78; border-color: #2f855a; }
    .editable-container:hover .edit-icon { display: inline-block; }
    .edit-icon { display: none; margin-left: 5px; color: #9ca3af; }
    .clickable-icon:hover { background-color: #f3f4f6; border-radius: 50%;}
   `}</style>{" "}
      <div className={nodeClasses}>
        {" "}
        <Handle
          type="target"
          position={Position.Left}
          className="custom-handle"
          style={{ left: "-32px" }}
          id={`${id}-target`}
        />{" "}
        <div className={headerClasses}>
          {/* ... (Cabecera no cambia) ... */}{" "}
          <div className="editable-container flex-1 relative flex items-center">
            <FaCalendarAlt className="mr-2 text-purple-600" />{" "}
            <input
              name="title"
              value={data.title || ""}
              onChange={handleChange}
              placeholder="Título de Cita..."
              className="editable-field flex-grow bg-transparent focus:outline-none font-semibold text-gray-800"
            />
            <FaPen className="edit-icon" size={12} />{" "}
          </div>{" "}
          <button
            onClick={() => data.deleteNode(id)}
            className={clickableIconClasses}
            title="Eliminar pantalla"
          >
            <FaTimes size={14} />{" "}
          </button>{" "}
        </div>
        {/* --- CUERPO --- */}{" "}
        <div className={bodyClasses}>
          {/* --- 3. LÓGICA DE UI SIMPLIFICADA --- */}{" "}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            {" "}
            <label className={componentHeaderClasses}>
              Herramienta de Calendario
            </label>{" "}
            {!isGoogleConnected && ( // CASO A: El usuario NO está conectado globalmente
              <button
                onClick={handleGoogleConnect}
                className="w-full flex items-center justify-center gap-2 p-2 bg-white border border-gray-400 rounded-md hover:bg-gray-50 transition-colors"
              >
                {" "}
                <img
                  width="20"
                  height="20"
                  alt="Google Calendar logo"
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                />{" "}
                <span className="font-medium text-gray-800">
                  Conectar con Google Calendar{" "}
                </span>{" "}
              </button>
            )}
            {/* CASO B: Conectado globalmente.
                  Gracias al useEffect, isToolSelected se volverá true.
                  Mostramos esto si CUALQUIERA de las dos es true,
                  lo que cubre el refresco de página (isGoogleConnected)
                  y la conexión inicial (isToolSelected) */}{" "}
            {(isGoogleConnected || isToolSelected) && (
              <div className="flex items-center justify-between gap-2 p-2 bg-green-100 border border-green-300 rounded-md">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <FaCheckCircle className="text-green-600" />{" "}
                  <span className="font-medium text-green-800">
                    Google Calendar Vinculado{" "}
                  </span>{" "}
                </div>
                {/* Botón de Desvincular eliminado según tu solicitud */}{" "}
              </div>
            )}
            {/* CASO C: Eliminado */}{" "}
          </div>
          {/* --- FIN DE SECCIÓN DE INTEGRACIÓN --- */}{" "}
          <div>
            {/* ... (Resto de los campos: Texto Intro, Días, Intervalo, etc. no cambian) ... */}
            <label className={componentHeaderClasses}>
              Texto Introductorio
            </label>
            <textarea
              name="introText"
              value={config.introText || ""}
              onChange={(e) => updateConfig("introText", e.target.value)}
              placeholder="Escribe una descripción..."
              className={textAreaClasses}
              rows={4}
            />{" "}
          </div>{" "}
          <div>
            <label className={componentHeaderClasses}>
              Etiqueta del Selector
            </label>
            <input
              name="labelDate"
              value={config.labelDate}
              onChange={(e) => updateConfig("labelDate", e.target.value)}
              placeholder="Ej: Selecciona la fecha"
              className={textInputClasses}
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className={componentHeaderClasses}>
              Días Disponibles
            </label>{" "}
            <div className="flex justify-between gap-1 p-2 bg-gray-100 rounded-lg">
              {" "}
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
                  {" "}
                  {day.label}{" "}
                </button>
              ))}{" "}
            </div>{" "}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div>
              {" "}
              <label className={componentHeaderClasses}>
                Intervalo (min)
              </label>{" "}
              <input
                type="number"
                step="15"
                value={config.intervalMinutes}
                onChange={(e) =>
                  updateConfig("intervalMinutes", e.target.value)
                }
                className={textInputClasses}
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className={componentHeaderClasses}>
                Rango (días)
              </label>{" "}
              <input
                type="number"
                step="1"
                value={config.daysToShow}
                onChange={(e) => updateConfig("daysToShow", e.target.value)}
                className={textInputClasses}
              />{" "}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            {" "}
            <label className={componentHeaderClasses}>
              Horario General
            </label>{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div>
                {" "}
                <label className="text-xs font-medium text-gray-500">
                  Hora Inicio
                </label>{" "}
                <input
                  type="time"
                  value={config.startTime}
                  onChange={(e) => updateConfig("startTime", e.target.value)}
                  className={smallInputClasses}
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-xs font-medium text-gray-500">
                  Hora Fin
                </label>{" "}
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => updateConfig("endTime", e.target.value)}
                  className={smallInputClasses}
                />{" "}
              </div>{" "}
            </div>
          </div>
          <div>
            {" "}
            <label className={componentHeaderClasses}>
              Tiempos Muertos (Ej. Almuerzo)
            </label>{" "}
            <div className="space-y-2">
              {" "}
              {(config.breakTimes || []).map((breakTime, index) => (
                <div
                  key={breakTime.id}
                  className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                >
                  {" "}
                  <div className="flex-1">
                    {" "}
                    <label className="text-xs font-medium text-gray-500">
                      Inicio
                    </label>{" "}
                    <input
                      type="time"
                      value={breakTime.start}
                      onChange={(e) =>
                        updateBreakTime(index, "start", e.target.value)
                      }
                      className={smallInputClasses}
                    />{" "}
                  </div>{" "}
                  <div className="flex-1">
                    {" "}
                    <label className="text-xs font-medium text-gray-500">
                      Fin
                    </label>{" "}
                    <input
                      type="time"
                      value={breakTime.end}
                      onChange={(e) =>
                        updateBreakTime(index, "end", e.target.value)
                      }
                      className={smallInputClasses}
                    />{" "}
                  </div>{" "}
                  <button
                    onClick={() => removeBreakTime(index)}
                    className="text-red-500 hover:text-red-700 self-end p-2"
                  >
                    {" "}
                    <FaTrash size={14} />{" "}
                  </button>{" "}
                </div>
              ))}{" "}
            </div>{" "}
            <button
              onClick={addBreakTime}
              className="text-xs text-blue-600 mt-2 cursor-pointer flex items-center gap-1 hover:text-blue-800"
            >
              {" "}
              <FaPlus size={10} /> Añadir tiempo muerto{" "}
            </button>
          </div>{" "}
        </div>{" "}
        <div className={footerClasses}>
          {/* ... (Footer no cambia) ... */}{" "}
          <div className="editable-container relative">
            {" "}
            <input
              name="footer_label"
              value={data.footer_label || "Continuar"}
              onChange={handleChange}
              placeholder="Texto del botón final..."
              className={footerInputClasses}
            />{" "}
            <FaPen
              className="edit-icon"
              size={12}
              style={{ color: "white", opacity: 0.7, right: "15px" }}
            />{" "}
          </div>{" "}
          <button
            onClick={() => data.openPreviewModal(transformDataForPreview(data))}
            className="w-full bg-white text-blue-600 border border-blue-400 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2"
            title="Vista Previa de la Pantalla"
          >
            <FaEye size={16} /> Vista Previa{" "}
          </button>{" "}
        </div>{" "}
        <Handle
          type="source"
          position={Position.Right}
          className="custom-handle"
          id={`${id}-source`}
        />{" "}
      </div>{" "}
    </>
  );
}
