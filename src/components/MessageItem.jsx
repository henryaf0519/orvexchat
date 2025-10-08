import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import TemplateMessage from './TemplateMessage';
import AudioPlayer from './AudioPlayer';

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
      case 'audio':
        return <AudioPlayer src={message.url} isAgent={isAgent} />;

      case 'plantilla': {
        const templateData = templates.get(message.text);
        if (templateData) {
          return <TemplateMessage template={templateData} />;
        }
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

      case 'flow':
        // Contenido del Flow para ser renderizado dentro de la burbuja
        return (
          <div className="p-2">
            <p className="font-bold text-center mb-2">Flow Interactivo</p>
            <p className="text-sm text-center opacity-90">{message.text}</p>
            <button className="mt-4 w-full bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
              Iniciar Flow
            </button>
          </div>
        );

      case 'respflow':
        const formattedRespFlow = message.text
          .replace(/✅ \*(.*?)\*/g, '<br><strong>✅ $1</strong>')
          .replace(/👤 \*(.*?)\*/g, '<br><strong>👤 $1</strong>')
          .replace(/\*([^:]+):\*/g, '<strong>$1:</strong>')
          .replace(/----------------------------------/g, '<hr class="my-2 border-t border-gray-400 opacity-50">')
          .trim();
        return (
          <p
            className="text-sm leading-relaxed whitespace-pre-line px-2"
            dangerouslySetInnerHTML={{ __html: formattedRespFlow.split('\n').join('<br>') }}
          />
        );

      default:
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
        <div className={`p-2 max-w-[70%] shadow-lg rounded-2xl ${messageBubbleClasses}`}>
          
          {renderContent()}

          <p className={`text-xs mt-2 text-right px-2 ${isAgent ? 'text-indigo-200' : 'text-gray-500'}`}>
            {formatTimestamp(message.SK)}
          </p>
        </div>
      </div>

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