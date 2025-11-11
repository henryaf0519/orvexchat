import React from 'react';
// ¡Asegúrate de importar el ícono del spinner!
import { X, AlertTriangle, Loader2 } from 'lucide-react'; 

function ConfirmationModal({
  title,
  message,
  onConfirm,
  onClose, // Usamos onClose como en tu ejemplo de Reminders
  isOpen,  // Usamos isOpen como en tu ejemplo de Reminders
  confirmText = 'Confirmar',
  confirmColor = 'red',
  isLoading = false, // <-- 1. NUEVA PROP
}) {

  // Si no está abierto, no renderiza nada
  if (!isOpen) {
    return null;
  }

  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  const handleCancel = () => {
    if (isLoading) return; // No permitir cerrar si está cargando
    onClose();
  };

  const handleConfirm = () => {
    if (isLoading) return; // No permitir múltiples clics
    onConfirm();
  };

  return (
    // Fondo oscuro
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={handleCancel} // Cierra el modal si se hace clic fuera
    >
      {/* Panel del Modal */}
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro
      >
        <div className="flex items-start">
          {/* Icono de Alerta */}
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${colorClasses[confirmColor]} bg-opacity-10 sm:mx-0 sm:h-10 sm:w-10`}>
            <AlertTriangle className={confirmColor === 'red' ? 'text-red-600' : 'text-blue-600'} size={24} />
          </div>
          
          <div className="ml-4 mt-0 text-left">
            <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading} // <-- 2. DESHABILITAR BOTÓN
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm min-w-[120px] ${colorClasses[confirmColor]} disabled:opacity-50 disabled:cursor-wait`}
          >
            {/* 3. MOSTRAR SPINNER O TEXTO */}
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              confirmText
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading} // <-- 4. DESHABILITAR BOTÓN
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;