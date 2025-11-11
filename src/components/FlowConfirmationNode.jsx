// src/components/FlowConfirmationNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { FaTrash, FaPen, FaTimes, FaCheckCircle } from 'react-icons/fa';

// --- Estilos ---
const nodeClasses = "relative bg-white border border-red-400 rounded-xl w-[350px] shadow-lg font-sans";
const headerClasses = "flex items-center justify-between bg-red-50 border-b border-red-300 py-2.5 px-4 rounded-t-xl font-semibold relative";
const bodyClasses = "p-4 space-y-4";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-red-600 text-white border-2 border-red-700 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-red-400";
const textInputClasses = "w-full border border-gray-300 rounded p-1.5 text-sm bg-white";
const textAreaClasses = "w-full border border-gray-300 rounded p-1.5 text-sm min-h-[100px] max-h-[500px] overflow-y-auto resize-none bg-white";
const clickableIconClasses = "clickable-icon p-1 text-gray-500 hover:text-black cursor-pointer";
// --- Fin Estilos ---

export default function FlowConfirmationNode({ data, id }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'title') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    data.updateNodeData(id, { ...data, [name]: finalValue });
  };

  return (
    <>
      {/* Estilos para Handles */}
      <style>{`
        .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .custom-handle:hover { transform: scale(1.15); background: #48bb78; border-color: #2f855a; }
        .editable-container:hover .edit-icon { display: inline-block; }
        .edit-icon { display: none; margin-left: 5px; color: #9ca3af; }
        .clickable-icon:hover { background-color: #f3f4f6; border-radius: 50%;}
      `}</style>

      <div className={nodeClasses}>
        {/* Handle de entrada (target) */}
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-32px'}} id={`${id}-target`}/>

        {/* Cabecera */}
        <div className={headerClasses}>
          <div className="editable-container flex-1 relative flex items-center">
            <FaCheckCircle className="mr-2 text-red-600" />
            <input
              name="title"
              value={data.title || ''}
              onChange={handleChange}
              placeholder="Título de Confirmación..."
              className="editable-field flex-grow bg-transparent focus:outline-none font-semibold text-gray-800"
            />
            <FaPen className="edit-icon" size={12}/>
          </div>
          <button onClick={() => data.deleteNode(id)} className={clickableIconClasses} title="Eliminar pantalla">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Cuerpo (Editor de campos) */}
        <div className={bodyClasses}>
            <div>
                 <label className="text-xs font-medium text-gray-500 block mb-1">Encabezado (Título)</label>
                 <input
                    name="headingText"
                    value={data.headingText || ''}
                    onChange={handleChange}
                    placeholder="Ej: ¡Todo listo!"
                    className={textInputClasses}
                 />
            </div>
             <div>
                 <label className="text-xs font-medium text-gray-500 block mb-1">Texto (Cuerpo)</label>
                 <textarea
                    name="bodyText"
                    value={data.bodyText || ''}
                    onChange={handleChange}
                    placeholder="Ej: Oprime el boton y un agente..."
                    className={textAreaClasses}
                    rows={3}
                 />
            </div>
             <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs font-semibold text-gray-600">Dato dinámico (Fijo)</p>
                <p className="text-sm text-gray-800 font-mono">${'{data.details}'}</p>
             </div>
        </div>

        {/* Pie de Página (Botón de envío) */}
        <div className={footerClasses}>
          <div className="editable-container relative">
            <input
              name="footer_label"
              value={data.footer_label || 'Finalizar'}
              onChange={handleChange}
              placeholder="Texto del botón final..."
              className={footerInputClasses}
            />
            <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7, right: '15px'}}/>
          </div>
          <button
            onClick={() => data.openPreviewModal({ ...data, type: 'confirmationNode' })} // Pasa el tipo para el modal
            className="w-full bg-white text-blue-600 border border-blue-400 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-2"
              title="Vista Previa"
          >
            Vista Previa
          </button>
        </div>
        
        {/* SIN Handle de salida (source) porque es terminal */}
      </div>
    </>
  );
}