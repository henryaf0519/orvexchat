import React from "react";
import {
  FaTimes,
  FaUser,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaCalendarDay,
  FaVideo,
} from "react-icons/fa";

export default function EventModal({ isOpen, onClose, event, onCancel }) {
  if (!isOpen || !event) return null;

  const { title, start, extendedProps } = event;
  // Extraemos los nuevos datos
  const { userNumber, guestEmail, professionalId, userName, meetingLink } =
    extendedProps;

  const dateStr = start.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const getBorderColor = (pid) => {
    if (pid === "henry_arevalo") return "border-blue-500";
    if (pid === "stefanny_gomez") return "border-pink-500";
    if (pid === "juanca_perez") return "border-amber-500";
    return "border-emerald-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border-t-4 ${getBorderColor(
          professionalId
        )}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 bg-slate-50 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">
              Detalles de la Cita
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Título y Link de Video */}
          <div>
            <div className="flex items-start gap-4 mb-2">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                <FaCalendarDay size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Servicio</p>
                <p className="text-lg font-bold text-slate-800 leading-snug">
                  {title}
                </p>
              </div>
            </div>

            {/* ✅ BOTÓN DE REUNIÓN (Solo si existe el link) */}
            {meetingLink && (
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-14 mt-2 flex items-center gap-2 w-fit px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
              >
                <FaVideo />
                Conectarme
              </a>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <FaClock size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Fecha y Hora</p>
              <p className="text-slate-800 font-medium capitalize">{dateStr}</p>
              <p className="text-slate-800 font-bold text-lg">{timeStr}</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Información del Cliente */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Cliente
            </p>

            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white p-2 rounded-full shadow-sm text-slate-600">
                <FaUser size={14} />
              </div>
              {/* ✅ NOMBRE GRANDE */}
              <span className="font-bold text-slate-800 text-lg">
                {userName || "Cliente Web"}
              </span>
            </div>

            <div className="space-y-2 pl-11">
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <FaPhone className="text-slate-400" size={12} />
                <span className="font-mono">{userNumber}</span>
              </div>

              {guestEmail && (
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <FaEnvelope className="text-slate-400" size={12} />
                  <span>{guestEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-red-500 border border-red-600 rounded-lg text-white font-medium hover:bg-red-600 active:bg-red-700 transition-colors shadow-md hover:shadow-red-500/50"
          >
            Cancelar Cita
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors text-sm shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
