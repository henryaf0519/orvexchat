import React from 'react';
import { FaTimes, FaUser, FaClock, FaPhone, FaEnvelope, FaCalendarDay } from 'react-icons/fa';

export default function EventModal({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null;

  const { title, start, extendedProps } = event;
  const { userNumber, guestEmail, professionalId } = extendedProps;

  // Formatear fecha y hora
  const dateStr = start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  // Color de borde según profesional (para un toque visual)
  const getBorderColor = (pid) => {
    if (pid === 'henry_arevalo') return 'border-blue-500';
    if (pid === 'stefanny_gomez') return 'border-pink-500';
    if (pid === 'juanca_perez') return 'border-amber-500';
    return 'border-emerald-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Card del Modal */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border-t-4 ${getBorderColor(professionalId)}`}
        onClick={(e) => e.stopPropagation()} // Evita cerrar si clickeas dentro
      >
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 bg-slate-50 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">
              Detalles de la Cita
            </h3>
            <p className="text-xs text-slate-500 uppercase font-bold mt-1 tracking-wide">
              Agendada vía WhatsApp
            </p>
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
          
          {/* Título Principal */}
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
               <FaCalendarDay size={20} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Servicio</p>
                <p className="text-lg font-bold text-slate-800">{title}</p>
            </div>
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
          <div className="space-y-3">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Cliente</p>
             
             <div className="flex items-center gap-3 text-slate-700">
                <FaPhone className="text-slate-400" />
                <span className="font-mono font-medium text-slate-900">{userNumber}</span>
             </div>
             
             <div className="flex items-center gap-3 text-slate-700">
                <FaEnvelope className="text-slate-400" />
                <span className="text-sm">{guestEmail || 'No registrado'}</span>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}