// src/components/PreviewModal.jsx
import React from 'react';
import { FaTimes, FaImage, FaHeading, FaKeyboard, FaDotCircle } from 'react-icons/fa';

// Componente auxiliar para NODO NORMAL (screenNode)
const RenderScreenComponent = ({ component }) => {
    // (Mantenemos la lógica de RenderFlowComponent de la respuesta anterior aquí)
    switch (component.type) {
        case 'Image':
            const imageSrc = component.src || 'https://via.placeholder.com/600x314.png?text=Imagen';
            return <img src={imageSrc} alt="Preview" className="w-full h-auto object-cover block" />;
        case 'TextHeading':
             return <h2 className="text-xl font-semibold text-gray-800 px-4 pt-4 pb-1">{component.text || 'Título'}</h2>;
        case 'TextBody':
            return <p className="text-sm text-gray-700 px-4 py-2 whitespace-pre-wrap">{component.text || 'Cuerpo del texto...'}</p>;
        case 'TextCaption':
             return <p className="text-xs text-gray-500 px-4 pb-2 pt-1">{component.text || 'Caption...'}</p>;
        case 'TextInput':
            return (
                <div className="px-4 py-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">{component.label || 'Input Label'}</label>
                    <input type="text" placeholder={`Escribe ${component.label || 'aquí'}...`} disabled className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-100 cursor-not-allowed" />
                </div>
            );
        case 'RadioButtonsGroup':
            return (
                <div className="px-4 py-3 space-y-1">
                     <span className="block text-xs font-medium text-gray-500 mb-2">{component.label || 'Selecciona una opción:'}</span>
                     {/* 👇 CORRECCIÓN: Leer desde component.options 👇 */}
                    {(component.options || []).map((opt, index) => (
                        <div key={opt.id || index} className="flex items-center p-2 rounded hover:bg-gray-100 border border-transparent -ml-2">
                            <input type="radio" name={`preview-radio-${component.name || index}`} disabled className="mr-2 ml-1 h-4 w-4 text-green-600 cursor-not-allowed border-gray-300 focus:ring-green-500 focus:ring-offset-0 focus:ring-1" />
                            <span className="text-sm text-gray-800">{opt.title || `Opción ${index + 1}`}</span>
                        </div>
                    ))}
                </div>
            );
        default:
            return <p className="text-xs text-red-500 px-4 py-1">Componente no soportado: {component.type}</p>;
    }
};

// Componente auxiliar para NODO CATÁLOGO (catalogNode)
const RenderCatalogContent = ({ nodeData }) => {
    return (
        <>
            {/* Texto introductorio */}
            {nodeData.introText && <p className="text-sm text-gray-700 px-4 py-2 whitespace-pre-wrap">{nodeData.introText}</p>}

            {/* Productos */}
            {(nodeData.products || []).map((product, index) => (
                <div key={product.id || index} className="border-b border-gray-100 pb-3 mb-3">
                    {product.imageBase64 && <img src={product.imageBase64} alt={product.title || 'Producto'} className="w-full h-auto object-cover block" />}
                    <p className="text-sm text-gray-800 px-4 pt-2 whitespace-pre-wrap">
                        {product.title ? `**${product.title}**\n` : ''}
                        {product.description ? `${product.description}\n` : ''}
                        {product.price ? `Precio: ${product.price}` : ''}
                    </p>
                </div>
            ))}

            {/* Radio Buttons del catálogo */}
            {(nodeData.radioOptions || []).length > 0 && (
                <div className="px-4 py-3 space-y-1">
                    <span className="block text-xs font-medium text-gray-500 mb-2">{nodeData.radioLabel || 'Selecciona:'}</span>
                    {(nodeData.radioOptions || []).map((opt, index) => (
                        <div key={opt.id || index} className="flex items-center p-2 rounded hover:bg-gray-100 border border-transparent -ml-2">
                            <input type="radio" name="catalog-preview-radio" disabled className="mr-2 ml-1 h-4 w-4 text-green-600 cursor-not-allowed border-gray-300 focus:ring-green-500 focus:ring-offset-0 focus:ring-1" />
                            <span className="text-sm text-gray-800">{opt.title || `Opción ${index + 1}`}</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};


export default function PreviewModal({ nodeData, onClose }) {
    if (!nodeData) return null;

    // Detecta si es nodo de catálogo (basado en la presencia de 'products', podrías pasar el tipo si es más robusto)
    const isCatalogNode = Array.isArray(nodeData.products);
    const title = nodeData.title;
    const footer_label = nodeData.footer_label;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-[370px] h-[740px] transform transition-all duration-300 flex flex-col overflow-hidden border-[10px] border-black ring-1 ring-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera */}
                 <header className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 relative">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl"></div>
                    <button onClick={onClose} className="text-gray-600 hover:text-black z-10 p-1 rounded-full hover:bg-gray-200">
                        <FaTimes size={16} />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-700 truncate absolute left-1/2 transform -translate-x-1/2">{title || (isCatalogNode ? 'Catálogo' : 'Vista Previa')}</h3>
                    <div className="w-6 z-10"></div>
                </header>

                {/* Cuerpo (Scrollable) */}
                <div className="flex-grow overflow-y-auto bg-white">
                   {isCatalogNode ? (
                       <RenderCatalogContent nodeData={nodeData} />
                   ) : (
                       /* Renderizado para screenNode normal */
                       (nodeData.components || []).map((component, index) => (
                            <div key={component.id || index} className={`${(component.type === 'Image' && index === 0) || index === nodeData.components.length - 1 ? '' : 'border-b border-gray-100'}`}>
                                 <RenderScreenComponent component={component} />
                            </div>
                       ))
                   )}
                </div>

                {/* Footer */}
                <footer className="p-4 pt-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                     <button
                        disabled
                        className="w-full bg-green-600 text-white p-2.5 rounded-lg font-semibold text-sm cursor-not-allowed opacity-90" >
                        {footer_label || 'Continuar'}
                    </button>
                     <p className="text-[10px] text-center text-gray-400 mt-2">Administrado por la empresa.</p>
                </footer>
            </div>
             <style jsx>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                /* Estilos para scrollbar si quieres personalizarlos */
                .overflow-y-auto::-webkit-scrollbar { width: 4px; }
                .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
                .overflow-y-auto::-webkit-scrollbar-track { background-color: #f1f5f9; }
            `}</style>
        </div>
    );
}