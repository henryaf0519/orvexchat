import React, { useState, useEffect } from 'react';
import { Smartphone, Image as ImageIcon, Type, MessageSquare, Phone, Globe, CornerUpRight } from 'lucide-react';

// Función de ayuda para renderizar texto con variables y saltos de línea
const formatText = (text) => {
  if (!text) return { __html: '' };
  // Reemplaza {{1}} por un span estilizado y \n por <br />
  const html = text
    .replace(/{{(\d+)}}/g, '<span class="bg-blue-200 text-blue-800 font-medium px-1 rounded-sm">[{{$1}}]</span>')
    .split('\n').join('<br />');
  return { __html: html };
};

export default function TemplatePreview({ data, template }) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Hook para gestionar la previsualización de la imagen cargada desde el formulario
  useEffect(() => {
    // Si estamos en modo formulario, el encabezado es una imagen y hay un archivo seleccionado
    if (data && data.headerType === 'IMAGE' && data.headerBase64 instanceof File) {
      const objectUrl = URL.createObjectURL(data.headerBase64);
      setImagePreviewUrl(objectUrl);

      // Función de limpieza para liberar memoria cuando el componente se desmonte o el archivo cambie
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      // Si no se cumple la condición, se limpia la URL de previsualización
      setImagePreviewUrl(null);
    }
    // El efecto se ejecuta solo si cambia el tipo de encabezado o el archivo
  }, [data?.headerType, data?.headerBase64]);


  let header, body, footer, buttons;
  // Imagen por defecto
  let imageUrl = 'https://via.placeholder.com/600x314.png?text=Imagen';

  if (data) { // MODO FORMULARIO: Los datos vienen del estado del formulario
    header = { format: data.headerType, text: data.headerText };
    body = { text: data.bodyText };
    footer = data.footerText ? { text: data.footerText } : null;
    buttons = data.buttons.length > 0 ? { buttons: data.buttons } : null;
    
    // Si el encabezado es una imagen y tenemos una URL de previsualización, la usamos
    if (header.format === 'IMAGE' && imagePreviewUrl) {
      imageUrl = imagePreviewUrl;
    // Si no hay archivo nuevo pero sí una URL existente (modo edición)
    } else if (data.headerImageUrl) {
      imageUrl = data.headerImageUrl;
    }
  } else if (template) { // MODO API: Los datos vienen de una plantilla seleccionada de la lista
    header = template.components.find(c => c.type === 'HEADER');
    body = template.components.find(c => c.type === 'BODY');
    footer = template.components.find(c => c.type === 'FOOTER');
    buttons = template.components.find(c => c.type === 'BUTTONS');
    
    // Si el encabezado es una imagen y tiene una URL de Meta, la usamos
    if (header?.format === 'IMAGE' && header.example?.header_handle?.[0]) {
      imageUrl = header.example.header_handle[0];
    }
  }

  // Si no hay ni `data` ni `template`, no se muestra nada
  if (!data && !template) {
    return (
      <div className="w-full max-w-[320px] bg-white p-4 rounded-lg shadow-lg border border-gray-200 sticky top-6 flex items-center justify-center h-96">
        <p className="text-gray-500 text-center">Selecciona una plantilla para ver la vista previa.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[320px] bg-white p-1 rounded-lg shadow-lg border border-gray-200 sticky top-6">
      {/* Contenedor del mensaje tipo WhatsApp */}
      <div className="bg-[#E1F7CB] p-3 rounded-lg flex flex-col gap-2">
        {/* Renderizado del Encabezado */}
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

        {/* Renderizado del Cuerpo */}
        {body && <p className="text-sm text-gray-800 break-words" dangerouslySetInnerHTML={formatText(body.text)} />}
        
        {/* Renderizado del Pie de Página */}
        {footer && <p className="text-xs text-gray-500 mt-2">{footer.text}</p>}
      </div>

      {/* Renderizado de los Botones */}
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