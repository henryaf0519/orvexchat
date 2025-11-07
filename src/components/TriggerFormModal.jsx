import React, { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'react-toastify';
import { X, Loader2, Zap } from 'lucide-react';
import TriggerPreview from './TriggerPreview'; // <-- 1. Importar la vista previa

export default function TriggerFormModal({ isOpen, onClose, trigger }) {
  
  // --- 2. ACTUALIZAR ESTADO INICIAL ---
  const [formData, setFormData] = useState({
    name: '',
    flow_id: '',
    screen_id: '',
    flow_cta: '',
    header_text: '', // <-- Nuevo
    body_text: '',   // <-- Nuevo
    footer_text: '', // <-- Nuevo
  });
  const [isLoading, setIsLoading] = useState(false);

  const flows = useChatStore((state) => state.flows);
  const createNewTrigger = useChatStore((state) => state.createNewTrigger);
  const updateTrigger = useChatStore((state) => state.updateTrigger);

  const isEditing = !!trigger; 

  const publishedFlows = useMemo(() => {
    return flows.filter(flow => flow.status === 'PUBLISHED');
  }, [flows]);

  // --- 3. ACTUALIZAR useEffect ---
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: trigger.name || '',
        flow_id: trigger.flow_id || '',
        screen_id: trigger.screen_id || '',
        flow_cta: trigger.flow_cta || '',
        header_text: trigger.header_text || '', // <-- Nuevo
        body_text: trigger.body_text || '',   // <-- Nuevo
        footer_text: trigger.footer_text || '', // <-- Nuevo
      });
    } else {
      // Resetea el form si es modo creación
      setFormData({ 
        name: '', flow_id: '', screen_id: '', flow_cta: '',
        header_text: '', body_text: '', footer_text: '' 
      });
    }
  }, [trigger, isEditing, isOpen]); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- 4. AÑADIR VALIDACIÓN (basado en el backend que sugerí) ---
    if (!formData.header_text || !formData.body_text || !formData.footer_text) {
        toast.error('Por favor completa los campos de Header, Body y Footer.');
        return;
    }
    
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateTrigger(trigger.trigger_id, formData);
        toast.success(`Trigger "${formData.name}" actualizado`);
      } else {
        await createNewTrigger(formData);
        toast.success(`Trigger "${formData.name}" creado`);
      }
      onClose(); // Cierra el modal
    } catch (error) {
      toast.error(error.message || 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      {/* --- 5. AUMENTAR EL TAMAÑO DEL MODAL --- */}
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" // <-- De max-w-lg a max-w-4xl y scroll
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Cabecera del Modal */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="text-blue-600" />
              {isEditing ? 'Editar Trigger' : 'Crear Nuevo Trigger'}
            </h3>
            <button
              type="button" onClick={onClose} disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 rounded-full p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* --- 6. IMPLEMENTAR LAYOUT DE 2 COLUMNAS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- COLUMNA 1: FORMULARIO --- */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">1. Configuración Interna</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Ej: Trigger de Bienvenida"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Flujo (Flow)</label>
                <select
                  name="flow_id" value={formData.flow_id} onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  required disabled={isLoading}
                >
                  <option value="" disabled>-- Selecciona un flujo publicado --</option>
                  {publishedFlows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Screen ID (Pantalla de inicio)</label>
                <input
                  type="text" name="screen_id" value={formData.screen_id} onChange={handleChange}
                  placeholder="Ej: PANTALLA_INICIO (del JSON del flujo)"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                  required disabled={isLoading}
                />
              </div>

              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 pt-4">2. Contenido del Mensaje</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Header (Encabezado)</label>
                <input
                  type="text" name="header_text" value={formData.header_text} onChange={handleChange}
                  placeholder="Ej: Bienvenido a Afiliamos"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required disabled={isLoading} maxLength={60}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Body (Cuerpo)</label>
                <textarea
                  name="body_text" value={formData.body_text} onChange={handleChange}
                  placeholder="Ej: ¡Hola! Toca el botón de abajo..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                  required disabled={isLoading} maxLength={1024}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Footer (Pie de página)</label>
                <input
                  type="text" name="footer_text" value={formData.footer_text} onChange={handleChange}
                  placeholder="Ej: Tu aliado en seguridad social."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required disabled={isLoading} maxLength={60}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Texto CTA (Botón)</label>
                <input
                  type="text" name="flow_cta" value={formData.flow_cta} onChange={handleChange}
                  placeholder="Ej: Abrir Menú"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required disabled={isLoading} maxLength={20}
                />
              </div>
            </div>

            {/* --- COLUMNA 2: VISTA PREVIA --- */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 text-center">Vista Previa</h4>
              <div className="bg-[#ECE5DD] p-4 rounded-lg min-h-[400px] flex items-center justify-center sticky top-0">
                <TriggerPreview 
                  header={formData.header_text}
                  body={formData.body_text}
                  footer={formData.footer_text}
                  cta={formData.flow_cta}
                />
              </div>
            </div>

          </div>

          {/* Botones de Acción */}
          <div className="mt-8 pt-6 border-t flex justify-end gap-3">
            <button
              type="button" onClick={onClose} disabled={isLoading}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={isLoading}
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                isEditing ? 'Guardar Cambios' : 'Crear Trigger'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}