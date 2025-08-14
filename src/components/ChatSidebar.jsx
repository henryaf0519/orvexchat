import React from 'react';

export default function ChatSidebar({ conversations, selectedId, onSelect }) {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
      <h2 className="p-4 text-lg font-semibold border-b border-gray-200">Chats</h2>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`p-4 cursor-pointer relative transition-colors hover:bg-gray-50 ${selectedId === conv.id ? 'bg-gray-100' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            {conv.name}
            {conv.hasUnread && (
              <span className="absolute top-4 right-4 h-3 w-3 bg-red-500 rounded-full" />
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
