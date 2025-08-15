import React from 'react';

export default function ChatSidebar({ conversations, selectedId, onSelect }) {
  return (
    <aside className="w-80 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 flex flex-col">
      <h2 className="p-5 text-xl font-semibold text-gray-900 border-b border-gray-200 bg-gray-50">
        Chats
      </h2>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`relative p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedId === conv.id ? 'bg-gray-100' : ''} rounded-md focus:outline-none`}
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
