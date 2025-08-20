import React, { useState } from 'react';

export default function MessageItem({ message }) {
  // Determina si el mensaje es de la agencia (nosotros) o del cliente.
  const isAgent = message.from === "IA" || message.from === "agent";
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Clases CSS para los mensajes.
  const messageClasses = isAgent
    ? "bg-indigo-600 text-white rounded-br-xl rounded-2xl"
    : "bg-gray-200 text-gray-900 rounded-bl-xl rounded-2xl";

  // Función para formatear la fecha y hora del mensaje
  const formatTimestamp = (isoString) => {
    if (!isoString || !isoString.includes('#')) {
      return '';
    }
    
    const dateString = isoString.split('#')[1];
    const date = new Date(dateString);
    
    // ✅ CAMBIO CLAVE AQUÍ: Especificamos la zona horaria de Bogotá
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    };
    
    return date.toLocaleTimeString([], options);
  };

  return (
    <>
      {/* Contenedor principal del mensaje para alineación */}
      <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
        {/* Burbuja del mensaje */}
        <div className={`p-4 max-w-[70%] shadow-lg ${messageClasses}`}>
          {message.type === "image" ? (
            <img
              src={message.text}
              alt="Imagen enviada en el chat"
              className="rounded-lg w-48 h-auto cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {message.text}
            </p>
          )}

          {/* El timestamp ahora se mostrará en la hora correcta */}
          <p className={`text-xs mt-2 text-right ${isAgent ? 'text-indigo-200' : 'text-gray-500'}`}>
            {formatTimestamp(message.SK)}
          </p>
        </div>
      </div>

      {/* Modal para previsualización de imagen (esto no cambia) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={message.text}
              alt="Imagen en tamaño completo"
              className="max-w-full max-h-[80vh] w-auto object-contain"
            />
            <button
              style={{ top: "-3rem", right: "-1rem" }}
              className="absolute text-white text-4xl font-light leading-none cursor-pointer p-2 opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}