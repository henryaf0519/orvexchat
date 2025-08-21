import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';      // ✅ 1. Importa el store de Zustand
import TemplateMessage from './TemplateMessage';    // ✅ 2. Importa el nuevo componente de plantilla

export default function MessageItem({ message }) {
  const isAgent = message.from === "IA" || message.from === "agent";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const templates = useChatStore((state) => state.templates);

  const messageBubbleClasses = isAgent
    ? "bg-indigo-600 text-white"
    : "bg-gray-200 text-gray-900";

  const formatTimestamp = (isoString) => {
    if (!isoString || !isoString.includes('#')) return '';
    const dateString = isoString.split('#')[1];
    const date = new Date(dateString);
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    };
    return date.toLocaleTimeString([], options);
  };

  const renderContent = () => {
    switch (message.type) {
      
      case 'plantilla': {
        console.log('message: ', message)
        const templateData = templates.get(message.text);
        if (templateData) {
          return <TemplateMessage template={templateData} />;
        }
        // Si no encontramos la plantilla, mostramos un mensaje de error útil
        return <p className="text-sm text-red-300 bg-red-50 p-2 rounded">Plantilla "{message.text}" no encontrada.</p>;
      }

      case 'image':
        return (
          <img
            src={message.text}
            alt="Imagen enviada en el chat"
            className="rounded-lg w-48 h-auto cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        );

      default: // Esto manejará 'text' y cualquier otro tipo como texto plano
        return (
          <p className="text-sm leading-relaxed whitespace-pre-line px-2">
            {message.text}
          </p>
        );
    }
  };

  return (
    <>
      <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
        {/* ✅ 5. Ajustamos el padding (p-2) para que las plantillas se vean bien integradas */}
        <div className={`p-2 max-w-[70%] shadow-lg rounded-2xl ${messageBubbleClasses}`}>
          
          {renderContent()}

          <p className={`text-xs mt-2 text-right px-2 ${isAgent ? 'text-indigo-200' : 'text-gray-500'}`}>
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