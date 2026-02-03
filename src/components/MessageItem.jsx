import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import TemplateMessage from './TemplateMessage';
import AudioPlayer from './AudioPlayer';
import { FaClipboardList } from 'react-icons/fa';

export default function MessageItem({ message }) {
  const isAgent = message.from === "IA" || message.from === "agent";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const templates = useChatStore((state) => state.templates);

  const messageBubbleClasses = isAgent
    ? "bg-indigo-600 text-white"
    : "bg-gray-200 text-gray-900";

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    
    try {
      const dateString = isoString.includes('#') ? isoString.split('#')[1] : isoString;
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return ''; 

      const options = {
        day: 'numeric',    
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Bogota'
      };
      return date.toLocaleString('es-CO', options).replace(',', ''); 
                  
    } catch (e) {
      return '';
    }
  };

  const renderContent = () => {
    // 🛡️ SOLUCIÓN ROBUSTA:
    // 1. Obtenemos el valor crudo
    let rawValue = message.text;

    // 2. Si es un objeto, intentamos extraer 'data'
    if (typeof rawValue === 'object' && rawValue !== null) {
        rawValue = rawValue.data;
    }

    // 3. ⚠️ IMPORTANTE: Forzamos la conversión a String.
    // Esto arregla el error "replace is not a function" si llega un número (ej: 12345)
    // o si llega null/undefined.
    const safeText = String(rawValue || "");

    switch (message.type) {
      case 'audio':
        return <AudioPlayer src={message.url} isAgent={isAgent} />;

      case 'plantilla': {
        // Usamos safeText que ya garantizamos que es un string
        const templateName = safeText;
        
        // console.log('Renderizando plantilla:', message); 
        
        const templateData = templates.find(t => t.name === templateName);
        
        if (templateData) {
          return <TemplateMessage template={templateData} />;
        }
        return <p className="text-sm text-red-300 bg-red-50 p-2 rounded">Plantilla "{templateName}" no encontrada.</p>;
      }

      case 'image':
        return (
          <img
            src={safeText}
            alt="Imagen enviada en el chat"
            className="rounded-lg w-48 h-auto cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        );

      case 'flow':
        return (
          <div className="p-2">
            <p className="font-bold text-center mb-2">Flow Interactivo</p>
            <p className="text-sm text-center opacity-90">{safeText}</p>
            <button className="mt-4 w-full bg-white text-indigo-600 font-semibold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
              Iniciar Flow
            </button>
          </div>
        );

      case 'respflow':
        // Ahora safeText es 100% seguro un string, el .replace funcionará
        const formattedRespFlow = safeText
          .replace(/✅ \*(.*?)\*/g, '<br><strong>✅ $1</strong>')
          .replace(/👤 \*(.*?)\*/g, '<br><strong>👤 $1</strong>')
          .replace(/----------------------------------/g, '<hr class="my-2 border-t border-indigo-400/50">')
          .replace(/\*([^:]+):\*/g, '<strong>$1:</strong>')
          .trim();
        
        return (
          <div className="bg-indigo-500 rounded-lg p-3 shadow-inner w-full max-w-xs">
            <div className="flex items-center gap-2 mb-2 border-b border-indigo-400/50 pb-2">
              <FaClipboardList className="text-indigo-200" size={16} />
              <h4 className="text-sm font-semibold text-white">Resumen de la Interacción</h4>
            </div>
            
            <p
              className="text-sm leading-relaxed whitespace-pre-line px-1 text-indigo-100"
              dangerouslySetInnerHTML={{ __html: formattedRespFlow }}
            />
          </div>
        );

      default:
        return (
          <p className="text-sm leading-relaxed whitespace-pre-line px-2">
            {safeText}
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
              src={String(message.text?.data || message.text || "")} 
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