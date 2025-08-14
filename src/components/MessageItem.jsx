import React from 'react';

export default function MessageItem({ message }) {
  const isAgent = message.from === 'IA' || message.from === 'agent';

  const messageClasses = isAgent
    ? 'bg-indigo-600 text-white self-end rounded-br-sm rounded-2xl'
    : 'bg-gray-200 text-gray-900 self-start rounded-bl-sm rounded-2xl';

  return (
    <div className={`p-3 max-w-[75%] shadow-md ${messageClasses}`}>
      <p className="text-sm leading-relaxed whitespace-pre-line">
        {message.text}
      </p>
    </div>
  );
}