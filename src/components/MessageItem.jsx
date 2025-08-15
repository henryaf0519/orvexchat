import React, { useState } from "react";

export default function MessageItem({ message }) {
  const isAgent = message.from === "IA" || message.from === "agent";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const messageClasses = isAgent
    ? "bg-indigo-600 text-white self-end rounded-br-xl rounded-2xl"
    : "bg-gray-200 text-gray-900 self-start rounded-bl-xl rounded-2xl";

  return (
    <>
      <div className={`p-4 max-w-[80%] shadow-lg ${messageClasses}`}>
        {message.type === "image" ? (
          <img
            src={message.text}
            alt="Imagen enviada en el chat"
            className="rounded-lg w-48 h-auto cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {message.text}
          </p>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={message.text}
              alt="Imagen en tamaño completo"
              className="max-w-full max-h-[80vh] w-auto object-contain"
            />
            <button
              style={{ top: "-3rem", right: "-1rem" }}
              className="absolute text-white text-4xl font-light leading-none cursor-pointer p-2 opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
