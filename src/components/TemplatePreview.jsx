// src/components/TemplatePreview.jsx
import React from 'react';
import { Image, Type, Phone, Globe, MessageSquare } from 'lucide-react';

const formatText = (text) => {
  if (!text) return { __html: '' };
  const html = text
    .replace(/{{(\d+)}}/g, '<span class="bg-blue-200 text-blue-800 font-medium px-1 rounded-sm">[{{$1}}]</span>')
    .split('\n').join('<br />');
  return { __html: html };
};

export default function TemplatePreview({ data, template }) {
  let header, body, footer, buttons;

  if (data) { // Modo Formulario
    header = {
      format: data.headerType,
      text: data.headerText,
      example: { header_handle: [data.headerBase64] }
    };
    body = { text: data.bodyText };
    footer = data.footerText ? { text: data.footerText } : null;
    buttons = data.buttons.length > 0 ? { buttons: data.buttons } : null;
  } else if (template) { // Modo API
    header = template.components.find(c => c.type === 'HEADER');
    body = template.components.find(c => c.type === 'BODY');
    footer = template.components.find(c => c.type === 'FOOTER');
    buttons = template.components.find(c => c.type === 'BUTTONS');
  } else {
    return <p className="text-gray-500 text-center">Selecciona una plantilla para ver la vista previa.</p>;
  }

  return (
    <div className="w-full max-w-[320px] bg-white p-1 rounded-lg shadow-lg border border-gray-200 sticky top-6">
      <div className="bg-[#E1F7CB] p-3 rounded-lg flex flex-col gap-2">
        {header && header.format !== 'NONE' && (
          <div className="header-preview mb-2 rounded-md overflow-hidden">
            {header.format === 'IMAGE' && (
              <img src={header.example?.header_handle?.[0] || 'https://via.placeholder.com/600x314.png?text=Imagen'} alt="Preview" className="w-full h-auto object-cover" />
            )}
            {header.format === 'TEXT' && (
              <p className="font-bold text-gray-900 text-lg" dangerouslySetInnerHTML={formatText(header.text)} />
            )}
          </div>
        )}
        {body && <p className="text-sm text-gray-800 break-words" dangerouslySetInnerHTML={formatText(body.text)} />}
        {footer && <p className="text-xs text-gray-500 mt-2">{footer.text}</p>}
      </div>
      {buttons && buttons.buttons.length > 0 && (
        <div className="mt-1 space-y-1">
          {buttons.buttons.map((btn, index) => (
            <div key={index} className="bg-white text-center text-blue-600 p-2 rounded-lg text-sm border-t border-gray-200 flex items-center justify-center gap-2">
              {btn.type === 'URL' && <Globe size={16} />}
              {btn.type === 'PHONE_NUMBER' && <Phone size={16} />}
              {btn.type === 'QUICK_REPLY' && <MessageSquare size={16} />}
              <span>{btn.text || "Texto del botón"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}