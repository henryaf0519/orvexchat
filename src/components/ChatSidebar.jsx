import React from 'react';

// ✅ Función de ayuda para formatear la hora (la movemos aquí para reutilizarla)
const formatTimestamp = (isoString) => {
    // Manejo de casos donde isoString es null o no tiene el separador '#'
    if (!isoString || !isoString.includes('#')) return '';
    
    // Extraemos la parte de la fecha/hora después del '#'
    const dateString = isoString.split('#')[1];
    
    // Si dateString es inválido o nulo, devolvemos cadena vacía
    if (!dateString) return '';

    const date = new Date(dateString);
    // Nota: 'America/Bogota' asume que el backend guarda UTC o el cliente está en esta zona horaria.
    // Si la hora es UTC, es mejor no forzar una zona horaria aquí para evitar confusión. 
    // Lo mantendremos como estaba si la intención es que el navegador decida o use la hora local.
    const options = { hour: '2-digit', minute: '2-digit' }; 
    return date.toLocaleTimeString([], options);
};

// 🌟 CAMBIO CLAVE: Aceptamos 'className' como prop 
export default function ChatSidebar({ conversations, selectedId, onSelect, className }) {
    const getRandomColor = (id) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500'];
        const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
    };

    return (
        // 🌟 CAMBIO CLAVE: Fusionamos las clases fijas con la prop 'className'
        // Las clases de 'className' (que vienen de ChatPage) controlarán la adaptabilidad y visibilidad.
        <aside 
            className={`
                bg-white shadow-lg border-r border-gray-200 
                flex flex-col h-full 
                ${className} 
                md:w-80 md:shadow-lg md:static
            `}
        >
            <h2 className="p-5 text-xl font-semibold text-gray-700 border-b border-gray-200">
                Messages
            </h2>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {conversations.map((conv) => (
                    <li
                        key={conv.id}
                        className={`p-4 cursor-pointer transition-colors ${
                            selectedId === conv.id ? 'bg-red-50 border-l-4 border-red-600' : 'hover:bg-gray-50'
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
                                <span className="w-3 h-3 bg-red-500 rounded-full self-start mt-1 animate-pulse" />
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </aside>
    );
}