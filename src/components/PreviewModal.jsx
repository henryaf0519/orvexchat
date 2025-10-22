// src/components/PreviewModal.jsx
import React from 'react';
import { FaTimes, FaImage, FaHeading, FaKeyboard, FaDotCircle } from 'react-icons/fa';

// Componente auxiliar para renderizar cada tipo de elemento del Flow
const RenderFlowComponent = ({ component }) => {
    switch (component.type) {
        case 'Image':
            const imageSrc = component.src || 'https://via.placeholder.com/600x314.png?text=Imagen';
            // Aplicar borde redondeado solo si NO es el primer elemento o si hay otros elementos
            return <img src={imageSrc} alt="Preview" className="w-full h-auto object-cover block" />; // Quitado rounded-t-lg por defecto
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
                    <input
                        type="text"
                        placeholder={`Escribe ${component.label || 'aquí'}...`}
                        disabled
                        className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                    />
                </div>
            );
        case 'RadioButtonsGroup':
            return (
                <div className="px-4 py-3 space-y-1">
                     <span className="block text-xs font-medium text-gray-500 mb-2">Selecciona una opción:</span>
                    {(component.options || []).map((opt, index) => (
                        <div key={index} className="flex items-center p-2 rounded hover:bg-gray-100 border border-transparent -ml-2"> {/* Ajuste de margen negativo para alinear */}
                            <input type="radio" name={`preview-radio-${component.id}`} disabled className="mr-2 ml-1 h-4 w-4 text-green-600 cursor-not-allowed border-gray-300 focus:ring-green-500 focus:ring-offset-0 focus:ring-1" />
                            <span className="text-sm text-gray-800">{opt.title || `Opción ${index + 1}`}</span>
                        </div>
                    ))}
                </div>
            );
        default:
            return <p className="text-xs text-red-500 px-4 py-1">Componente no soportado: {component.type}</p>;
    }
};

export default function PreviewModal({ nodeData, onClose }) {
    if (!nodeData) return null;

    const { title, components = [], footer_label } = nodeData;
    const hasImageAtTop = components.length > 0 && components[0].type === 'Image';

    return (
        // --- ✅ Vuelve el fondo semitransparente ---
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose} // Cierra al hacer clic fuera
        >
            {/* --- ✅ Contenedor del Teléfono Simulado --- */}
            <div
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-[370px] h-[740px] transform transition-all duration-300 scale-100 flex flex-col overflow-hidden border-[10px] border-black ring-1 ring-gray-700" // Ajuste de bordes y redondeo
                onClick={(e) => e.stopPropagation()} // Evita cierre al hacer clic dentro
            >
                {/* Cabecera del Flow (simulada) */}
                <header className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 relative">
                     {/* Notch simulado (opcional) */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl"></div>
                    <button onClick={onClose} className="text-gray-600 hover:text-black z-10 p-1 rounded-full hover:bg-gray-200">
                        <FaTimes size={16} />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-700 truncate absolute left-1/2 transform -translate-x-1/2">{title || 'Vista Previa'}</h3>
                    <div className="w-6 z-10"></div> {/* Espaciador */}
                </header>

                {/* Cuerpo del Flow (scrollable) */}
                <div className="flex-grow overflow-y-auto bg-white">
                    {components.map((component, index) => (
                         // No añadir borde si es imagen al inicio o si es el último componente antes del footer
                        <div key={component.id || index} className={`${(component.type === 'Image' && index === 0) || index === components.length - 1 ? '' : 'border-b border-gray-100'}`}>
                             <RenderFlowComponent component={component} />
                        </div>
                    ))}
                </div>

                {/* Pie de Página (Footer) */}
                <footer className="p-4 pt-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                     <button
                        disabled
                        className="w-full bg-green-600 text-white p-2.5 rounded-lg font-semibold text-sm cursor-not-allowed opacity-90"
                    >
                        {footer_label || 'Continuar'}
                    </button>
                     <p className="text-[10px] text-center text-gray-400 mt-2">Administrado por la empresa.</p>
                </footer>
            </div>

            {/* Estilos para la animación */}
             <style jsx>{`
                @keyframes fade-in {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                .animate-fade-in {
                  animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}