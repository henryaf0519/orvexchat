import React from 'react';

export default function ChatSidebar({ conversations, selectedId, onSelect }) {
  return (
    // Asegúrate de que la clase flex-col está en el aside
    // y que el aside tiene una altura definida (por ejemplo, a través de flexbox)
    <aside className="w-80 bg-white shadow-lg border border-red-100 flex flex-col h-full">
      <h2 className="p-5 text-xl font-semibold text-white border-b border-red-200 bg-[#2D0303]">
        Chats
      </h2>
      <ul className="flex-1 overflow-y-auto divide-y divide-red-100">
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`relative p-4 cursor-pointer transition-colors hover:bg-red-50 ${selectedId === conv.id ? 'bg-red-100': ''} rounded-md focus:outline-none`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">{conv.name}</span>
              {conv.hasUnread && (
                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
