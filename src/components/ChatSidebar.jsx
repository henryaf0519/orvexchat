import React from 'react';

// ✅ Función de ayuda para formatear la hora (la movemos aquí para reutilizarla)
const formatTimestamp = (isoString) => {
  if (!isoString || !isoString.includes('#')) return '';
  const dateString = isoString.split('#')[1];
  const date = new Date(dateString);
  const options = { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' };
  return date.toLocaleTimeString([], options);
};

export default function ChatSidebar({ conversations, selectedId, onSelect }) {
  const getRandomColor = (id) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500'];
    const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full">
      <h2 className="p-5 text-xl font-semibold text-gray-700 border-b border-gray-200">
        Messages
      </h2>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedId === conv.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 h-5 w-5 rounded-full ${getRandomColor(conv.id)}`}>
                {/* Vacío por dentro */}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-md font-medium text-gray-900 truncate">{conv.name}</span>
                  {/* ✅ Mostramos la hora del último mensaje */}
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {conv.lastMessage ? formatTimestamp(conv.lastMessage.SK) : ''}
                  </span>
                </div>
                {/* ✅ Mostramos el preview del último mensaje */}
                <p className="text-sm text-gray-600 truncate">
                  {conv.lastMessage ? conv.lastMessage.text : 'No hay mensajes...'}
                </p>
              </div>

              {conv.hasUnread && (
                <span className="w-3 h-3 bg-red-500 rounded-full self-start mt-1" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}