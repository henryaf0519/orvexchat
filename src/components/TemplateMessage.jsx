import React from 'react';
import { useChatStore } from '../store/chatStore';

export default function TemplateMessage({ template }) {
  // Obtenemos la función para enviar mensajes desde nuestro store
  const sendMessage = useChatStore((state) => state.sendMessage);

  // Esta función se ejecuta cuando el usuario hace clic en un botón de la plantilla
  const handleButtonClick = (buttonTitle) => {
    if (buttonTitle) {
      // Enviamos el texto del botón como si el usuario lo hubiera escrito
      sendMessage(buttonTitle);
    }
  };

  // Medida de seguridad por si la plantilla no llega con el formato esperado
  if (!template || !template.body) {
    return null;
  }

  return (
    <div className="bg-white text-gray-900 p-3 rounded-lg shadow-inner">
      {/* El cuerpo principal del mensaje de la plantilla */}
      <p className="text-sm whitespace-pre-line mb-3">
        {template.body}
      </p>

      {/* Si la plantilla tiene botones, los mostramos */}
      {template.buttons && template.buttons.length > 0 && (
        <div className="flex flex-col space-y-1 border-t border-gray-200 pt-2">
          {template.buttons.map((button) => (
            <div
              key={button.id || button.title}
              className="w-full text-center text-blue-800 bg-blue-100 border border-blue-200 font-medium py-1.5 px-3 rounded-lg text-sm"
            >
              {button.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}