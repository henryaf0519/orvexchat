// src/components/FlowLinkNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { FaPen, FaTimes, FaWhatsapp, FaExternalLinkAlt } from 'react-icons/fa';


const nodeClasses = "relative bg-white border border-emerald-400 rounded-xl w-[350px] shadow-lg font-sans";
const headerClasses = "flex items-center justify-between bg-emerald-50 border-b border-emerald-300 py-2.5 px-4 rounded-t-xl font-semibold relative";
const bodyClasses = "p-4 space-y-4";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-emerald-600 text-white border-2 border-emerald-700 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400";
const textInputClasses = "w-full border border-gray-300 rounded p-1.5 text-sm bg-white";
const textAreaClasses = "w-full border border-gray-300 rounded p-1.5 text-sm min-h-[80px] resize-none bg-white";
const clickableIconClasses = "clickable-icon p-1 text-gray-500 hover:text-black cursor-pointer";

export default function FlowLinkNode({ data, id }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'title') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    data.updateNodeData(id, { ...data, [name]: finalValue });
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    data.updateNodeData(id, { 
      ...data, 
      config: { ...data.config, [name]: value } 
    });
  };

  return (
    <>
      <style>{`
        .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .custom-handle:hover { transform: scale(1.15); background: #48bb78; border-color: #2f855a; }
        .editable-container:hover .edit-icon { display: inline-block; }
        .edit-icon { display: none; margin-left: 5px; color: #9ca3af; }
      `}</style>

      <div className={nodeClasses}>
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-32px'}} id={`${id}-target`}/>

        <div className={headerClasses}>
          <div className="editable-container flex-1 relative flex items-center">
            <FaExternalLinkAlt className="mr-2 text-emerald-600" />
            <input
              name="title"
              value={data.title || ''}
              onChange={handleChange}
              placeholder="Cierre con Link..."
              className="editable-field flex-grow bg-transparent focus:outline-none font-semibold text-gray-800"
            />
            <FaPen className="edit-icon" size={12}/>
          </div>
          <button onClick={() => data.deleteNode(id)} className={clickableIconClasses}>
            <FaTimes size={14} />
          </button>
        </div>

        <div className={bodyClasses}>
            {/* Parte 2: Lo que hace el bot por detrás (Graph API) */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg relative overflow-hidden">
                <FaWhatsapp className="absolute -right-4 -bottom-4 text-green-200 opacity-50" size={80} />
                <span className="text-[10px] font-bold text-green-700 uppercase mb-2 block relative z-10">Acción Post-Flujo (Envío Bot)</span>
                
                <div className="space-y-2 relative z-10">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Texto del Mensaje</label>
                        <textarea 
                            name="wpMessage" 
                            value={data.config?.wpMessage || ''} 
                            onChange={handleConfigChange} 
                            placeholder="Ingresa a este link para acceder..." 
                            className={textAreaClasses} 
                            rows={3} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">URL (Link web)</label>
                        <input 
                            name="wpUrl" 
                            value={data.config?.wpUrl || ''} 
                            onChange={handleConfigChange} 
                            placeholder="https://www.tu-sitio.com/" 
                            className={textInputClasses} 
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className={footerClasses}>
          <div className="editable-container relative">
            <input name="footer_label" value={data.footer_label || 'Terminar'} onChange={handleChange} className={footerInputClasses} />
            <FaPen className="edit-icon" size={12} style={{color: 'white', right: '15px'}}/>
          </div>
        </div>
      </div>
    </>
  );
}