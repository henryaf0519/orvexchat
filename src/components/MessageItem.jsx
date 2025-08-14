import React from 'react';

export default function MessageItem({ message }) {
  // ✅ Función para reemplazar saltos de línea con etiquetas <br>
  const formatMessageText = (text) => {
    return text.split('\n').join('<br>');
  };

  const isAgent = message.from === 'IA' || message.from === 'agent';
  
  const messageClasses = isAgent
    ? 'bg-blue-500 text-white self-end rounded-br-none'
    : 'bg-gray-300 text-gray-800 self-start rounded-bl-none';

  return (
    <div className={`p-3 max-w-[80%] rounded-xl shadow-md ${messageClasses}`}>
      {/* ✅ Usamos dangerouslySetInnerHTML para renderizar el HTML */}
      <p 
        className="text-sm"
        dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }} 
      />
    </div>
  );
}