import React from 'react';

export default function MessageItem({ message }) {
  const isAgent = message.from === 'IA' || message.from === 'agent';

  const messageClasses = isAgent
    ? 'bg-indigo-600 text-white self-end rounded-br-xl rounded-2xl'
    : 'bg-gray-200 text-gray-900 self-start rounded-bl-xl rounded-2xl';

  return (
    <div className={`p-4 max-w-[80%] shadow-lg ${messageClasses}`}>
      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
    </div>
  );
}
