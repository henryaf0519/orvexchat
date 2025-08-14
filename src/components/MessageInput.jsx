import { useState } from 'react';

export default function MessageInput({ onSend, isDisabled }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || isDisabled) return;
    onSend(text);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="Escribe un mensaje..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isDisabled}
      />
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isDisabled || !value.trim()}
      >
        Enviar
      </button>
    </form>
  );
}