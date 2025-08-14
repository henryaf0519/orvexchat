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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        className="flex-1 border rounded p-2"
        placeholder="Escribe un mensaje..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isDisabled}
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={isDisabled || !value.trim()}
      >
        Enviar
      </button>
    </form>
  );
}