import React from 'react';
import { useChatStore } from '../store/chatStore';

export default function TemplateMessage({ template }) {
  const sendMessage = useChatStore((state) => state.sendMessage);

  const handleButtonClick = (buttonTitle) => {
    if (buttonTitle) {
      sendMessage(buttonTitle);
    }
  };

  if (!template || !template.components) {
    return null;
  }

  // Extraemos los diferentes componentes de la plantilla
  const headerComponent = template.components.find(c => c.type === 'HEADER');
  const bodyComponent = template.components.find(c => c.type === 'BODY');
  const buttonsComponent = template.components.find(c => c.type === 'BUTTONS');

  const bodyText = bodyComponent ? bodyComponent.text : '';
  const buttons = buttonsComponent ? buttonsComponent.buttons : [];
  
  // Extraemos la URL de la imagen del encabezado
  const imageUrl = headerComponent?.format === 'IMAGE' && headerComponent.example?.header_handle?.[0];

  return (
    <div className="bg-white text-gray-900 p-3 rounded-lg shadow-inner">
      {/* Si hay una imagen en el header, la mostramos */}
      {imageUrl && (
        <img src={imageUrl} alt="Encabezado de la plantilla" className="rounded-md w-full h-auto object-cover mb-2" />
      )}

      {/* El cuerpo principal del mensaje de la plantilla */}
      <p className="text-sm whitespace-pre-line mb-3">
        {bodyText}
      </p>

      {/* Si la plantilla tiene botones, los mostramos */}
      {buttons && buttons.length > 0 && (
        <div className="flex flex-col space-y-1 border-t border-gray-200 pt-2">
          {buttons.map((button, index) => (
            <div
              key={index}
              className="w-full text-center text-blue-800 bg-blue-100 border border-blue-200 font-medium py-1.5 px-3 rounded-lg text-sm"
            >
              {button.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}