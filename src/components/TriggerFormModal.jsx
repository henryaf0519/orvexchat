import React, { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'react-toastify';
import { X, Loader2, Zap } from 'lucide-react';
import TriggerPreview from './TriggerPreview';
// --- 1. Importar el servicio que SÍ trae el JSON ---
import { getFlowById } from '../services/flowService'; 

export default function TriggerFormModal({ isOpen, onClose, trigger }) {
  
  // --- 2. Eliminar 'screen_id' del estado inicial ---
  const [formData, setFormData] = useState({
    name: '',
    flow_id: '',
    // 'screen_id' ya no se guarda aquí
    flow_cta: '',
    header_text: '', 
    body_text: '',   
    footer_text: '', 
  });
  const [isLoading, setIsLoading] = useState(false);

  const flows = useChatStore((state) => state.flows);
  const createNewTrigger = useChatStore((state) => state.createNewTrigger);
  const updateTrigger = useChatStore((state) => state.updateTrigger);

  const isEditing = !!trigger; 

  const publishedFlows = useMemo(() => {
    return flows.filter(flow => flow.status === 'PUBLISHED');
  }, [flows]);

  // --- 3. Eliminar 'screen_id' del useEffect ---
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: trigger.name || '',
        flow_id: trigger.flow_id || '',
        // 'screen_id' ya no se carga aquí
        flow_cta: trigger.flow_cta || '',
        header_text: trigger.header_text || '', 
        body_text: trigger.body_text || '',   
        footer_text: trigger.footer_text || '', 
      });
    } else {
      setFormData({ 
        name: '', flow_id: '', flow_cta: '',
        header_text: '', body_text: '', footer_text: '' 
      });
    }
  }, [trigger, isEditing, isOpen]); 

  // handleChange ya no necesita la lógica de 'screen_id'
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value 
    }));
  };

  // --- 4. Implementar la LÓGICA CLAVE en handleSubmit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones simples
    if (!formData.flow_id) {
        toast.error('Por favor, selecciona un flujo.');
        return;
    }
    if (!formData.header_text || !formData.body_text || !formData.footer_text) {
        toast.error('Por favor completa los campos de Header, Body y Footer.');
        return;
    }
    
    setIsLoading(true);
    let finalScreenId = ''; // Aquí guardaremos el ID
    
    try {
      // --- Lógica Nueva: Obtener el screen_id ---
      // 1. Llamar al servicio getFlowById
      const flowDetails = await getFlowById(formData.flow_id);
      
      // 2. Extraer el screen_id
      if (flowDetails && flowDetails.flow_json && flowDetails.flow_json.routing_model) {
        finalScreenId = Object.keys(flowDetails.flow_json.routing_model)[0];
        if (!finalScreenId) {
          throw new Error("El 'routing_model' de este flujo está vacío.");
        }
      } else {
        throw new Error("No se pudo encontrar el 'flow_json' o 'routing_model' para este flujo.");
      }
      // --- Fin de Lógica Nueva ---

      // 3. Construir el payload final
      const finalPayload = {
        ...formData,
        screen_id: finalScreenId // Añadimos el ID encontrado
      };
      
      // 4. Llamar a las acciones del store (como antes, pero con el payload final)
      if (isEditing) {
        await updateTrigger(trigger.trigger_id, finalPayload);
        toast.success(`Trigger "${finalPayload.name}" actualizado`);
      } else {
        await createNewTrigger(finalPayload);
        toast.success(`Trigger "${finalPayload.name}" creado`);
      }
      onClose();
      
    } catch (error) {
      // El error puede venir de getFlowById o de create/updateTrigger
      toast.error(error.message || 'Ocurrió un error al guardar');
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
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* ... (Cabecera del modal sin cambios) ... */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- COLUMNA 1: FORMULARIO --- */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">1. Configuración Interna</h4>
              {/* ... (Campo 'name' sin cambios) ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Ej: Trigger de Bienvenida"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required disabled={isLoading}
                />
              </div>
              
              {/* ... (Campo 'flow_id' sin cambios) ... */}
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

              {/* --- 5. ELIMINAR EL CAMPO screen_id DEL FORMULARIO --- */}
              {/* (El campo de 'screen_id' que estaba aquí se ha eliminado) */}

              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 pt-4">2. Contenido del Mensaje</h4>
              {/* ... (Resto de los campos: header, body, footer, cta - sin cambios) ... */}
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

            {/* --- COLUMNA 2: VISTA PREVIA (Sin cambios) --- */}
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

          {/* ... (Botones de Acción sin cambios) ... */}
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