import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const CharCounter = ({ value = '', max }) => (
  <span className={`text-xs font-mono ${value.length > max ? 'text-red-500' : 'text-gray-400'}`}>
    {value.length}/{max}
  </span>
);

export default function CreateTemplateForm({ formData, setFormData, handleSubmit, isLoading, isEditing }) {
  const {
    name, category, language,
    headerType, headerText, headerExample,
    bodyText, bodyExamples, footerText, buttons
  } = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, headerBase64: file || null }));
  };
  
  const handleBodyExampleChange = (index, value) => {
    const newExamples = [...bodyExamples];
    newExamples[index] = value;
    setFormData(prev => ({ ...prev, bodyExamples: newExamples }));
  };

  const addButton = () => {
    if (buttons.length < 5) {
      setFormData(prev => ({
        ...prev,
        buttons: [...prev.buttons, { type: 'QUICK_REPLY', text: '' }]
      }));
    }
  };

  const removeButton = (index) => {
    setFormData(prev => ({ ...prev, buttons: prev.buttons.filter((_, i) => i !== index) }));
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    const button = { ...newButtons[index], [field]: value };
    if (field === 'type') {
      delete button.url;
      delete button.phone_number;
      if (value === 'URL') button.url = 'https://';
      if (value === 'PHONE_NUMBER') button.phone_number = '';
    }
    newButtons[index] = button;
    setFormData(prev => ({ ...prev, buttons: newButtons }));
  };

  const bodyVariableCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-md bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">Información Básica</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de la Plantilla</label>
            <input type="text" name="name" value={name} onChange={handleInputChange} disabled={isEditing} className="mt-1 w-full px-4 py-2 border rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed" placeholder="ejemplo_de_promo_verano" required />
            <p className="text-xs text-gray-500 mt-1">Solo minúsculas, números y guiones bajos. No se puede cambiar después de crear.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select name="category" value={category} onChange={handleInputChange} disabled={isEditing} className="mt-1 w-full px-4 py-2 border rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed">
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utilidad</option>
                <option value="AUTHENTICATION">Autenticación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Idioma</label>
              <select name="language" value={language} onChange={handleInputChange} disabled={isEditing} className="mt-1 w-full px-4 py-2 border rounded-lg disabled:bg-gray-200 disabled:cursor-not-allowed">
                <option value="es">Español</option>
                <option value="es_MX">Español (México)</option>
                <option value="en_US">Inglés (US)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- El resto del formulario no necesita cambios --- */}
      <div className="p-4 border rounded-md bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-lg text-gray-800">Encabezado (Opcional)</label>
          {headerType === 'TEXT' && <CharCounter value={headerText} max={60} />}
        </div>
        <select name="headerType" value={headerType} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50">
          <option value="NONE">Sin Encabezado</option>
          <option value="TEXT">Texto</option>
          <option value="IMAGE">Imagen</option>
        </select>
        {headerType === 'TEXT' && (
          <div className="mt-4 space-y-2">
            <input type="text" name="headerText" value={headerText} onChange={handleInputChange} maxLength="60" className="w-full px-4 py-2 border rounded-lg" placeholder="Usa {{1}} para una variable." />
            {headerText.includes('{{') && <input type="text" name="headerExample" value={headerExample} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-gray-50" placeholder="Ejemplo para la variable {{1}}" />}
          </div>
        )}
        {headerType === 'IMAGE' && (
          <div className="mt-4">
            <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        )}
      </div>

      <div className="p-4 border rounded-md bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-lg text-gray-800">Cuerpo del Mensaje</label>
          <CharCounter value={bodyText} max={1024} />
        </div>
        <textarea name="bodyText" value={bodyText} onChange={handleInputChange} maxLength="1024" className="w-full mt-2 px-4 py-2 border rounded-lg" rows="5" placeholder="Escribe tu mensaje. Usa {{1}}, {{2}} para variables." required />
        {bodyVariableCount > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-600">Ejemplos para las variables del cuerpo:</p>
            {Array.from({ length: bodyVariableCount }).map((_, i) => (
              <input key={i} type="text" value={bodyExamples[i] || ''} onChange={(e) => handleBodyExampleChange(i, e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50" placeholder={`Ejemplo para {{${i + 1}}}`} required />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border rounded-md bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-lg text-gray-800">Pie de Página (Opcional)</label>
          <CharCounter value={footerText} max={60} />
        </div>
        <input type="text" name="footerText" value={footerText} onChange={handleInputChange} maxLength="60" className="w-full mt-2 px-4 py-2 border rounded-lg" placeholder="Texto corto y sutil" />
      </div>

      <div className="p-4 border rounded-md bg-white shadow-sm">
        <label className="font-semibold text-lg text-gray-800">Botones (Opcional, máx. 5)</label>
        <div className="space-y-4 mt-4">
          {buttons.map((button, index) => (
            <div key={index} className="p-3 bg-gray-50 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-sm text-gray-600">Botón {index + 1}</p>
                <button type="button" onClick={() => removeButton(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={button.type} onChange={(e) => handleButtonChange(index, 'type', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="QUICK_REPLY">Respuesta Rápida</option>
                  <option value="URL">Visitar Sitio Web</option>
                  <option value="PHONE_NUMBER">Llamar</option>
                </select>
                <input type="text" placeholder="Texto del botón" value={button.text} onChange={(e) => handleButtonChange(index, 'text', e.target.value)} maxLength="25" className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              {button.type === 'URL' && <input type="text" placeholder="https://ejemplo.com" value={button.url} onChange={(e) => handleButtonChange(index, 'url', e.target.value)} className="w-full mt-2 px-3 py-2 border rounded-md text-sm" />}
              {button.type === 'PHONE_NUMBER' && <input type="text" placeholder="+573001234567" value={button.phone_number} onChange={(e) => handleButtonChange(index, 'phone_number', e.target.value)} className="w-full mt-2 px-3 py-2 border rounded-md text-sm" />}
            </div>
          ))}
        </div>
        {buttons.length < 5 && (
          <button type="button" onClick={addButton} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
            <Plus size={16} /> Añadir Botón
          </button>
        )}
      </div>

      <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400">
        {isLoading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear y Enviar a Revisión')}
      </button>
    </form>
  );
}