// src/components/ContactDetailModal.jsx

import React from 'react';
import { FaUserCircle } from "react-icons/fa";

export default function ContactDetailModal({ contact, onClose }) {
  if (!contact) return null;

  const stageColors = {
    Nuevo: "bg-blue-100 text-blue-800",
    Contactado: "bg-indigo-100 text-indigo-800",
    Propuesta: "bg-purple-100 text-purple-800",
    Vendido: "bg-green-100 text-green-800",
    Perdido: "bg-gray-200 text-gray-800",
  };
  
  const stageColor = stageColors[contact.stage] || stageColors.Perdido;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-5 border-b-2 border-gray-100 flex justify-between items-center relative">
          <h2 className="text-xl font-bold text-gray-800">Detalles del Contacto</h2>
          
          {/* ↓↓↓ ESTE ES EL NUEVO BOTÓN DE 'X' ↓↓↓ */}
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 text-3xl leading-none font-semibold"
            title="Cerrar"
          >
            &times;
          </button>
        </div>

        {/* Cuerpo del Modal con la Información */}
        <div className="p-6 text-center">
            <FaUserCircle className="mx-auto text-6xl text-gray-300 mb-2" />
            <h3 className="text-3xl font-bold text-gray-900">{contact.name}</h3>
            <p className="text-md text-gray-500">{contact.number}</p>
        </div>
        
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <h4 className="text-xs font-semibold uppercase text-gray-400 mb-3">Información</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Etapa Actual</span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${stageColor}`}>
                {contact.stage || 'Nuevo'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}