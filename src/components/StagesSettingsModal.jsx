import React, { useState } from 'react';
import { FaTrash, FaPlus, FaSave, FaTimes, FaLock } from 'react-icons/fa';
import { useChatStore } from '../store/chatStore';

export default function StagesSettingsModal({ onClose }) {
  const stages = useChatStore((state) => state.stages);
  const saveStages = useChatStore((state) => state.saveStages);
  
  const [localStages, setLocalStages] = useState(JSON.parse(JSON.stringify(stages)));

  const handleChange = (index, field, value) => {
    const updated = [...localStages];
    updated[index] = { ...updated[index], [field]: value };
    setLocalStages(updated);
  };

  const handleDelete = (index) => {
    const updated = localStages.filter((_, i) => i !== index);
    setLocalStages(updated);
  };

  const handleAdd = () => {
    setLocalStages([
      ...localStages,
      { 
        id: `temp_${Date.now()}`, 
        name: "", 
        color: "#000000", 
        isSystem: false 
      }
    ]);
  };

  const handleSave = () => {
    // ✅ LÓGICA AGRESIVA: REGENERAR SIEMPRE EL ID
    const processedStages = localStages.map(stage => {
      // 1. Si es del sistema, NO la tocamos (son sagradas)
      if (stage.isSystem) return stage;

      // 2. Para TODAS las demás (nuevas o viejas), forzamos el ID igual al nombre
      // Ejemplo: "Venta VIP" -> "venta_vip"
      const cleanId = stage.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_') // Espacios y símbolos a guión bajo
        .replace(/^_+|_+$/g, '');   // Quitar guiones extra

      // Si el nombre está vacío, usamos un fallback, si no, usamos el ID generado
      const finalId = cleanId || `stage_${Date.now()}`;
      
      // Devolvemos la etapa con el ID actualizado
      return { ...stage, id: finalId };
    });

    saveStages(processedStages);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Configurar Etapas del CRM</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
              <div className="col-span-6">Nombre de la Etapa</div>
              <div className="col-span-4 text-center">Color</div>
              <div className="col-span-2 text-center">Acción</div>
            </div>

            {localStages.map((stage, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                
                {/* Input Nombre */}
                <div className="col-span-6">
                  <input 
                    type="text" 
                    value={stage.name} 
                    placeholder="Nombre de la etapa"
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    disabled={stage.isSystem}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${stage.isSystem ? 'bg-gray-100 text-gray-500 cursor-not-allowed font-semibold' : 'bg-white'}`}
                  />
                  {/* Feedback visual del cambio de ID */}
                </div>

                {/* Color Picker */}
                <div className="col-span-4 flex justify-center">
                    <div className="relative flex items-center gap-2 group cursor-pointer">
                        <div 
                            className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-inner"
                            style={{ backgroundColor: stage.color }}
                        ></div>
                        <span className="text-xs font-mono text-gray-500 uppercase group-hover:text-gray-800">
                            {stage.color}
                        </span>
                        <input
                            type="color"
                            value={stage.color}
                            onChange={(e) => handleChange(index, 'color', e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Botón Eliminar */}
                <div className="col-span-2 flex justify-center">
                  {stage.isSystem ? (
                    <FaLock className="text-gray-300" title="Etapa del sistema" />
                  ) : (
                    <button 
                      onClick={() => handleDelete(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="Eliminar etapa"
                    >
                      <FaTrash size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleAdd}
            className="mt-6 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
          >
            <FaPlus /> Añadir Nueva Etapa
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <FaSave /> Forzar Actualización de IDs
          </button>
        </div>
      </div>
    </div>
  );
} 