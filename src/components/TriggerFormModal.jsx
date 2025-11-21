import React, { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'react-toastify';
import { X, Loader2, Star, MessageCircle } from 'lucide-react';
import TriggerPreview from './TriggerPreview';
import { getFlowById } from '../services/flowService';

export default function TriggerFormModal({ isOpen, onClose, trigger }) {
  const [formData, setFormData] = useState({
    flow_id: '',
    flow_cta: '',
    header_text: '',
    body_text: '',
    footer_text: '',
  });

  // Estado local para errores de validación
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const flows = useChatStore((state) => state.flows);
  const createNewTrigger = useChatStore((state) => state.createNewTrigger);
  const updateTrigger = useChatStore((state) => state.updateTrigger);

  const publishedFlows = useMemo(() => flows.filter(flow => flow.status === 'PUBLISHED'), [flows]);

  useEffect(() => {
    if (trigger) {
      setFormData({
        flow_id: trigger.flow_id || '',
        flow_cta: trigger.flow_cta || '',
        header_text: trigger.header_text || '',
        body_text: trigger.body_text || '',
        footer_text: trigger.footer_text || '',
      });
    } else {
      // Inicializar vacío (sin valores por defecto)
      setFormData({
        flow_id: '',
        flow_cta: '',
        header_text: '',
        body_text: '',
        footer_text: '',
      });
    }
    setErrors({}); // Limpiar errores al abrir
  }, [trigger, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpiar el error del campo mientras el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.flow_id) newErrors.flow_id = 'Campo requerido';
    if (!formData.header_text.trim()) newErrors.header_text = 'Campo requerido';
    if (!formData.body_text.trim()) newErrors.body_text = 'Campo requerido';
    if (!formData.footer_text.trim()) newErrors.footer_text = 'Campo requerido';
    if (!formData.flow_cta.trim()) newErrors.flow_cta = 'Campo requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return; // Detener si hay errores, el usuario los verá en rojo
    }

    setIsLoading(true);
    try {
      const flowDetails = await getFlowById(formData.flow_id);
      const finalScreenId = flowDetails?.flow_json?.routing_model
        ? Object.keys(flowDetails.flow_json.routing_model)[0]
        : 'START';

      const payload = {
        ...formData,
        screen_id: finalScreenId,
        isActive: true,
        name: 'default_welcome_trigger',
        keyword: ''
      };

      if (trigger) {
        await updateTrigger(trigger.id || trigger.trigger_id, payload);
        toast.success('Saludo actualizado');
      } else {
        await createNewTrigger(payload);
        toast.success('Saludo configurado');
      }
      
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para renderizar el mensaje de error debajo del input
  const ErrorMessage = ({ field }) => (
    errors[field] ? <p className="text-red-500 text-xs mt-1 font-medium">{errors[field]}</p> : null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b bg-white shrink-0">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
             <Star className="text-yellow-500 fill-yellow-500" size={28}/>
             {trigger ? 'Editar Saludo Inicial' : 'Configurar Saludo Inicial'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="text-gray-500" size={24} /></button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
                
                {/* FORMULARIO */}
                <div className="space-y-6">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex gap-3">
                        <MessageCircle className="shrink-0"/>
                        <p>Este mensaje se enviará automáticamente cuando un usuario escriba cualquier texto que no sea un botón.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Flujo a Ejecutar</label>
                            <select 
                                name="flow_id" 
                                value={formData.flow_id} 
                                onChange={handleChange} 
                                className={`w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.flow_id ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">-- Selecciona un flujo --</option>
                                {publishedFlows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <ErrorMessage field="flow_id" />
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contenido del Mensaje</h4>
                            
                            <div>
                                <input 
                                    name="header_text" 
                                    value={formData.header_text} 
                                    onChange={handleChange} 
                                    placeholder="Título (Header)" 
                                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.header_text ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                                    maxLength={60} 
                                />
                                <ErrorMessage field="header_text" />
                            </div>

                            <div>
                                <textarea 
                                    name="body_text" 
                                    value={formData.body_text} 
                                    onChange={handleChange} 
                                    placeholder="Mensaje de bienvenida..." 
                                    className={`w-full p-3 border rounded-lg h-28 resize-none outline-none focus:ring-2 focus:ring-blue-500 ${errors.body_text ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                                    maxLength={1024}
                                />
                                <ErrorMessage field="body_text" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input 
                                        name="footer_text" 
                                        value={formData.footer_text} 
                                        onChange={handleChange} 
                                        placeholder="Pie de página" 
                                        className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.footer_text ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                                        maxLength={60}
                                    />
                                    <ErrorMessage field="footer_text" />
                                </div>

                                <div>
                                    <input 
                                        name="flow_cta" 
                                        value={formData.flow_cta} 
                                        onChange={handleChange} 
                                        placeholder="Texto del Botón" 
                                        className={`w-full p-3 border rounded-lg font-medium text-green-800 outline-none focus:ring-2 focus:ring-green-500 ${errors.flow_cta ? 'border-red-500 ring-1 ring-red-500 bg-white' : 'border-green-300 bg-green-50'}`}
                                        maxLength={20} 
                                    />
                                    <ErrorMessage field="flow_cta" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VISTA PREVIA */}
                <div className="h-full">
                    <div className="sticky top-0 bg-[#ECE5DD] rounded-2xl border border-gray-300 shadow-inner p-8 flex flex-col items-center justify-center min-h-[500px]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest text-center">Vista Previa en WhatsApp</h4>
                        <TriggerPreview 
                            header={formData.header_text || "Título"} 
                            body={formData.body_text || "Mensaje de bienvenida..."} 
                            footer={formData.footer_text || "Pie de página"} 
                            cta={formData.flow_cta || "Botón"} 
                        />
                    </div>
                </div>

            </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-white flex justify-end gap-4 shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg flex items-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Star size={20}/>} 
                Guardar Saludo
            </button>
        </div>

      </div>
    </div>
  );
}