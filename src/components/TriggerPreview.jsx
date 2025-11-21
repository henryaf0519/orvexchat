import React from 'react';
// Usaremos un ícono de flecha o similar para el botón
import { FaArrowRight } from 'react-icons/fa'; 

/**
 * Vista previa que simula el mensaje de trigger de WhatsApp.
 */
export default function TriggerPreview({ header, body, footer, cta }) {
  return (
    <div className="w-full max-w-[320px] bg-white p-1 rounded-lg shadow-lg border border-gray-200 sticky top-6">
      {/* Burbuja de mensaje tipo WhatsApp */}
      <div className="bg-[#E1F7CB] p-3 rounded-lg flex flex-col gap-1 shadow-inner">
        
        {/* 1. Header (Encabezado) */}
        <p className="font-bold text-gray-900 text-base">
          {header || 'Hola nombre'}
        </p>
        
        {/* 2. Body (Cuerpo) */}
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
          {body || 'Para continuar oprime el boton por favor'}
        </p>
        
        {/* 3. Footer (Pie de página) */}
        <p className="text-xs text-gray-500 mt-1">
          {footer}
        </p>
      </div>

      {/* 4. Button (CTA - Call to Action) */}
      <div className="mt-1">
        <div className="bg-white text-center text-blue-600 p-2.5 rounded-lg text-sm border-t border-gray-200 flex items-center justify-center gap-2 font-medium">
          {/* Usamos un ícono genérico, ya que el de "flujo" de WA es específico */}
          <FaArrowRight size={14} /> 
          <span>{cta || 'Abrir Menú'}</span>
        </div>
      </div>
    </div>
  );
}