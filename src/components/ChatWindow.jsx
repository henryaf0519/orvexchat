import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

export default function ChatWindow({
  chatId,
  messages,
  isHumanControl,
  isSendDisabled,
  onSend,
  onToggleMode,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <section className="flex-1 flex flex-col bg-white shadow-lg overflow-hidden">
      <header className="p-5 border-b border-red-200 flex justify-between items-center bg-[#2D0303]">
        <h2 className="text-xl font-semibold text-white">
          {chatId ? `Chat con ${chatId}` : 'Selecciona un chat'}
        </h2>
        {chatId && (
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isHumanControl ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
            onClick={() => onToggleMode(isHumanControl ? 'IA' : 'humano')}
          >
            {isHumanControl ? 'Devolver a la IA' : 'Tomar Control Humano'}
          </button>
        )}
      </header>

      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-red-50">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <MessageItem key={msg.SK || `message-${index}`} message={msg} />
          ))
        ) : (
          <p className="text-center text-gray-500 mt-20">
            No hay mensajes en esta conversación.
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-5 border-t border-red-200 bg-white">
        <MessageInput onSend={onSend} isDisabled={isSendDisabled && !isHumanControl} />
      </footer>
    </section>
  );
}
