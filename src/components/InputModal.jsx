import React, { useState } from 'react';
// Importa un ícono de spinner, por ejemplo de lucide-react
import { X, Loader2 } from 'lucide-react';

function InputModal({
  title,
  message,
  inputLabel,
  inputPlaceholder = '',
  confirmText = 'Confirmar',
  onConfirm,
  onCancel,
  isLoading = false, // <-- 1. Nueva prop para el estado de carga
}) {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    // Evita múltiples clics si ya está cargando
    if (isLoading) return;
    onConfirm(inputValue);
  };

  const handleCancel = () => {
    // Evita cerrar si está cargando
    if (isLoading) return;
    onCancel();
  };

  const handleKeyDown = (e) => {
    if (isLoading) return;
    if (e.key === 'Enter') {
      handleConfirm();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    // Fondo oscuro
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={handleCancel} // Cierra al hacer clic fuera
    >
      {/* Panel del Modal */}
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleCancel}
            disabled={isLoading} // <-- 2. Deshabilitar botón
            className="text-gray-400 hover:text-gray-600 rounded-full p-1 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mensaje */}
        {message && (
          <p className="text-sm text-gray-600 mb-4">{message}</p>
        )}

        {/* Campo de Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {inputLabel}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={isLoading} // <-- 3. Deshabilitar input
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            autoFocus
          />
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading} // <-- 4. Deshabilitar botón
            className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading} // <-- 5. Deshabilitar botón
            className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-wait flex items-center justify-center min-w-[120px]"
          >
            {/* 6. Mostrar spinner o texto */}
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InputModal;