import React from 'react';
import { X } from 'lucide-react';
// Importamos la imagen de los checks que nos diste
//import metaChecksImage from '../assets/meta-checks.png'; // <-- ¡DEBES AÑADIR LA IMAGEN!

export default function FlowInstructionsModal({ onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            ¡Importante! Verificación Manual Requerida
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Antes de enviar una prueba, Meta requiere que tu **Aplicación de Meta** esté conectada manualmente a tu **Cuenta de WhatsApp Business (WABA)**.
          </p>

          <p className="text-sm text-gray-700 mb-4">
            Por favor, ve a tu panel de Meta for Developers y asegúrate de que el **"Check 2: Conectar aplicación de Meta"** esté marcado en verde, como se muestra aquí:
          </p>

          {/* Imagen de Instrucción */}
          <div className="my-4 p-2 border rounded-md bg-gray-50">
            <img 
              src="" 
              alt="Instrucciones de conexión de App de Meta" 
              className="w-full h-auto rounded"
            />
          </div>

          <p className="text-sm text-gray-700">
            Este paso solo se hace una vez. Si no está conectado, nuestro intento de enviar la prueba fallará.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="mt-2 p-4 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Ya lo verifiqué, continuar
          </button>
        </div>
      </div>
    </div>
  );
}