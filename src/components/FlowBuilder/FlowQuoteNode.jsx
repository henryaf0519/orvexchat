// src/components/FlowQuoteNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { FaTrash, FaPen, FaTimes, FaPlus, FaFileInvoiceDollar, FaDotCircle, FaServer } from 'react-icons/fa';

const nodeClasses = "relative bg-white border border-teal-400 rounded-xl w-[350px] shadow-lg font-sans";
const headerClasses = "flex items-center justify-between bg-teal-50 border-b border-teal-300 py-2.5 px-4 rounded-t-xl font-semibold relative";
const bodyClasses = "p-4 space-y-4 max-h-[450px] overflow-y-auto";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-teal-600 text-white border-2 border-teal-700 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400";
const textInputClasses = "w-full border border-gray-300 rounded p-1.5 text-sm bg-white";
const textAreaClasses = "w-full border border-gray-300 rounded p-1.5 text-sm min-h-[60px] max-h-[200px] overflow-y-auto resize-none bg-white";
const componentContainerClasses = "border border-dashed border-gray-200 rounded-lg p-2.5 relative bg-gray-50";

export default function FlowQuoteNode({ data, id }) {
  // Inicialización segura de la configuración
  const config = {
    serviceName: 'cotizar',
    ...data.config
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = name === 'title' ? value.replace(/[^a-zA-Z\s]/g, '') : value;
    data.updateNodeData(id, { ...data, [name]: finalValue });
  };

  // ✅ Actualiza las propiedades dentro del objeto anidado config
  const handleConfigChange = (key, value) => {
    data.updateNodeData(id, {
      ...data,
      config: { ...config, [key]: value }
    });
  };

  const addOption = () => {
    const newOptions = [...(data.radioOptions || []), { id: `plan_${Date.now()}`, title: '' }];
    data.updateNodeData(id, { ...data, radioOptions: newOptions });
  };

  const updateOption = (index, value) => {
    const newOptions = [...data.radioOptions];
    newOptions[index] = { ...newOptions[index], title: value };
    data.updateNodeData(id, { ...data, radioOptions: newOptions });
  };

  const removeOption = (indexToRemove) => {
    const newOptions = (data.radioOptions || []).filter((_, i) => i !== indexToRemove);
    data.updateNodeData(id, { ...data, radioOptions: newOptions });
  };

  return (
    <>
      <style>{`
        .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .custom-handle:hover { transform: scale(1.15); background: #319795; border-color: #285e61; }
        .editable-container:hover .edit-icon { display: inline-block; }
        .edit-icon { display: none; margin-left: 5px; color: #9ca3af; }
        .clickable-icon:hover { background-color: #f3f4f6; border-radius: 50%;}
      `}</style>

      <div className={nodeClasses}>
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-32px'}} id={`${id}-target`}/>

        {/* Cabecera */}
        <div className={headerClasses}>
          <div className="editable-container flex-1 relative flex items-center">
            <FaFileInvoiceDollar className="mr-2 text-teal-600" />
            <input
              name="title"
              value={data.title || ''}
              onChange={handleChange}
              placeholder="Consumo de Servicio..."
              className="editable-field flex-grow bg-transparent focus:outline-none font-semibold text-gray-800"
            />
            <FaPen className="edit-icon" size={12}/>
          </div>
          <button onClick={() => data.deleteNode(id)} className="clickable-icon text-gray-500" title="Eliminar pantalla">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className={bodyClasses}>
             
             {/* ✅ SECCIÓN TÉCNICA: NOMBRE DEL SERVICIO (Invisible en WhatsApp) */}
             <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <label className="text-xs font-bold text-teal-800 flex items-center gap-1.5 mb-1 uppercase">
                    <FaServer size={11} /> Servicio Backend a ejecutar
                </label>
                <input
                    type="text"
                    value={config.serviceName}
                    onChange={(e) => handleConfigChange('serviceName', e.target.value)}
                    placeholder="Ej: cotizar, verificar_estado, liquidar_seguro"
                    className="w-full border border-teal-300 rounded p-1.5 text-xs font-mono bg-white text-teal-900 focus:ring-1 focus:ring-teal-400 focus:outline-none"
                />
                <p className="text-[10px] text-teal-600 mt-1 italic">
                    * Solo lo lee el sistema en AWS. No cambia el diseño de WhatsApp.
                </p>
             </div>

             <div>
                 <label className="text-xs font-medium text-gray-500 block mb-1">Texto Introductorio de la Pantalla</label>
                 <textarea
                    name="introText"
                    value={data.introText || ''}
                    onChange={handleChange}
                    placeholder="Ej: Procesando tu solicitud..."
                    className={textAreaClasses}
                 />
            </div>
             
             {/* Inyección de la variable obligatoria details */}
             <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-800">Cuerpo Dinámico (Retorno del servicio)</p>
                <p className="text-sm text-gray-800 font-mono bg-white p-1 rounded mt-1 shadow-inner">${'{data.details}'}</p>
             </div>

             {/* Selección interactiva */}
             <div className={componentContainerClasses}>
                <label className="text-xs font-bold text-gray-600 uppercase mb-2 block flex items-center gap-1">
                    <FaDotCircle /> Opciones Disponibles
                </label>
                <input
                    name="radioLabel"
                    value={data.radioLabel || ''}
                    onChange={handleChange}
                    placeholder="Título del grupo (Ej: Elige una opción)"
                    className={`${textInputClasses} mb-2 font-semibold`}
                />
                
                {(data.radioOptions || []).map((opt, index) => {
                    const handleId = `${id}-quote-option-${index}`;
                    return (
                    <div key={opt.id} className="flex items-center gap-1 mb-2 relative">
                        <input
                            value={opt.title}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Opción ${index + 1}`}
                            className={textInputClasses}
                        />
                        <button onClick={() => removeOption(index)} className="text-red-500 hover:text-red-700 p-1 mr-4">
                            <FaTrash size={12}/>
                        </button>
                        <Handle type="source" position={Position.Right} id={handleId} className="custom-handle absolute right-[-42px]" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                )})}
                <button onClick={addOption} className="text-xs text-blue-600 mt-1 cursor-pointer flex items-center gap-1 hover:text-blue-800">
                    <FaPlus size={10}/> Añadir Opción
                </button>
             </div>
        </div>

        {/* Footer */}
        <div className={footerClasses}>
          <div className="editable-container relative">
            <input
              name="footer_label"
              value={data.footer_label || 'Continuar'}
              onChange={handleChange}
              className={footerInputClasses}
            />
            <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7, right: '15px'}}/>
          </div>
          <button
            onClick={() => data.openPreviewModal({ ...data, type: 'quoteNode' })} 
            className="w-full bg-white text-teal-600 border border-teal-400 py-2.5 rounded-lg font-semibold text-sm hover:bg-teal-50 transition-colors mt-2"
          >
            Vista Previa
          </button>
          
          <Handle type="source" position={Position.Right} id={`${id}-source`} className="custom-handle" style={{ top: 'auto', bottom: '15px' }} />
        </div>
      </div>
    </>
  );
}