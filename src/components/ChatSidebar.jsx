import React from 'react';

// Función de ayuda para formatear la hora (se mantiene igual)
const formatTimestamp = (isoString) => {
    if (!isoString || !isoString.includes('#')) return '';
    const dateString = isoString.split('#')[1];
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit' }; 
    return date.toLocaleTimeString([], options);
};

export default function ChatSidebar({ conversations, selectedId, onSelect, className }) {
    
    const getRandomColor = (id) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500'];
        const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
    };

    // ✅ NUEVA FUNCIÓN: Maneja el texto de forma segura
    const renderMessagePreview = (message) => {
        // 1. Si no hay mensaje
        if (!message) return 'No hay mensajes...';

        const content = message.text;

        // 2. Si es un string normal (caso ideal), lo mostramos
        if (typeof content === 'string') {
            return content;
        }

        // 3. Si es un objeto (el caso que rompía tu app)
        if (typeof content === 'object') {
            // Opcional: Si el objeto tiene una propiedad "data", intentamos mostrarla
            if (content && content.data && typeof content.data === 'string') {
                return content.data;
            }
            // Fallback seguro para cualquier otro objeto raro
            return 'Formato no soportado'; 
        }

        // 4. Cualquier otra cosa (números, booleanos, etc.)
        return String(content || '');
    };

    return (
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
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-md font-medium text-gray-900 truncate">{conv.name}</span>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                        {conv.lastMessage ? formatTimestamp(conv.lastMessage.SK) : ''}
                                    </span>
                                </div>
                                
                                {/* ✅ USAMOS LA NUEVA FUNCIÓN AQUÍ */}
                                <p className="text-sm text-gray-600 truncate">
                                    {renderMessagePreview(conv.lastMessage)}
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