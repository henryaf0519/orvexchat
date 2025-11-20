import React, { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { toast } from 'react-toastify';
import { X, Save, Loader2, LayoutTemplate, ArrowRight, MousePointer, CheckCircle, Link, MessageSquare } from 'lucide-react';
import { getTemplates } from '../services/templateService';
import { getFlowById } from '../services/flowService';
import TriggerPreview from './TriggerPreview';

export default function TemplateTriggerMapper({ isOpen, onClose, initialTemplateName, initialTemplateId }) {
  const flows = useChatStore((state) => state.flows);
  const triggers = useChatStore((state) => state.triggers); 
  const createNewTrigger = useChatStore((state) => state.createNewTrigger);
  const updateTrigger = useChatStore((state) => state.updateTrigger);
  const fetchTriggers = useChatStore((state) => state.fetchTriggers); 
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [buttonMappings, setButtonMappings] = useState({}); 
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const publishedFlows = useMemo(() => flows.filter(f => f.status === 'PUBLISHED'), [flows]);

  // Cargar plantillas y Pre-seleccionar (Por ID o por Nombre)
  useEffect(() => {
    if (isOpen) {
      setLoadingTemplates(true);
      getTemplates()
        .then((data) => {
            const valid = data.filter(t => 
                t.status === 'APPROVED' && 
                t.components.some(c => c.type === 'BUTTONS')
            );
            setTemplates(valid);

            // ✅ ESTRATEGIA DE PRE-SELECCIÓN
            let preSelected = null;

            // 1. Prioridad: Buscar por ID (Nuevo estándar)
            if (initialTemplateId) {
                preSelected = valid.find(t => t.id === initialTemplateId);
            }
            
            // 2. Fallback: Buscar por Nombre (Compatibilidad)
            if (!preSelected && initialTemplateName) {
                const normalizedName = initialTemplateName.trim().toLowerCase();
                preSelected = valid.find(t => t.name.toLowerCase() === normalizedName);
            }

            if (preSelected) {
                setSelectedTemplate(preSelected);
            }
        })
        .catch(() => toast.error("Error cargando plantillas"))
        .finally(() => setLoadingTemplates(false));
    } else {
        setSelectedTemplate(null);
        setButtonMappings({});
    }
  }, [isOpen, initialTemplateName, initialTemplateId]);

  // Auto-detectar configuración existente
  useEffect(() => {
      if (selectedTemplate) {
          const buttons = selectedTemplate.components.find(c => c.type === 'BUTTONS')?.buttons || [];
          const newMappings = {};

          buttons.forEach((btn, idx) => {
              const expectedId = `${selectedTemplate.name}_btn_${idx}`;
              
              const existingTrigger = triggers.find(t => {
                  // 1. Coincidencia por ID DE PLANTILLA (Lo que pediste)
                  const matchId = !t.isActive && 
                                  t.initial_data?.template_id === selectedTemplate.id && 
                                  t.initial_data?.button_index === idx;

                  // 2. Coincidencia por Nombre (Legacy)
                  const matchName = !t.isActive && 
                                    t.initial_data?.template_name === selectedTemplate.name && 
                                    t.initial_data?.button_index === idx;
                  
                  // 3. Coincidencia Legacy pura
                  const matchOld = !t.isActive && t.name === expectedId;
                  
                  return matchId || matchName || matchOld;
              });
              
              if (existingTrigger) {
                  newMappings[idx] = {
                      flow_id: existingTrigger.flow_id,
                      header_text: existingTrigger.header_text,
                      body_text: existingTrigger.body_text,
                      footer_text: existingTrigger.footer_text,
                      flow_cta: existingTrigger.flow_cta,
                      id: existingTrigger.id || existingTrigger.trigger_id,
                      name: existingTrigger.name
                  };
              }
          });
          setButtonMappings(newMappings);
      }
  }, [selectedTemplate, triggers]);

  const updateMapping = (idx, field, value) => {
      setButtonMappings(prev => {
          const current = prev[idx] || { 
              header_text: selectedTemplate?.name || "¡Hola!",
              body_text: "Para continuar, toca el botón de abajo.",
              footer_text: "",
              flow_cta: "Ver"
          };
          return { ...prev, [idx]: { ...current, [field]: value } };
      });
  };

  const handleSaveAll = async () => {
      if (!selectedTemplate) return;
      
      setIsSaving(true);
      const buttons = selectedTemplate.components.find(c => c.type === 'BUTTONS')?.buttons || [];
      let savedCount = 0;
      const baseTimestamp = Date.now();

      try {
          const promises = buttons.map(async (btn, idx) => {
              const mapping = buttonMappings[idx];
              if (!mapping || !mapping.flow_id) return; 

              if (!mapping.header_text || !mapping.body_text || !mapping.flow_cta) {
                  throw new Error(`Faltan datos en el botón "${btn.text}"`);
              }

              // Obtener Screen ID real
              let realScreenId = "START"; 
              try {
                  const flowDetails = await getFlowById(mapping.flow_id);
                  if (flowDetails?.flow_json?.routing_model) {
                      const screens = Object.keys(flowDetails.flow_json.routing_model);
                      if (screens.length > 0) realScreenId = screens[0];
                  }
              } catch (e) { console.warn("No screen details"); }

              // Generar ID del Trigger si es necesario
              let triggerNameID = mapping.name;
              if (!triggerNameID || triggerNameID.includes('_btn_')) {
                  triggerNameID = (baseTimestamp + idx).toString();
              }
              
              const triggerData = {
                  name: triggerNameID,
                  isActive: false,
                  flow_id: mapping.flow_id,
                  flow_cta: mapping.flow_cta,
                  header_text: mapping.header_text,
                  body_text: mapping.body_text,
                  footer_text: mapping.footer_text || "",
                  keyword: btn.text,
                  screen_id: realScreenId,
                  // ✅ GUARDADO CORREGIDO: Usamos template_id
                  initial_data: { 
                      button_index: idx, 
                      template_id: selectedTemplate.id, // <--- ID CRÍTICO
                      template_name: selectedTemplate.name // (Opcional: dejamos el nombre por conveniencia visual en DB)
                  },
                  template_id: selectedTemplate.id

              };

              const existingId = mapping.id;
              
              if (existingId) {
                  await updateTrigger(existingId, triggerData);
              } else {
                  await createNewTrigger(triggerData);
              }
              savedCount++;
          });

          await Promise.all(promises);
          
          if (savedCount > 0) {
              toast.success(`${savedCount} botones configurados correctamente`);
              await fetchTriggers();
              onClose();
          } else {
              toast.warn("No configuraste ningún flujo.");
          }

      } catch (error) {
          console.error(error);
          toast.error(error.message || "Error guardando las conexiones");
      } finally {
          setIsSaving(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-6 border-b bg-white flex justify-between items-center shrink-0">
            <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Link className="text-blue-600" size={28}/>
                    Configurar Botones de Plantilla
                </h3>
                <p className="text-sm text-gray-500">Asigna qué flujo se dispara con cada botón.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-500"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            
            <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <label className="block text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <LayoutTemplate size={20} className="text-blue-500"/> 
                    1. Selecciona la Plantilla
                </label>
                {loadingTemplates ? (
                    <div className="text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin"/> Cargando...</div>
                ) : (
                    <select 
                        className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium text-lg"
                        onChange={(e) => setSelectedTemplate(templates.find(t => t.id === e.target.value))}
                        value={selectedTemplate?.id || ''}
                        // Deshabilitar si ya venimos pre-seleccionados para no cambiar contexto por error
                        disabled={!!initialTemplateId || !!initialTemplateName}
                    >
                        <option value="">-- Busca tu plantilla aprobada --</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.language})</option>)}
                    </select>
                )}
            </div>

            {selectedTemplate ? (
                <div className="space-y-8 animate-fade-in-down">
                    <label className="block text-lg font-bold text-gray-700 flex items-center gap-2 border-b pb-4">
                        <MessageSquare size={20} className="text-green-500"/>
                        2. Configura cada Botón
                    </label>
                    
                    {selectedTemplate.components.find(c => c.type === 'BUTTONS')?.buttons.map((btn, idx) => {
                        const mapping = buttonMappings[idx] || {};
                        const isConfigured = !!mapping.flow_id;

                        const previewData = {
                            header: mapping.header_text || selectedTemplate.name,
                            body: mapping.body_text || "Aquí verás el mensaje de respuesta...",
                            footer: mapping.footer_text || "",
                            cta: mapping.flow_cta || btn.text 
                        };

                        return (
                            <div key={idx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                                <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center gap-4">
                                    <span className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg font-bold text-xs uppercase">Botón {idx + 1}</span>
                                    <span className="font-bold text-gray-900 text-lg">"{btn.text}"</span>
                                    {isConfigured && <CheckCircle className="text-green-500 ml-auto" size={24}/>}
                                </div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-blue-700 mb-1 uppercase">Flujo a Activar</label>
                                            <select 
                                                className="w-full p-3 border-2 border-blue-100 rounded-lg bg-white focus:border-blue-500 font-medium"
                                                value={mapping.flow_id || ''}
                                                onChange={(e) => updateMapping(idx, 'flow_id', e.target.value)}
                                            >
                                                <option value="">👇 Selecciona aquí...</option>
                                                {publishedFlows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>

                                        <div className={`space-y-4 transition-opacity duration-300 ${!mapping.flow_id ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                            <input className="w-full p-3 border rounded-lg" placeholder="Título del mensaje" value={mapping.header_text || ''} onChange={(e) => updateMapping(idx, 'header_text', e.target.value)} maxLength={60}/>
                                            <textarea className="w-full p-3 border rounded-lg h-24 resize-none" placeholder="Mensaje principal..." value={mapping.body_text || ''} onChange={(e) => updateMapping(idx, 'body_text', e.target.value)} maxLength={1024}/>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className="w-full p-3 border rounded-lg" placeholder="Footer" value={mapping.footer_text || ''} onChange={(e) => updateMapping(idx, 'footer_text', e.target.value)} maxLength={60}/>
                                                <input className="w-full p-3 border border-green-300 bg-green-50 rounded-lg font-medium text-green-800" placeholder="Texto Botón" value={mapping.flow_cta || ''} onChange={(e) => updateMapping(idx, 'flow_cta', e.target.value)} maxLength={20}/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center bg-[#ECE5DD] rounded-2xl border border-gray-300 shadow-inner p-6 min-h-[300px]">
                                        <TriggerPreview 
                                            header={previewData.header} 
                                            body={previewData.body} 
                                            footer={previewData.footer} 
                                            cta={previewData.cta} 
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-white opacity-75">
                    <LayoutTemplate className="mx-auto text-gray-300 mb-4" size={64}/>
                    <p className="text-gray-500 text-xl font-medium">Selecciona una plantilla arriba para comenzar.</p>
                </div>
            )}
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-4 shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
            <button onClick={handleSaveAll} disabled={isSaving || !selectedTemplate} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Guardar Configuración
            </button>
        </div>
      </div>
    </div>
  );
}