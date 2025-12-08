import { useState } from 'react';
import Picker from 'emoji-picker-react';

export default function MessageInput({ onSend, isDisabled }) {
  const [value, setValue] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleSendClick = () => {
    const text = value.trim();
    if (!text || isDisabled) return;
    onSend(text);
    setValue('');
    setShowPicker(false); // Cerramos el picker al enviar
  };

  const onEmojiClick = (emojiObject) => {
    // Añade el emoji al final del texto actual
    setValue((prevValue) => prevValue + emojiObject.emoji);
  };

  return (
    <div className="flex items-end gap-2 relative">
      
      {/* Selector de Emojis (Flotante) */}
      {showPicker && (
        <div className="absolute bottom-16 left-0 z-10 shadow-xl rounded-xl">
          <Picker onEmojiClick={onEmojiClick} width={300} height={400} />
        </div>
      )}

      {/* Botón para abrir/cerrar emojis */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`p-3 rounded-full transition-colors h-[46px] w-[46px] flex items-center justify-center ${
          showPicker ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
        }`}
        disabled={isDisabled}
      >
        {/* SVG de Carita Feliz */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm6 0c0 .414-.168.75-.375.75S15 10.164 15 9.75 15.168 9 15.375 9s.375.336.375.75Z" />
        </svg>
      </button>

      {/* Área de texto */}
      <textarea
        className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none custom-scrollbar"
        placeholder="Escribe un mensaje..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isDisabled}
        rows={1}
        style={{ minHeight: '46px', maxHeight: '150px' }}
      />
      
      {/* Botón de Enviar */}
      <button
        type="button"
        onClick={handleSendClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[46px]"
        disabled={isDisabled || !value.trim()}
      >
        Enviar
      </button>
    </div>
  );
}