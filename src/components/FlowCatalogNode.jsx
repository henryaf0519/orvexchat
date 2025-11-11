// src/components/FlowCatalogNode.jsx
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
// ✅ CAMBIO: Ícono añadido
import { FaTrash, FaPen, FaTimes, FaPlus, FaShoppingCart } from 'react-icons/fa'; 

// Estilos (puedes ajustarlos o moverlos a CSS/Tailwind)
// ✅ CAMBIO: Borde verde
const nodeClasses = "relative bg-white border border-green-400 rounded-xl w-[380px] shadow-lg font-sans"; 
// ✅ CAMBIO: Cabecera verde
const headerClasses = "flex items-center justify-between bg-green-50 border-b border-green-300 py-2.5 px-4 rounded-t-xl font-semibold relative"; 
const bodyClasses = "p-4 max-h-[400px] overflow-y-auto"; // Body con scroll
const sectionHeaderClasses = "text-sm font-semibold text-gray-700 mt-4 mb-2 border-b pb-1";
const productContainerClasses = "border border-dashed border-gray-200 rounded-lg p-3 my-2 relative bg-gray-50";
const inputClasses = "w-full border border-gray-300 rounded p-1.5 text-sm mb-1 bg-white";
const textAreaClasses = "w-full border border-gray-300 rounded p-1.5 text-sm mb-1 min-h-[60px] resize-none bg-white";
const fileInputClasses = "w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2";
const footerClasses = "bg-gray-50 border-t border-gray-200 py-2.5 px-4 rounded-b-xl";
const footerInputClasses = "editable-field footer-input w-full bg-green-500 text-white border-2 border-green-600 p-2.5 rounded-lg font-bold text-center placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-green-400";
const clickableIconClasses = "clickable-icon p-1 text-gray-500 hover:text-black cursor-pointer"; // Reutilizable
const deleteBtnClasses = "delete-component-btn absolute top-1 right-1 bg-white rounded-full border border-gray-300 w-5 h-5 flex items-center justify-center cursor-pointer text-red-500 hover:bg-red-500 hover:text-white shadow-sm"; // Reutilizable


export default function FlowCatalogNode({ data, id }) {
  // Función genérica para actualizar cualquier campo de primer nivel en 'data'
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'title') {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    data.updateNodeData(id, { ...data, [name]: finalValue });
  };

  // --- Funciones para Productos ---
  const addProduct = () => {
    const newProduct = { id: `prod_${Date.now()}`, imageBase64: null, title: '', description: '', price: '' };
    const newProducts = [...(data.products || []), newProduct];
    data.updateNodeData(id, { ...data, products: newProducts });
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...data.products];
    if (newProducts[index]) { // Verifica que el índice exista
        newProducts[index] = { ...newProducts[index], [field]: value };
        data.updateNodeData(id, { ...data, products: newProducts });
    }
  };

  const handleProductImageChange = (index, e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => updateProduct(index, 'imageBase64', loadEvent.target.result);
          reader.onerror = (error) => console.error("Error reading file:", error);
          reader.readAsDataURL(file);
      } else {
          updateProduct(index, 'imageBase64', null);
      }
  };

  const removeProduct = (index) => {
    const newProducts = (data.products || []).filter((_, i) => i !== index);
    data.updateNodeData(id, { ...data, products: newProducts });
  };

  // --- Funciones para Opciones de Radio ---
  const addRadioOption = () => {
      const newOption = { id: `cat_opt_${(data.radioOptions?.length || 0) + 1}`, title: '' };
      const newOptions = [...(data.radioOptions || []), newOption];
      data.updateNodeData(id, { ...data, radioOptions: newOptions });
  };

  const updateRadioOption = (index, field, value) => { // Acepta 'field' (será 'title')
      const newOptions = [...data.radioOptions];
      if (newOptions[index]) {
        newOptions[index] = { ...newOptions[index], [field]: value };
        data.updateNodeData(id, { ...data, radioOptions: newOptions });
      }
  };

   const removeRadioOption = (indexToRemove) => {
      const newOptions = (data.radioOptions || []).filter((_, i) => i !== indexToRemove);
      data.updateNodeData(id, { ...data, radioOptions: newOptions });
  };


  return (
    <>
      <style>{`
+        .custom-handle { width: 24px; height: 24px; background: #edf2f7; border: 2px solid #a0aec0; border-radius: 50%; transition: all 0.2s ease; /* Ajusta 'right' según necesidad */ display: flex; align-items: center; justify-content: center; }
+        .custom-handle::after { content: '+'; font-size: 16px; color: #718096; font-weight: bold; }
+        .custom-handle:hover { transform: scale(1.15); background: #48bb78; border-color: #2f855a; }
+        .custom-handle:hover::after, .react-flow__handle.connecting::after { color: white; }
+        .react-flow__handle.connecting { transform: scale(1.2); background: #e53e3e; border-color: #9b2c2c; }
+        .editable-container:hover .edit-icon { display: inline-block; }
+        .edit-icon { display: none; margin-left: 5px; color: #9ca3af; }
+        .clickable-icon:hover { background-color: #f3f4f6; border-radius: 50%;}
+        .delete-component-btn { position: absolute; top: 1px; right: 1px; background: white; border-radius: 50%; border: 1px solid #e2e8f0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #f56565; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
+        .delete-component-btn:hover { background: #f56565; color: white; }
+        /* Ajusta estilos de .editable-field, .footer-input si es necesario */
+      `}</style>

      <div className={nodeClasses}>
        <Handle type="target" position={Position.Left} className="custom-handle" style={{left: '-32px'}} id={`${id}-target`}/>

        {/* Cabecera */}
        <div className={headerClasses}>
            {/* ✅ CAMBIO: Añadido ícono y color */}
            <div className="editable-container flex-1 relative flex items-center">
                <FaShoppingCart className="mr-2 text-green-600" />
                <input
                    name="title"
                    value={data.title || ''}
                    onChange={handleChange}
                    placeholder="Título Catálogo..."
                    className="editable-field flex-grow bg-transparent focus:outline-none font-semibold text-gray-800"
                />
                <FaPen className="edit-icon" size={12}/>
            </div>
            <button onClick={() => data.deleteNode(id)} className={clickableIconClasses} title="Eliminar pantalla">
                <FaTimes size={14} />
            </button>
        </div>

        {/* Cuerpo */}
        <div className={bodyClasses}>
            {/* Texto Intro */}
            <div className="mb-3">
                 <label className="text-xs font-medium text-gray-500 block mb-1">Texto Introductorio</label>
                 <textarea
                    name="introText"
                    value={data.introText || ''}
                    onChange={handleChange}
                    placeholder="Introduce el texto aquí..."
                    className={textAreaClasses}
                    rows={2}
                 />
            </div>

            {/* Productos */}
            <h3 className={sectionHeaderClasses}>Productos</h3>
            {(data.products || []).map((product, index) => (
                <div key={product.id} className={productContainerClasses}>
                    <button onClick={() => removeProduct(index)} className={deleteBtnClasses} title="Eliminar producto">
                        <FaTrash size={10} />
                    </button>

                    <label className="text-xs font-medium text-gray-500 block mb-1">Imagen Producto {index + 1}</label>
                    <input type="file" accept="image/*" onChange={(e) => handleProductImageChange(index, e)} className={fileInputClasses} />
                    {product.imageBase64 && <img src={product.imageBase64} alt="Preview" className="mb-2 rounded max-h-20 w-auto"/>}

                    <label className="text-xs font-medium text-gray-500 block mb-1">Título</label>
                    <input type="text" value={product.title || ''} onChange={(e) => updateProduct(index, 'title', e.target.value)} placeholder="Nombre Producto" className={inputClasses} />

                    <label className="text-xs font-medium text-gray-500 block mb-1">Descripción</label>
                    <textarea value={product.description || ''} onChange={(e) => updateProduct(index, 'description', e.target.value)} placeholder="Descripción corta..." className={textAreaClasses} rows={2} />

                    <label className="text-xs font-medium text-gray-500 block mb-1">Precio</label>
                    <input type="text" value={product.price || ''} onChange={(e) => updateProduct(index, 'price', e.target.value)} placeholder="Ej: $10.000" className={inputClasses} />
                </div>
            ))}
             <button onClick={addProduct} className="text-xs text-blue-600 mt-2 cursor-pointer flex items-center gap-1 hover:text-blue-800">
                <FaPlus size={10}/> Añadir Producto
            </button>

             {/* Opciones Radio */}
             <h3 className={sectionHeaderClasses}>Opción de Selección</h3>
              <div className="mb-2">
                 <label className="text-xs font-medium text-gray-500 block mb-1">Etiqueta (Pregunta)</label>
                 <input
                    name="radioLabel"
                    value={data.radioLabel || ''}
                    onChange={handleChange}
                    placeholder="Ej: ¿Cuál te interesa más?"
                    className={inputClasses}
                 />
            </div>
             {(data.radioOptions || []).map((opt, index) => {
                const handleId = `${id}-catalog-option-${index}`;
                return (
                <div key={opt.id || index} className="flex items-center py-1 gap-1 relative pl-1">
                    <span className="text-gray-400 mr-1">•</span>
                    {/* ... input de título ... */}

                    {/* [NUEVO BOTÓN] para opciones de Catálogo */}
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          data.removeEdge(id, handleId); // Llama a la función removeEdge
                        }}
                        className="z-10 text-gray-500 hover:text-red-500 p-1.5"
                        title="Desconectar"
                        style={{
                            position: 'absolute',
                            right: '48px', // Ajustado para no chocar con el handle
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
                    
                    <button onClick={() => removeRadioOption(index)} className={`${clickableIconClasses} !text-red-500`} title="Eliminar opción">
                        <FaTrash size={12}/>
                    </button>
                    {/* Handle para conectar */}
                    <Handle type="source" position={Position.Right} id={handleId} className="custom-handle" style={{ top: '50%', transform: 'translateY(-50%)', right: '-32px' }} />
                </div>
            )})}
             <button onClick={addRadioOption} className="text-xs text-blue-600 mt-2 cursor-pointer flex items-center gap-1 hover:text-blue-800">
                <FaPlus size={10}/> Añadir Opción
            </button>
        </div>

        {/* Pie de Página */}
        <div className={footerClasses}>
            <div className="editable-container relative">
                <input
                  name="footer_label"
                  value={data.footer_label || ''}
                  onChange={handleChange}
                  placeholder="Texto del botón final..."
                  className={footerInputClasses}
                />
                <FaPen className="edit-icon" size={12} style={{color: 'white', opacity: 0.7, right: '15px'}}/>
            </div>
             <button
              onClick={() => data.openPreviewModal({ ...data, type: 'catalogNode' })} // Pasa el tipo para que PreviewModal sepa cómo renderizar
              className="text-xs text-center text-gray-500 hover:text-blue-600 mt-2 block w-full cursor-pointer"
            >
              Vista Previa
            </button>
        </div>
      </div>
    </>
  );
}