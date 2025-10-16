// src/components/TemplatePreview.jsx
import React, { useState, useEffect } from 'react';
import { Image, Type, Phone, Globe, MessageSquare } from 'lucide-react';

const formatText = (text) => {
  if (!text) return { __html: '' };
  const html = text
    .replace(/{{(\d+)}}/g, '<span class="bg-blue-200 text-blue-800 font-medium px-1 rounded-sm">[{{$1}}]</span>')
    .split('\n').join('<br />');
  return { __html: html };
};

export default function TemplatePreview({ data, template }) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // ✅ HOOK CORREGIDO
  useEffect(() => {
    // Solo creamos una URL de previsualización si existe un archivo para mostrar
    if (data && data.headerType === 'IMAGE' && data.headerBase64 instanceof File) {
      const objectUrl = URL.createObjectURL(data.headerBase64);
      setImagePreviewUrl(objectUrl);

      // La función de limpieza se encarga de revocar la URL cuando ya no es necesaria
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      // Si no hay archivo o el tipo de encabezado no es imagen, nos aseguramos de limpiar la previsualización
      setImagePreviewUrl(null);
    }
    // Usamos dependencias más específicas para evitar que el efecto se ejecute innecesariamente
  }, [data?.headerType, data?.headerBase64]);


  let header, body, footer, buttons;
  let imageUrl = 'https://via.placeholder.com/600x314.png?text=Imagen';

  if (data) { // Modo Formulario
    header = { format: data.headerType, text: data.headerText };
    body = { text: data.bodyText };
    footer = data.footerText ? { text: data.footerText } : null;
    buttons = data.buttons.length > 0 ? { buttons: data.buttons } : null;
    
    if (header.format === 'IMAGE' && imagePreviewUrl) {
      imageUrl = imagePreviewUrl;
    }
  } else if (template) { // Modo API (plantilla existente)
    header = template.components.find(c => c.type === 'HEADER');
    body = template.components.find(c => c.type === 'BODY');
    footer = template.components.find(c => c.type === 'FOOTER');
    buttons = template.components.find(c => c.type === 'BUTTONS');
    
    if (header?.format === 'IMAGE' && header.example?.header_handle?.[0]) {
      imageUrl = header.example.header_handle[0];
    }
  } else {
    return <p className="text-gray-500 text-center">Selecciona una plantilla para ver la vista previa.</p>;
  }


  return (
    <div className="w-full max-w-[320px] bg-white p-1 rounded-lg shadow-lg border border-gray-200 sticky top-6">
      <div className="bg-[#E1F7CB] p-3 rounded-lg flex flex-col gap-2">
        {header && header.format !== 'NONE' && (
          <div className="header-preview mb-2 rounded-md overflow-hidden">
            {header.format === 'IMAGE' && (
              <img src={imageUrl} alt="Preview" className="w-full h-auto object-cover" />
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