import React from 'react';
import { X, AlertTriangle } from 'lucide-react'; // <-- Importar ícono de alerta
import { useChatStore } from '../../store/chatStore';

// Asegúrate de que esta ruta sea correcta para tu nueva imagen (verificar.jpg)
import metaExtremoImage from '../../assets/verificar.jpg'; 

export default function FlowInstructionsModal({ flowName, onConfirm, onClose, test }) {
  console.log("FlowInstructionsModal renderizado con metaFlowId:", flowName);
  
  const wabaId = useChatStore((state) => state.userData?.waba_id);
  
  // Construye la URL DIRECTA
  const metaFlowUrl = `https://business.facebook.com/latest/whatsapp_manager/flow_edit/?business_id=${wabaId || 'TU_WABA_ID'}&tab=flow-edit&id=${flowName || 'TU_FLOW_ID'}&nav_ref=whatsapp_manager`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl" // Modal grande
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Acción Requerida: Conectar App de Meta
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {test ? (
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
              Antes de enviar una prueba, Meta requiere una conexión manual. Sigue estos 2 pasos:
            </div>
          ): (
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
              Antes de publicar el flujo, Meta requiere una conexión manual. Sigue estos 2 pasos:
            </div>
          )}
          <p className="text-gray-700 mb-4">
            
          </p>
          
          {/* --- ✅ NOTA IMPORTANTE (MOVIDA AL INICIO) --- */}
          <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-6">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <span className="font-bold">Nota:</span> Solo necesitas hacer esto **una vez por cada flujo nuevo** que crees. Si ya lo hiciste para este flujo, puedes presionar "Continuar" directamente.
            </div>
          </div>

          {/* --- PASO 1: Ir al Editor --- */}
          <div className="mb-4">
            <p className="font-semibold text-gray-800">1. Ir al Editor del Flujo</p>
            <p className="text-sm text-gray-600">
              Haz clic en este enlace para ir **directamente** a la pestaña "Extremo" de tu flujo:
            </p>
            <a 
              href={metaFlowUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 break-all text-sm underline"
            >
              {metaFlowUrl}
            </a>
          </div>

          {/* --- PASO 2: Conectar la Aplicación --- */}
          <div className="mb-4">
            <p className="font-semibold text-gray-800">2. Conecta la Aplicación</p>
            
            <p className="text-sm text-gray-600">
              En la pestaña <strong>"Extremo"</strong>, haz clic en el botón <strong>"Conectar aplicación de Meta"</strong>, selecciona tu aplicación de la lista y haz clic en enviar.
            </p>
            
            <p className="text-sm text-green-700 font-medium mt-3 p-2 bg-green-50 rounded-md">
              ✅ Al finalizar, el indicador de conexión se actualizará a un **check de color verde**, confirmando los permisos.
            </p>

            <div className="my-3 p-2 border rounded-md bg-gray-50 flex justify-center">
              <img 
                src={metaExtremoImage}
                alt="Botón Extremo y Conectar aplicación de Meta" 
                className="h-auto rounded shadow-sm max-w-3xl"
              />
            </div>
          </div>
        </div>

        {/* --- ✅ Botones de Acción (NOTA ELIMINADA DE AQUÍ) --- */}
        <div className="mt-2 p-4 flex justify-end items-center bg-gray-50 rounded-b-lg">
          <div>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 mr-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
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
    </div>
  );
}