import React from 'react';

export default function ChatSidebar({ conversations, selectedId, onSelect }) {
  // Función para generar un color de fondo aleatorio para los avatares
  const getRandomColor = (id) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    // Usa un hash simple del ID para consistentemente elegir un color
    const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full">
      <h2 className="p-5 text-xl font-semibold text-gray-700 border-b border-gray-200 bg-white">
        Messages
      </h2>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {conversations.map((conv, index) => (
          <li
            key={conv.id}
            className={`
              relative p-4 cursor-pointer transition-colors 
              ${selectedId === conv.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
              ${index % 2 === 0 && selectedId !== conv.id ? 'bg-white' : ''}
              ${index % 2 !== 0 && selectedId !== conv.id ? 'bg-gray-50' : ''}
              hover:bg-gray-100
              focus:outline-none
            `}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex items-center space-x-4">
              {/* Avatar o Iniciales */}
              <div className={`flex items-center justify-center h-12 w-12 rounded-full text-white font-bold text-xl uppercase ${getRandomColor(conv.id)}`}>
                
              </div>
              
              <div className="flex-grow">
                <span className="text-lg font-medium text-gray-900">{conv.name}</span>
                {/* Puedes añadir un preview de mensaje aquí si lo deseas en el futuro */}
                {/* <p className="text-sm text-gray-500 truncate">Último mensaje...</p> */}
              </div>

              {/* Indicador de mensajes no leídos */}
              {conv.hasUnread && (
                <span className="w-3 h-3 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
