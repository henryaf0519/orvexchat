import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem'; // Este componente será actualizado a continuación
import MessageInput from './MessageInput'; // Este componente será actualizado a continuación
import { FaChevronLeft, FaEllipsisV } from 'react-icons/fa'; // Para iconos en el header

export default function ChatWindow({
  chatId,
  messages,
  isHumanControl,
  isSendDisabled,
  onSend,
  onToggleMode,
}) {
  const messagesEndRef = useRef(null);

  // Desplazarse al último mensaje cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Función para obtener la primera letra del ID del chat para el avatar del header
  const getChatAvatarInitial = (id) => {
    if (!id) return '';
    const namePart = id.split('#')[0]; // Si el ID es algo como "CHAT#12345", toma "CHAT"
    return namePart.charAt(0).toUpperCase();
  };

  return (
    <section className="flex-1 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden m-4">
      {/* Encabezado de la ventana de chat */}
      <header className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-4">
          <FaChevronLeft className="text-gray-500 cursor-pointer text-xl md:hidden" /> {/* Solo visible en móviles */}
          {chatId ? (
            <div className="flex items-center space-x-3">
              {/* Avatar del chat/cliente en el header */}
            
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{chatId}</h2>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-semibold text-gray-800">Selecciona un chat</h2>
          )}
        </div>

        {chatId && (
          <div className="flex items-center space-x-3">
            {/* Botón de control de modo */}
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-md ${
                isHumanControl ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              } text-white`}
              onClick={() => onToggleMode(isHumanControl ? 'IA' : 'humano')}
            >
              {isHumanControl ? 'Devolver a IA' : 'Tomar Control Humano'}
            </button>
            <FaEllipsisV className="text-gray-500 cursor-pointer text-xl" /> {/* Menú de opciones */}
          </div>
        )}
      </header>

      {/* Área de mensajes */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            // Se pasa isHumanControl para que MessageItem sepa cómo renderizar
            <MessageItem key={msg.SK || `message-${index}`} message={msg} isHumanControl={isHumanControl} />
          ))
        ) : (
          <p className="text-center text-gray-500 mt-20">
            No hay mensajes en esta conversación.
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pie de página con el input de mensaje */}
      <footer className="p-4 border-t border-gray-200 bg-white">
        <MessageInput onSend={onSend} isDisabled={isSendDisabled} />
      </footer>
    </section>
  );
}
