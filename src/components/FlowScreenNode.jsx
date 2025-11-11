// src/components/FlowScreenNode.jsx

import React, { useState } from 'react'; // Importa useState
import { Handle, Position } from 'reactflow';
import {
    FaTrash, FaPen, FaTimes, FaPlus, FaImage,
    FaKeyboard, FaDotCircle, FaHeading, FaSmile,
    FaThLarge // <-- ✅ ÍCONO AÑADIDO
} from 'react-icons/fa';
import Picker from 'emoji-picker-react'; // Importa el selector de emojis

// --- Estilos de Tailwind (reemplazando los objetos de estilo) ---

// ✅ CAMBIO: Borde azul
const nodeClasses = "relative bg-white border border-blue-400 rounded-xl w-[350px] shadow-lg font-sans"; 
// ✅ CAMBIO: Cabecera azul
const headerClasses = "flex items-center justify-between bg-blue-50 border-b border-blue-300 py-2.5 px-4 rounded-t-xl font-semibold relative"; 
const bodyClasses = "p-4";
const componentContainerClasses = "border border-dashed border-gray-200 rounded-lg p-2.5 my-2.5 relative";
const componentHeaderClasses = "text-[10px] font-bold text-gray-400 uppercase mb-1";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-green-500 text-white border-2 border-green-600 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-green-400";
const textInputClasses = "w-full border border-gray-200 rounded p-1";

// --- Fin Estilos ---


export default function FlowScreenNode({ data, id }) {
  // --- Lógica del Selector de Emojis ---
  const [pickerOpenForIndex, setPickerOpenForIndex] = useState(null);

  const onEmojiClick = (emojiObject) => {
    if (pickerOpenForIndex === null) return;

    const index = pickerOpenForIndex;
    const component = data.components[index];

    if (component.type === 'TextBody') {
      const newText = (component.text || '') + emojiObject.emoji;
      const newComponents = [...data.components];
      newComponents[index] = { ...component, text: newText };
      data.updateNodeData(id, { ...data, components: newComponents });
    }
  };
  // --- Fin Lógica de Emojis ---


  // --- Componentes Internos (con Tailwind) ---
  const renderComponent = (component, index, nodeId, data) => {
      const handleComponentChange = (e) => {
          const { name, value } = e.target;
          const newComponents = [...(data.components || [])];
          newComponents[index] = { ...component, [name]: value };
          data.updateNodeData(nodeId, { ...data, components: newComponents });
      };

      const handleOptionChange = (optionIndex, newTitle) => {
          const newComponents = [...(data.components || [])];
          const newOptions = [...(component.options || [])];
          newOptions[optionIndex] = { ...newOptions[optionIndex], title: newTitle };
          newComponents[index] = { ...component, options: newOptions };
          data.updateNodeData(nodeId, { ...data, components: newComponents });
      };

      const addOption = () => {
          // Genera un ID único basado en el timestamp
          const newId = `opcion_${Date.now()}`; 
          const newOption = { id: newId, title: '' }; // El ID ya está asignado
          const newComponents = [...(data.components || [])];
          newComponents[index] = { ...component, options: [...(component.options || []), newOption] };
          data.updateNodeData(id, { ...data, components: newComponents });
      };

      const removeOption = (optionIndexToRemove) => {
          const newComponents = [...(data.components || [])];
          const newOptions = component.options.filter((_, i) => i !== optionIndexToRemove);
          newComponents[index] = { ...component, options: newOptions };
          data.updateNodeData(id, { ...data, components: newOptions });
      };

      // --- ✅ INICIO MANEJO DE IMAGEN ---
      const handleImageChange = (e) => {
          const file = e.target.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (loadEvent) => {
                  const base64String = loadEvent.target.result;
                  const newComponents = [...(data.components || [])];
                  // Almacena la cadena Base64 directamente en la propiedad src
                  newComponents[index] = { ...component, src: base64String };
                  data.updateNodeData(nodeId, { ...data, components: newComponents });
              };
              reader.onerror = (error) => console.error("Error al leer el archivo:", error);
              reader.readAsDataURL(file); // Convertir a Base64
          }
      };
      // --- ✅ FIN MANEJO DE IMAGEN ---


      switch (component.type) {
          case 'TextBody':
              return (
                <div>
                    <div className="flex justify-between items-center">
                        <span className={componentHeaderClasses}>Cuerpo de Texto</span>
                        {/* El botón de emoji se ha movido de aquí */}
                    </div>
                    <textarea
                        name="text"
                        value={component.text || ''}
                        onChange={handleComponentChange}
                        onInput={(e) => {
                            e.target.style.height = 'auto'; // Resetea la altura
                            e.target.style.height = (e.target.scrollHeight) + 'px'; // Ajusta la altura al contenido
                        }}
                        placeholder="Escribe el texto aquí..."
                        className={`${textInputClasses} min-h-[80px] overflow-y-hidden resize-none`}
                    />

                    {/* --- ✅ INICIO DE CAMBIO DE COLOR --- */}
                    <button
                        onClick={() => setPickerOpenForIndex(pickerOpenForIndex === index ? null : index)}
                        // Se cambió text-gray-500 por text-blue-500 y el hover
                        className="clickable-icon mt-1 text-blue-500 hover:text-blue-700"
                        style={{ padding: '4px' }} // Mantenemos padding fino
                        title="Añadir emoji">
                        <FaSmile size={14} />
                    </button>
                    {/* --- ✅ FIN DE CAMBIO DE COLOR --- */}

                    {/* --- SELECTOR DE EMOJIS (Renderizado condicional) --- */}
                    {pickerOpenForIndex === index && (
                        <div
                           className="relative z-10 mt-1"
                           // Detiene la propagación del scroll del mouse
                           onWheel={(e) => e.stopPropagation()}
                        >
                            <Picker onEmojiClick={onEmojiClick} />
                            <button
                                onClick={() => setPickerOpenForIndex(null)}
                                // Botón de cerrar (Estilo "obvio" - Rojo)
                                className="cursor-pointer text-xs font-medium text-white bg-red-600 border border-red-600 py-1 px-3 rounded-full float-right mt-2 hover:bg-red-700 transition-colors"
                            >
                                Cerrar Emojis
                            </button>
                        </div>
                    )}
                    {/* --- FIN SELECTOR DE EMOJIS --- */}
                </div>
              );
          case 'TextInput':
              return (
                   <div>
                       <div className="flex justify-between items-center">
                            <span className={componentHeaderClasses}>Campo de Texto (Input)</span>
                       </div>
                      <input
                        name="label"
                        value={component.label || ''}
                        onChange={handleComponentChange}
                        placeholder="Etiqueta del campo (ej: 'Nombre Completo')"
                        className={`${textInputClasses} mb-1`}
                      />
                      <input
                        name="name"
                        value={component.name || ''}
                        onChange={handleComponentChange}
                        placeholder="nombre_variable (ej: 'full_name')"
                        className={`${textInputClasses} text-[11px]`}
                      />
                  </div>
              )
         case 'RadioButtonsGroup':
         return (
               <div>
                  <span className={componentHeaderClasses}>Opciones de Respuesta</span>
                  {(component.options || []).map((opt, optIndex) => {
                      const handleId = `${nodeId}-component-${index}-option-${optIndex}`; // ID del Handle para la conexión
                      
                      return (
                      <div key={opt.id} className="relative flex items-center py-2 gap-2 border-b border-gray-100">
                         <input type="radio" name={`radio_group_${nodeId}_${index}`} className="ml-1 flex-shrink-0" disabled/>
                         
                         <div className="flex-1 space-y-1.5">
                            <input
                              value={opt.title} // <--- CORRECCIÓN CLAVE: Esto restaura el nombre de la opción
                              // Modificado para solo enviar el título
                              onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                              placeholder="Texto de la opción (ej: Mantenimiento)"
                              className="w-full border border-gray-200 rounded p-1.5 text-sm"
                            />
                            
                            {/* Opcional: Mostrar el ID pero deshabilitado, para depuración */}
                            <p className="text-xs text-gray-400 font-mono pl-1">ID: {opt.id}</p>
                         </div>

                         <button onClick={() => removeOption(optIndex)} className="clickable-icon text-red-500 z-10 self-center" style={{ padding: '4px' }} title="Eliminar opción">
                            <FaTrash size={12}/>
                         </button>
                         
                         {/* [BOTÓN DE DESCONEXIÓN] (Añadido en el paso anterior) */}
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              data.removeEdge(nodeId, handleId); // Llama a la función removeEdge
                            }}
                            className="z-20 text-gray-500 hover:text-red-500 p-1.5"
                            title="Desconectar"
                            style={{
                                position: 'absolute',
                                right: '25px', 
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                border: '1px solid #ddd',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                         >
                            <FaTimes size={10} />
                         </button>
                         
                         {/* Este es el 'Handle' para conectar la opción a otra pantalla */}
                         <Handle type="source" position={Position.Right} id={handleId} className="custom-handle" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                  )})}
                  <button onClick={addOption} className="text-xs text-blue-600 mt-2.5 cursor-pointer">
                    + Agregar opción
                  </button>
              </div>
          );
          case 'Image':
              return (
                  <div>
                      <div className="flex justify-between items-center">
                          <span className={componentHeaderClasses}>Imagen</span>
                      </div>
                      <input
                          type="file"
                          accept="image/*" // Aceptar solo archivos de imagen
                          onChange={handleImageChange} // Llama a la nueva función
                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {/* Muestra una vista previa si ya hay una imagen cargada (en Base64) */}
                      {component.src && <img src={component.src} alt="Preview" className="mt-2 rounded max-h-40 w-auto mx-auto"/>}
                  </div>
              )
          // --- ✅ FIN RENDER COMPONENTE IMAGEN ---
          default:
              return <p className="text-xs text-gray-500">Componente '{component.type}' no implementado aún.</p>;
      }
  };
  // --- Fin Componentes Internos ---


const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'title') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    data.updateNodeData(id, { ...data, [name]: finalValue });
  };

  const addComponent = (type) => {
    const newComponent = { type: type, id: `${type.toLowerCase()}_${(data.components?.length || 0) + 1}` };
    if (type === 'TextInput') {
        newComponent.label = '';
        newComponent.name = '';
    }
    if (type === 'TextBody') newComponent.text = '';
    if (type === 'RadioButtonsGroup') newComponent.options = [];
    if (type === 'Image') newComponent.src = null; // --- ✅ Inicializa src para imagen ---
    data.updateNodeData(id, { ...data, components: [...(data.components || []), newComponent] });
  };

  const deleteComponent = (componentIndex) => {
      const newComponents = data.components.filter((_, index) => index !== componentIndex);
      data.updateNodeData(id, { ...data, components: newComponents });
  };

  return (
    <>
      {/* Estilos para React Flow y hovers (difíciles de hacer con Tailwind) */}
      <style>{`
        .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; right: -32px; display: flex; align-items: center; justify-content: center; }
        .custom-handle::after { content: '+'; font-size: 16px; color: #718096; font-weight: bold; }
        .custom-handle:hover { transform: scale(1.15); background: #48bb78; border-color: #2f855a; }
        .custom-handle:hover::after, .react-flow__handle.connecting::after { color: white; }
        .react-flow__handle.connecting { transform: scale(1.2); background: #e53e3e; border-color: #9b2c2c; }
        .editable-container .edit-icon { display: none; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #a0aec0; pointer-events: none; z-index: 10; }
        .editable-container:hover .edit-icon { display: block; }
        .editable-field:focus { border-color: #4299e1; box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5); outline: none; }
        .footer-input::placeholder { color: rgba(255, 255, 255, 0.7); }
        .clickable-icon { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
        .clickable-icon:hover { background-color: #f1f5f9; }
        .delete-component-btn { position: absolute; top: -10px; right: -10px; background: white; border-radius: 50%; border: 1px solid #e2e8f0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #f56565; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .delete-component-btn:hover { background: #f56565; color: white; }
      `}</style>


      <div className={nodeClasses}>
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-32px'}}/>

        <div className={headerClasses}>
            {/* ✅ CAMBIO: Añadido ícono y color */}
            <div className="editable-container flex-1 relative flex items-center">
                <FaThLarge className="mr-2 text-blue-600" /> 
                <input
                    name="title"
                    value={data.title}
                    onChange={handleChange}
                    placeholder="Escribe el título de la pantalla..."
                    className="editable-field w-[calc(100%-40px)] bg-transparent focus:outline-none font-semibold text-gray-800"
                />
                <FaPen className="edit-icon" size={12}/>
            </div>
            <button onClick={() => data.deleteNode(id)} className="clickable-icon text-gray-500" title="Eliminar pantalla">
                <FaTimes />
            </button>
        </div>

        <div className={bodyClasses}>
            {(data.components || []).map((comp, index) => (
                <div key={index} className={componentContainerClasses}>
                    {renderComponent(comp, index, id, data)}
                    <button onClick={() => deleteComponent(index)} className="delete-component-btn" title="Eliminar componente">
                        <FaTimes size={12} />
                    </button>
                </div>
            ))}

            <div className="mt-4 pt-2.5 border-t border-gray-100 flex justify-around">
                <button onClick={() => addComponent('TextBody')} title="Añadir Texto" className="clickable-icon"><FaHeading/></button>
                <button onClick={() => addComponent('TextInput')} title="Añadir Campo de Formulario" className="clickable-icon"><FaKeyboard/></button>
                <button onClick={() => addComponent('RadioButtonsGroup')} title="Añadir Opciones" className="clickable-icon"><FaDotCircle/></button>
                <button onClick={() => addComponent('Image')} title="Añadir Imagen" className="clickable-icon"><FaImage/></button>
            </div>
        </div>

        <div className={footerClasses}>
            <div className="editable-container relative">
                <input
                  name="footer_label"
                  value={data.footer_label}
                  onChange={handleChange}
                  placeholder="Texto del botón final..."
                  className={footerInputClasses}
                />
                <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7, right: '15px'}}/>
            </div>
             <button
              onClick={() => data.openPreviewModal(data)}
              className="text-xs text-center text-gray-500 hover:text-blue-600 mt-2 block w-full cursor-pointer"
            >
              Vista Previa
            </button>
        </div>
      </div>
    </>
  );
}