import React from 'react';

// Función para resaltar las variables en el texto del cuerpo
const formatBodyText = (text) => {
  if (!text) return '';
  // Reemplaza {{1}}, {{2}}, etc., con un estilo visual para que se vean como placeholders
  const formattedText = text.replace(/{{(\d+)}}/g, '<span class="bg-blue-200 text-blue-800 font-medium px-1 rounded-sm">[$&]</span>');
  return formattedText.split('\n').join('<br />'); // Respeta los saltos de línea
};

export default function TemplatePreview({ template }) {
  if (!template) {
    return <p className="text-gray-500 text-center">Selecciona una plantilla para ver la vista previa.</p>;
  }

  // Extraemos los diferentes componentes de la plantilla
  const header = template.components.find(c => c.type === 'HEADER');
  const body = template.components.find(c => c.type === 'BODY');
  const footer = template.components.find(c => c.type === 'FOOTER');
  const buttons = template.components.find(c => c.type === 'BUTTONS');

  return (
    <div className="w-full max-w-[320px] bg-white p-1 rounded-lg shadow-lg border border-gray-200">
      <div className="bg-[#E1F7CB] p-3 rounded-lg flex flex-col gap-2">
        {/* Renderizado del Header */}
        {header && (
          <div className="header-preview mb-2">
            {header.format === 'IMAGE' && header.example?.header_handle?.[0] && (
              <img src={header.example.header_handle[0]} alt="Header Preview" className="rounded-md w-full h-auto object-cover" />
            )}
            {header.format === 'TEXT' && (
              <p className="font-bold text-gray-900 text-lg">{header.text}</p>
            )}
            {/* Puedes añadir más formatos como VIDEO o DOCUMENT si los usas */}
          </div>
        )}

        {/* Renderizado del Body */}
        {body && (
          <p 
            className="text-sm text-gray-800 break-words"
            dangerouslySetInnerHTML={{ __html: formatBodyText(body.text) }}
          />
        )}
        
        {/* Renderizado del Footer */}
        {footer && (
            <p className="text-xs text-gray-500 mt-2">{footer.text}</p>
        )}
      </div>

      {/* Renderizado de los Botones */}
      {buttons && buttons.buttons.length > 0 && (
        <div className="mt-2 space-y-1 p-1">
          {buttons.buttons.map((btn, index) => (
            <div key={index} className="bg-white text-center text-blue-600 p-2 rounded-lg text-sm border border-gray-200 shadow-sm">
              {btn.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}