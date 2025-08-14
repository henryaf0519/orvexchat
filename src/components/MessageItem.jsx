import React from 'react';

export default function MessageItem({ message }) {
  // Un mensaje de la IA/agente va a la derecha. Un mensaje del usuario va a la izquierda.
  const isAgent = message.from === 'IA' || message.from === 'agent';
  
  const messageClasses = isAgent
    ? 'bg-blue-500 text-white self-end rounded-br-none' // Mensajes del agente
    : 'bg-gray-300 text-gray-800 self-start rounded-bl-none'; // Mensajes del usuario

  return (
    <div className={`p-3 max-w-[80%] rounded-xl shadow-md ${messageClasses}`}>
      <p className="text-sm">{message.text}</p>
    </div>
  );
}