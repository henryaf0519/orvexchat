// src/components/FlowScreenNode.jsx

import React from 'react';
import { Handle, Position } from 'reactflow';
import { FaTrash, FaPen } from 'react-icons/fa';

// --- Estilos ---
const nodeStyle = {
  background: 'white', border: '1px solid #ddd', borderRadius: '12px',
  padding: '0', width: '350px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontFamily: 'sans-serif'
};
const headerStyle = {
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
  padding: '10px 5px', borderBottom: '1px solid #f0f0f0', 
  position: 'relative'
};
const footerStyle = {
  background: '#f7f7f7', borderTop: '1px solid #eee', padding: '10px 15px',
  borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px',
};
// --- Fin de los Estilos ---

export default function FlowScreenNode({ data, id }) {

  const handleChange = (e) => data.updateNodeData(id, { ...data, [e.target.name]: e.target.value });
  
  const handleButtonChange = (index, value) => {
    const newButtons = [...(data.buttons || [])];
    newButtons[index].title = value;
    data.updateNodeData(id, { ...data, buttons: newButtons });
  };
  
  const addButton = () => {
    const newId = `option_${(data.buttons?.length || 0) + 1}`;
    data.updateNodeData(id, { ...data, buttons: [...(data.buttons || []), { id: newId, title: '' }] });
  };
  
  const removeButton = (indexToRemove) => {
     data.updateNodeData(id, { ...data, buttons: data.buttons.filter((_, i) => i !== indexToRemove) });
  };

  return (
    <>
      <style>{`
        .custom-handle { width: 12px; height: 12px; background: #e2e8f0; border: 2px solid #94a3b8; border-radius: 50%; transition: all 0.2s ease; right: -20px; }
        .custom-handle:hover { transform: scale(1.5); background: #48bb78; border-color: #2f855a; }
        .react-flow__handle.connecting { transform: scale(1.8); background: #e53e3e; border-color: #9b2c2c; }
        
        .editable-container .edit-icon {
          display: none; 
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          pointer-events: none;
          z-index: 10;
        }
        .editable-container:hover .edit-icon { display: block; }
        .editable-field:focus { border-color: #4299e1; box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5); outline: none; }
        .footer-input::placeholder { color: rgba(255, 255, 255, 0.7); }
      `}</style>
      
      <div style={nodeStyle}>
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-20px'}}/>

        <div style={headerStyle} className="editable-container">
            <input 
              name="title" value={data.title} onChange={handleChange}
              placeholder="Escribe el título de la pantalla..."
              className="editable-field"
              style={{ all: 'unset', width: 'calc(100% - 20px)'}}
            />
            <FaPen className="edit-icon" size={12}/>
        </div>

        <div style={bodyStyle}>
          <div className="editable-container" style={{position: 'relative', marginBottom: '15px'}}>
            <textarea
              name="body" value={data.body} onChange={handleChange}
              placeholder="Escribe el cuerpo del mensaje aquí..."
              className="editable-field"
              style={{ ...editableInputStyle, height: '60px', width: '100%' }}
            />
            <FaPen className="edit-icon" size={12} style={{right: '15px'}}/>
          </div>
          
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Opciones de Respuesta:</p>

          {(data.buttons || []).map((btn, index) => (
            <div key={index} style={optionStyle} className="editable-container">
              <input type="radio" name={`radio_${id}`} style={{ marginRight: '10px' }}/>
              <input
                value={btn.title} onChange={(e) => handleButtonChange(index, e.target.value)}
                placeholder="Escribe el texto de la opción..."
                className="editable-field"
                style={{ all: 'unset', flex: 1, padding: '5px' }}
              />
              {/* --- CAMBIO #1: El lápiz ahora tiene más espacio a la derecha --- */}
              <FaPen className="edit-icon" size={12} style={{ right: '35px' }}/> 
              <button onClick={() => removeButton(index)} style={{all: 'unset', cursor: 'pointer', color: '#aaa', padding: '0 5px', zIndex: 2}}>
                  <FaTrash size={12}/>
              </button>
              <Handle
                type="source" position={Position.Right} id={`${id}-option-${index}`}
                className="custom-handle"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          ))}
          
          <button onClick={addButton} style={{ all: 'unset', fontSize: '12px', color: '#007bff', marginTop: '10px', cursor: 'pointer' }}>
            + Agregar opción
          </button>
        </div>
        
        {/* --- CAMBIO #2: Contenedor wrapper para el footer --- */}
        <div style={footerStyle}>
            <div className="editable-container" style={{ position: 'relative' }}>
                <input
                    name="footer_label"
                    value={data.footer_label}
                    onChange={handleChange}
                    placeholder="Texto del botón final..."
                    className="editable-field footer-input"
                    style={{
                        width: '100%',
                        background: '#25D366',
                        color: 'white',
                        border: '2px solid #22c55e',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}
                />
                <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7}}/>
            </div>
        </div>
      </div>
    </>
  );
} 