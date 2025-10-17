// src/components/FlowScreenNode.jsx

import React from 'react';
import { Handle, Position } from 'reactflow';
import { FaTrash, FaPen, FaTimes, FaPlus, FaImage, FaKeyboard, FaDotCircle, FaHeading } from 'react-icons/fa';

// --- Estilos ---
const nodeStyle = {
  background: 'white', border: '1px solid #ddd', borderRadius: '12px',
  padding: '0', width: '350px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontFamily: 'sans-serif'
};
const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#f7f7f7', borderBottom: '1px solid #eee', padding: '10px 15px',
  borderTopLeftRadius: '12px', borderTopRightRadius: '12px', fontWeight: '600',
  position: 'relative'
};
const bodyStyle = { padding: '15px' };
const editableInputStyle = {
  width: '100%',
  padding: '8px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  background: '#fdfdfd',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const optionStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '5px 0', 
  position: 'relative'
};
const footerStyle = {
  background: '#f7f7f7', borderTop: '1px solid #eee', padding: '10px 15px',
  borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px',
};
const footerInputStyle = {
  width: '100%',
  background: '#25D366',
  color: 'white',
  border: '2px solid #22c55e',
  padding: '10px',
  borderRadius: '8px',
  fontWeight: 'bold',
  textAlign: 'center',
};
const componentContainerStyle = {
    border: '1px dashed #e2e8f0',
    borderRadius: '8px',
    padding: '10px',
    margin: '10px 0',
    position: 'relative'
};
const componentHeaderStyle = {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#a0aec0',
    textTransform: 'uppercase',
    marginBottom: '5px'
};
// --- Fin Estilos ---


// --- Componentes Internos para cada tipo de bloque ---
const renderComponent = (component, index, nodeId, data) => {
    const handleComponentChange = (e) => {
        const { name, value } = e.target;
        const newComponents = [...(data.components || [])];
        newComponents[index] = { ...component, [name]: value };
        data.updateNodeData(nodeId, { ...data, components: newComponents });
    };

    const handleOptionChange = (optionIndex, value) => {
        const newComponents = [...(data.components || [])];
        const newOptions = [...(component.options || [])];
        newOptions[optionIndex] = { ...newOptions[optionIndex], title: value };
        newComponents[index] = { ...component, options: newOptions };
        data.updateNodeData(nodeId, { ...data, components: newComponents });
    };

    const addOption = () => {
        const newOption = { id: `option_${(component.options?.length || 0) + 1}`, title: '' };
        const newComponents = [...(data.components || [])];
        newComponents[index] = { ...component, options: [...(component.options || []), newOption] };
        data.updateNodeData(nodeId, { ...data, components: newComponents });
    };

    // --- NUEVA FUNCIÓN PARA ELIMINAR UNA OPCIÓN ESPECÍFICA ---
    const removeOption = (optionIndexToRemove) => {
        const newComponents = [...(data.components || [])];
        const newOptions = component.options.filter((_, i) => i !== optionIndexToRemove);
        newComponents[index] = { ...component, options: newOptions };
        data.updateNodeData(nodeId, { ...data, components: newComponents });
    };

    switch (component.type) {
        case 'TextBody':
            return ( <div> <span style={componentHeaderStyle}>Cuerpo de Texto</span> <textarea name="text" value={component.text || ''} onChange={handleComponentChange} placeholder="Escribe el texto aquí..." style={{ width: '100%', border: '1px solid #eee', borderRadius: '4px', padding: '5px' }} /> </div> );
        case 'TextInput':
            return ( <div> <span style={componentHeaderStyle}>Campo de Texto (Input)</span> <input name="label" value={component.label || ''} onChange={handleComponentChange} placeholder="Etiqueta del campo (ej: 'Nombre Completo')" style={{ width: '100%', border: '1px solid #eee', borderRadius: '4px', padding: '5px' }}/> </div> )
        case 'RadioButtonsGroup':
            return (
                 <div>
                    <span style={componentHeaderStyle}>Opciones de Respuesta</span>
                    {(component.options || []).map((opt, optIndex) => (
                        <div key={optIndex} style={optionStyle}>
                           <input type="radio" name={`radio_group_${nodeId}_${index}`} style={{marginRight: '10px'}}/>
                           <input value={opt.title} onChange={(e) => handleOptionChange(optIndex, e.target.value)} placeholder="Texto de la opción" style={{flex: 1, border: '1px solid #f0f0f0', borderRadius: '4px', padding: '5px'}} />
                           {/* --- BOTÓN PARA ELIMINAR LA OPCIÓN --- */}
                           <button onClick={() => removeOption(optIndex)} className="clickable-icon" style={{color: '#ef4444', zIndex: 2}}>
                               <FaTrash size={12}/>
                           </button>
                           <Handle type="source" position={Position.Right} id={`${nodeId}-component-${index}-option-${optIndex}`} className="custom-handle" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    ))}
                    <button onClick={addOption} style={{ all: 'unset', fontSize: '12px', color: '#007bff', marginTop: '10px', cursor: 'pointer' }}>+ Agregar opción</button>
                </div>
            )
        default:
            return <p style={{fontSize: '12px', color: '#777'}}>Componente '{component.type}' no implementado aún.</p>;
    }
};


export default function FlowScreenNode({ data, id }) {

  const handleChange = (e) => data.updateNodeData(id, { ...data, [e.target.name]: e.target.value });

  const addComponent = (type) => {
    const newComponent = { type: type, id: `${type.toLowerCase()}_${(data.components?.length || 0) + 1}` };
    if (type === 'TextInput') newComponent.label = '';
    if (type === 'TextBody') newComponent.text = '';
    if (type === 'RadioButtonsGroup') newComponent.options = [];
    data.updateNodeData(id, { ...data, components: [...(data.components || []), newComponent] });
  };
  
  const deleteComponent = (componentIndex) => {
      const newComponents = data.components.filter((_, index) => index !== componentIndex);
      data.updateNodeData(id, { ...data, components: newComponents });
  };

  return (
    <>
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
      
      <div style={nodeStyle}>
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-32px'}}/>

        <div style={headerStyle}>
            <div className="editable-container" style={{ flex: 1, position: 'relative' }}>
                <input name="title" value={data.title} onChange={handleChange} placeholder="Escribe el título de la pantalla..." className="editable-field" style={{ all: 'unset', width: 'calc(100% - 20px)'}} />
                <FaPen className="edit-icon" size={12}/>
            </div>
            <button onClick={() => data.deleteNode(id)} className="clickable-icon" style={{ color: '#718096' }} title="Eliminar pantalla">
                <FaTimes />
            </button>
        </div>

        <div style={bodyStyle}>
            {(data.components || []).map((comp, index) => (
                <div key={index} style={componentContainerStyle}>
                    {renderComponent(comp, index, id, data)}
                    <button onClick={() => deleteComponent(index)} className="delete-component-btn" title="Eliminar componente">
                        <FaTimes size={12} />
                    </button>
                </div>
            ))}
          
            <div style={{marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-around'}}>
                <button onClick={() => addComponent('TextBody')} title="Añadir Texto" className="clickable-icon"><FaHeading/></button>
                <button onClick={() => addComponent('TextInput')} title="Añadir Campo de Formulario" className="clickable-icon"><FaKeyboard/></button>
                <button onClick={() => addComponent('RadioButtonsGroup')} title="Añadir Opciones" className="clickable-icon"><FaDotCircle/></button>
                <button onClick={() => addComponent('Image')} title="Añadir Imagen" className="clickable-icon"><FaImage/></button>
            </div>
        </div>
        
        <div style={footerStyle}>
            <div className="editable-container" style={{ position: 'relative' }}>
                <input name="footer_label" value={data.footer_label} onChange={handleChange} placeholder="Texto del botón final..." className="editable-field footer-input" style={footerInputStyle} />
                <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7, right: '15px'}}/>
            </div>
        </div>
      </div>
    </>
  );
}