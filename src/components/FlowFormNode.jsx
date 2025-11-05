// src/components/FlowFormNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { FaTrash, FaPen, FaTimes, FaPlus, FaKeyboard } from 'react-icons/fa';

// --- Estilos (reutilizados de tus otros nodos) ---
const nodeClasses = "relative bg-white border border-yellow-400 rounded-xl w-[350px] shadow-lg font-sans";
const headerClasses = "flex items-center justify-between bg-yellow-50 border-b border-yellow-300 py-2.5 px-4 rounded-t-xl font-semibold relative";
const bodyClasses = "p-4 max-h-[400px] overflow-y-auto";
const componentContainerClasses = "border border-dashed border-gray-200 rounded-lg p-2.5 my-2.5 relative";
const componentHeaderClasses = "text-[10px] font-bold text-gray-400 uppercase mb-1";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-green-500 text-white border-2 border-green-600 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-green-400";
const textInputClasses = "w-full border border-gray-200 rounded p-1 text-sm";
// ✅ --- INICIO CAMBIO: Estilo para el nuevo textarea ---
const textAreaClasses = "w-full border border-gray-300 rounded p-1.5 text-sm min-h-[60px] resize-none bg-white";
// ✅ --- FIN CAMBIO ---
const clickableIconClasses = "clickable-icon p-1 text-gray-500 hover:text-black cursor-pointer";
const deleteComponentBtnClasses = "delete-component-btn absolute top-1 right-1 bg-white rounded-full border border-gray-300 w-5 h-5 flex items-center justify-center cursor-pointer text-red-500 hover:bg-red-500 hover:text-white shadow-sm";
// --- Fin Estilos ---

export default function FlowFormNode({ data, id }) {
  // Función genérica para actualizar campos del nodo (title, footer_label, introText)
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'title') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    data.updateNodeData(id, { ...data, [name]: finalValue });
  };

  // --- Funciones para los campos del formulario ---

  // 'addField' ahora incluye 'required: true' por defecto
  const addField = () => {
    const newField = {
      type: 'TextInput', // Coherente con PreviewModal
      id: `field_${(data.components?.length || 0) + 1}`,
      label: '', // Ej: "Nombre"
      name: '',  // Ej: "name"
      required: true // Por defecto, el campo es requerido
    };
    const newComponents = [...(data.components || []), newField];
    data.updateNodeData(id, { ...data, components: newComponents });
  };

  // Al cambiar la etiqueta, generamos el 'name' automáticamente
  const handleLabelChange = (index, newLabel) => {
    const newName = newLabel.toLowerCase().replace(/\s+/g, '');
    
    const newComponents = [...data.components];
    if (newComponents[index]) {
      newComponents[index] = { 
        ...newComponents[index], 
        label: newLabel, // Actualiza la etiqueta
        name: newName    // Actualiza el 'name' derivado
      };
      data.updateNodeData(id, { ...data, components: newComponents });
    }
  };

  // Nueva función para cambiar el estado 'required'
  const toggleRequired = (index) => {
    const newComponents = [...data.components];
    if (newComponents[index]) {
      newComponents[index] = { 
        ...newComponents[index], 
        required: !newComponents[index].required // Invierte el valor
      };
      data.updateNodeData(id, { ...data, components: newComponents });
    }
  };


  // Elimina un campo de texto
  const deleteField = (componentIndex) => {
    const newComponents = data.components.filter((_, index) => index !== componentIndex);
    data.updateNodeData(id, { ...data, components: newComponents });
  };

  return (
    <>
      {/* Estilos para Handles (los mismos que en FlowScreenNode) */}
      <style>{`
        .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; right: -32px; display: flex; align-items: center; justify-content: center; }
        .custom-handle::after { content: '+'; font-size: 16px; color: #718096; font-weight: bold; }
        .custom-handle:hover { transform: scale(1.15); background: #48bb78; border-color: #2f855a; }
        .custom-handle:hover::after, .react-flow__handle.connecting::after { color: white; }
        .react-flow__handle.connecting { transform: scale(1.2); background: #e53e3e; border-color: #9b2c2c; }
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
            <FaKeyboard className="mr-2 text-yellow-600" />
            <input
              name="title"
              value={data.title || ''}
              onChange={handleChange}
              placeholder="Título del Formulario..."
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
          {/* ✅ --- INICIO CAMBIO: Campo de Texto Introductorio --- */}
          <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 block mb-1">Texto Introductorio (Opcional)</label>
              <textarea
                name="introText"
                value={data.introText || ''}
                onChange={handleChange}
                placeholder="Ej: Por favor, completa los siguientes datos y un asesor se comunicará contigo ..."
                className={textAreaClasses}
                rows={3}
              />
          </div>
          {/* ✅ --- FIN CAMBIO --- */}

          {(data.components || []).map((field, index) => (
            <div key={field.id || index} className={componentContainerClasses}>
              <button onClick={() => deleteField(index)} className={deleteComponentBtnClasses} title="Eliminar campo">
                <FaTrash size={10} />
              </button>
              
              <span className={`${componentHeaderClasses} mb-1`}>Campo de Texto {index + 1}</span>
              
              <div className="space-y-2">
                {/* 1. Input de Etiqueta */}
                <input
                  value={field.label || ''}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  placeholder="Escribe el nombre del campo (ej: Celular)"
                  className={textInputClasses}
                />
                
                {/* 2. Nuevo Toggle Switch (debajo del input) */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <label 
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                        onClick={() => toggleRequired(index)} // Permite hacer clic en la etiqueta
                    >
                        Requerido
                    </label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={field.required}
                        onClick={() => toggleRequired(index)}
                        className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            field.required ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                    >
                        <span className="sr-only">Marcar como requerido</span>
                        <span
                            aria-hidden="true"
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                field.required ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addField} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-3">
            <FaPlus size={12} /> Añadir Campo
          </button>
        </div>

        {/* Pie de Página (Botón de envío) */}
        <div className={footerClasses}>
          <div className="editable-container relative">
            <input
              name="footer_label"
              value={data.footer_label || 'Enviar Datos'}
              onChange={handleChange}
              placeholder="Texto del botón final..."
              className={footerInputClasses}
            />
            <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7, right: '15px'}}/>
          </div>
          <button
            onClick={() => data.openPreviewModal({ ...data, type: 'formNode' })} // Pasa el tipo para el modal
            className="text-xs text-center text-gray-500 hover:text-blue-600 mt-2 block w-full cursor-pointer"
          >
            Vista Previa
          </button>
        </div>

        {/* Handle de salida (source) */}
        <Handle type="source" position={Position.Right} className="custom-handle" id={`${id}-source`}/>
      </div>
    </>
  );
}