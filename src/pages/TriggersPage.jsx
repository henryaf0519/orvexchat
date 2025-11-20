import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Edit2, Copy, Loader2, Star, LayoutTemplate, Link, Zap, Key } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import TriggerFormModal from '../components/TriggerFormModal';
import TemplateTriggerMapper from '../components/TemplateTriggerMapper';
import MainHeader from '../components/MainHeader';
import MainSidebar from '../components/MainSidebar';

export default function TriggersPage() {
  const { triggers, loadingTriggers, fetchTriggers, flows, fetchFlows } = useChatStore();

  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  
  // Estados para pasar datos al mapeador
  const [mapperInitialTemplate, setMapperInitialTemplate] = useState(null);
  const [mapperInitialId, setMapperInitialId] = useState(null); // ✅ Nuevo estado para ID

  useEffect(() => {
    fetchTriggers();
    if (flows.length === 0) fetchFlows();
  }, []);

  const defaultTrigger = triggers.find(t => t.isActive);
  const buttonTriggers = triggers.filter(t => !t.isActive);

  // ✅ LÓGICA INTELIGENTE DE EDICIÓN ACTUALIZADA
  const handleEdit = (t) => {
      if (t.isActive) {
          setEditingTrigger(t);
          setIsDefaultModalOpen(true);
      } else {
          console.log("Editando botón:", t);

          // 1. Intentamos recuperar el ID de la plantilla (Nuevo Estándar)
          let templateId = t.initial_data?.template_id;
          
          // 2. Fallback: Nombre
          let templateName = t.initial_data?.template_name;
          if (!templateName && t.header_text) templateName = t.header_text;
          if (!templateName && t.name && t.name.includes('_btn_')) {
              templateName = t.name.split('_btn_')[0];
          }

          if (templateId) {
              setMapperInitialId(templateId); // Prioridad al ID
              setMapperInitialTemplate(null); 
              setIsMapperOpen(true);
          } else if (templateName) {
              setMapperInitialTemplate(templateName); // Fallback al nombre
              setMapperInitialId(null);
              setIsMapperOpen(true);
          } else {
              toast.warn("No se detectó la plantilla origen. Selecciónala de nuevo.");
              setMapperInitialId(null);
              setMapperInitialTemplate(null);
              setIsMapperOpen(true);
          }
      }
  };

  const handleOpenDefault = () => {
      setEditingTrigger(null);
      setIsDefaultModalOpen(true);
  };

  const handleOpenMapper = () => {
      setMapperInitialTemplate(null);
      setMapperInitialId(null);
      setIsMapperOpen(true);
  };

  const copyTriggerUrl = (name) => {
    navigator.clipboard.writeText(name);
    toast.success('ID copiado');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Automatización</h1>
                <p className="text-gray-500 mt-1">Gestiona las respuestas automáticas de tu bot.</p>
            </div>
          </div>
          
          {loadingTriggers ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div>
          ) : (
            <div className="space-y-8 max-w-6xl mx-auto">
                
                {/* SECCIÓN 1: SALUDO */}
                <section>
                    <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Star className="text-yellow-500 fill-yellow-500" size={20}/> 
                        Respuesta por Defecto (Saludo)
                    </h2>
                    {defaultTrigger ? (
                        <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm flex items-center justify-between ring-1 ring-yellow-100">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{defaultTrigger.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">Flujo: <span className="font-mono bg-gray-100 px-1 rounded text-black">{defaultTrigger.flow_id}</span></p>
                            </div>
                            <button onClick={() => handleEdit(defaultTrigger)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-white shadow-sm"><Edit2 size={16}/> Editar</button>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 border-dashed rounded-xl p-6 text-center">
                            <button onClick={handleOpenDefault} className="bg-yellow-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-yellow-600 shadow-sm">Configurar Saludo Ahora</button>
                        </div>
                    )}
                </section>

                <hr className="border-gray-200" />

                {/* SECCIÓN 2: PLANTILLAS */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                            <Zap className="text-blue-500" size={20}/> Conexiones de Plantillas
                        </h2>
                        <button onClick={handleOpenMapper} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-md flex items-center gap-2">
                            <Link size={18}/> Conectar Nueva Plantilla
                        </button>
                    </div>

                    {buttonTriggers.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID Interno</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plantilla</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Flujo</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {buttonTriggers.map(t => (
                                        <tr key={t.id || t.trigger_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{t.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <LayoutTemplate size={14} className="text-gray-400"/>
                                                    {/* Mostrar el nombre de la plantilla */}
                                                    <span className="text-sm text-gray-800 font-medium">
                                                        {t.initial_data?.template_name || t.header_text || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{t.flow_id}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => copyTriggerUrl(t.name)} className="text-gray-400 hover:text-blue-600 p-2 mr-2"><Copy size={16}/></button>
                                                <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-blue-600 p-2"><Edit2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                            <p className="text-gray-500">No tienes plantillas conectadas.</p>
                        </div>
                    )}
                </section>

            </div>
          )}
        </main>
      </div>

      {isDefaultModalOpen && <TriggerFormModal isOpen={isDefaultModalOpen} onClose={() => setIsDefaultModalOpen(false)} trigger={editingTrigger} />}
      
      {isMapperOpen && (
        <TemplateTriggerMapper 
            isOpen={isMapperOpen} 
            onClose={() => setIsMapperOpen(false)} 
            initialTemplateName={mapperInitialTemplate}
            initialTemplateId={mapperInitialId} // ✅ Pasamos el ID también
        />
      )}
    </div>
  );
}